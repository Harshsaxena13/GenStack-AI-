# GenStack-AI
Multi-agent AI system that converts natural language into full-stack applications using LangGraph and Groq.
<img width="2880" height="1624" alt="image" src="https://github.com/user-attachments/assets/a5ed7992-aac2-40a4-9d60-a64bb83f26ae" />
# 🚀 GenStack AI — Multi-Agent Code Generation System

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![LangGraph](https://img.shields.io/badge/LangGraph-MultiAgent-purple)
![Groq](https://img.shields.io/badge/Groq-LLM-orange)
![License](https://img.shields.io/badge/License-MIT-green)

> Turn ideas into full software projects using AI agents.

---

## 🧠 Overview

**GenStack AI** is an AI-powered multi-agent system that transforms natural language prompts into complete, working software projects.

It simulates a real-world development team by orchestrating multiple specialized agents using LangGraph.

---

## ⚙️ How It Works


---

## 🤖 Agents

| Agent | Responsibility |
|------|--------------|
| Planner | Understand user intent |
| Architect | Design system structure |
| Task Decomposer | Break into tasks |
| Builder | Generate code |
| Reviewer | Improve code quality |
| Tester | Generate tests |

---

## ✨ Features

- 🧠 Multi-agent architecture (LangGraph)
- ⚡ Fast LLM inference via Groq
- 📁 Full project scaffolding
- 🔄 Iterative code refinement
- 🧪 Automated test generation
- 🌐 Optional Streamlit UI

---

## 🛠 Tech Stack

- **Language:** Python  
- **Framework:** LangGraph  
- **LLM:** Groq (Qwen / Kimi)  
- **UI:** Streamlit  
- **Env Manager:** uv  

---

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/yourusername/genstack-ai.git
cd genstack-ai

# Create virtual environment
uv venv
source .venv/bin/activate

# Install dependencies
uv sync
