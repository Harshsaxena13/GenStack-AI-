from dotenv import load_dotenv
from langchain.globals import set_verbose, set_debug
from langchain_groq.chat_models import ChatGroq
from langgraph.constants import END
from langgraph.graph import StateGraph
from langgraph.prebuilt import create_react_agent

from agent.prompts import *
from agent.states import *
from agent.tools import write_file, read_file, get_current_directory, list_files, repo_browser_search

_ = load_dotenv()

set_debug(True)
set_verbose(True)

llm = ChatGroq(model="openai/gpt-oss-120b")


def planner_agent(state: dict) -> dict:
    """Converts user prompt into a structured Plan."""
    user_prompt = state["user_prompt"]
    resp = llm.with_structured_output(Plan).invoke(
        planner_prompt(user_prompt)
    )
    if resp is None:
        raise ValueError("Planner did not return a valid response.")
    return {"plan": resp}


def architect_agent(state: dict) -> dict:
    """Creates TaskPlan from Plan."""
    plan: Plan = state["plan"]
    resp = llm.with_structured_output(TaskPlan).invoke(
        architect_prompt(plan=plan.model_dump_json())
    )
    if resp is None:
        raise ValueError("Planner did not return a valid response.")

    resp.plan = plan
    print(resp.model_dump_json())
    return {"task_plan": resp}


def coder_agent(state: dict) -> dict:
    """LangGraph tool-using coder agent."""
    coder_state: CoderState = state.get("coder_state")
    if coder_state is None:
        coder_state = CoderState(task_plan=state["task_plan"], current_step_idx=0)

    steps = coder_state.task_plan.implementation_steps
    if coder_state.current_step_idx >= len(steps):
        return {"coder_state": coder_state, "status": "DONE"}

    current_task = steps[coder_state.current_step_idx]
    existing_content = read_file.run(current_task.filepath)

    # Detect file type for language-specific rules
    filepath = current_task.filepath
    is_css = filepath.endswith('.css')
    is_js  = filepath.endswith('.js')
    is_html = filepath.endswith('.html')

    comment_rule = ""
    if is_css:
        comment_rule = (
            "CRITICAL FOR CSS: Do NOT use block comments (slash-asterisk style). "
            "They break JSON serialization on Groq. Use NO comments at all in CSS files. "
            "Just write clean uncommented CSS rules.\n"
        )
    elif is_js:
        comment_rule = (
            "CRITICAL FOR JS: Do NOT use block comments (slash-asterisk style). "
            "Use only single-line comments (//) if needed, or no comments at all.\n"
        )

    system_prompt = (
        "You are an expert software engineer. Your ONLY job is to write complete, fully working code and save it using write_file.\n"
        "STRICT RULES:\n"
        "1. Write COMPLETE files - never use placeholders like '// ... rest of code' or 'TODO'.\n"
        "2. For HTML/CSS/JS: all interactivity (buttons, forms, inputs) MUST be fully implemented and functional.\n"
        "3. Always use write_file to save your work. You MUST call write_file before finishing.\n"
        "4. Use repo_browser.search to look up existing code before writing.\n"
        "5. Use read_file to check existing file content before overwriting.\n"
        "6. Do NOT leave any broken references, missing functions, or incomplete logic.\n"
        "7. Output only working, production-ready code.\n"
        + comment_rule
    )
    user_prompt = (
        f"Task: {current_task.task_description}\n"
        f"File to create/edit: {filepath}\n"
        f"Existing content:\n{existing_content}\n\n"
        f"Write the COMPLETE, fully functional implementation for this file and save it with write_file('{filepath}', your_complete_code)."
    )

    coder_tools = [read_file, write_file, list_files, get_current_directory, repo_browser_search]
    react_agent = create_react_agent(llm, coder_tools)

    react_agent.invoke({"messages": [{"role": "system", "content": system_prompt},
                                     {"role": "user", "content": user_prompt}]})

    coder_state.current_step_idx += 1
    return {"coder_state": coder_state}


graph = StateGraph(dict)

graph.add_node("planner", planner_agent)
graph.add_node("architect", architect_agent)
graph.add_node("coder", coder_agent)

graph.add_edge("planner", "architect")
graph.add_edge("architect", "coder")
graph.add_conditional_edges(
    "coder",
    lambda s: "END" if s.get("status") == "DONE" else "coder",
    {"END": END, "coder": "coder"}
)

graph.set_entry_point("planner")
agent = graph.compile()

if __name__ == "__main__":
    result = agent.invoke({"user_prompt": "Build a colourful modern todo app in html css and js"},
                          {"recursion_limit": 100})
    print("Final State:", result)