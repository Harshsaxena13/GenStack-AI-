import os
import re
from langchain_core.tools import tool


def _strip_block_comments(path: str, content: str) -> str:
    """Remove CSS/JS block comments that break Groq JSON parsing."""
    if path.endswith('.css') or path.endswith('.js'):
        # Remove /* ... */ block comments (including multi-line)
        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    return content


@tool
def write_file(path: str, content: str) -> str:
    """Write content to a file at the given path. Creates parent directories if needed."""
    try:
        content = _strip_block_comments(path, content)
        parent = os.path.dirname(path)
        if parent:
            os.makedirs(parent, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return f"Successfully wrote {len(content)} characters to {path}"
    except Exception as e:
        return f"Error writing file: {e}"


@tool
def read_file(path: str) -> str:
    """Read and return the content of a file at the given path."""
    try:
        if not os.path.exists(path):
            return f"File not found: {path}"
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {e}"


@tool
def get_current_directory() -> str:
    """Return the current working directory path."""
    return os.getcwd()


@tool
def list_files(directory: str = ".") -> str:
    """List all files and folders in the given directory recursively."""
    try:
        if not os.path.exists(directory):
            return f"Directory not found: {directory}"
        result = []
        for root, dirs, files in os.walk(directory):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('__pycache__', '.venv', 'node_modules')]
            for file in files:
                result.append(os.path.join(root, file))
        return "\n".join(sorted(result)) if result else f"No files found in '{directory}'"
    except Exception as e:
        return f"Error listing files: {e}"


@tool("repo_browser.search")
def repo_browser_search(query: str, path: str = ".", max_results: int = 20) -> str:
    """
    Search for a keyword or function name across all files in the repo.
    This tool is used to find existing code, functions, or variables.
    Args:
        query: The keyword or function name to search for.
        path: The directory to search in (default: current directory).
        max_results: Maximum number of results to return.
    """
    try:
        search_path = path if path and path != "" else "."
        if not os.path.exists(search_path):
            search_path = "."

        results = []
        for root, dirs, files in os.walk(search_path):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('__pycache__', '.venv', 'node_modules')]
            for filename in files:
                if not filename.endswith(('.py', '.js', '.ts', '.html', '.css', '.json', '.md', '.txt')):
                    continue
                filepath = os.path.join(root, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        for line_num, line in enumerate(f, 1):
                            if query.lower() in line.lower():
                                results.append(f"{filepath}:{line_num}: {line.rstrip()}")
                                if len(results) >= max_results:
                                    return "\n".join(results)
                except Exception:
                    continue

        return "\n".join(results) if results else f"No results found for '{query}'"
    except Exception as e:
        return f"Error searching: {e}"