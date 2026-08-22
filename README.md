# 🌿 Hircur AI — Intelligent Job Discovery & Smart Resume Screener

<div align="center">

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-16a34a.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-15803d.svg)](https://fastapi.tiangolo.com)
[![ONNX Runtime](https://img.shields.io/badge/ONNX-FastEmbed_Local-0f766e.svg)](https://onnxruntime.ai/)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA_NIM-Llama_3.1_70B-76b900.svg)](https://build.nvidia.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Next-Generation Multi-Platform Job Aggregator, Local Vector Matcher, and SOTA 3-Stage Recruiter Screening Pipeline.**

*Built by **Hemasai Vattikuti** (VIT-AP 2027)*

[Overview](#-overview) • [Architecture](#-system-architecture) • [Features](#-key-features) • [Quickstart](#-quickstart) • [API Reference](#-api-reference) • [License](#-license)

</div>

---

## 🚀 Overview

**Hircur AI** is an enterprise-grade job discovery and talent evaluation platform engineered specifically for the modern tech hiring ecosystem. 

Unlike traditional keyword-based ATS systems, Hircur utilizes a **3-Stage Hybrid Screening Engine** combining deterministic entity parsing, sub-15ms local ONNX dense vector retrieval, and 70-billion parameter neural reasoning (NVIDIA NIM Llama 3.1 70B) to deliver objective, calibrated candidate-job fit scores.

---

## 🏗️ System Architecture

```
                                  ┌────────────────────────────────────────┐
                                  │      Candidate Resume (PDF / DOCX)     │
                                  └───────────────────┬────────────────────┘
                                                      │
                                                      ▼
                      [ Stage 1: Deterministic Structured Extraction ]
                      ├── PyMuPDF Text Extraction (<50ms, 100% offline)
                      └── Pydantic v2 Entity & Skill Parsing
                                                      │
                                                      ▼
                      [ Stage 2: Dense Semantic Vector Retrieval ]
                      ├── BAAI/bge-small-en ONNX Model (<15ms per job)
                      ├── 384-dimensional Cosine Similarity Engine
                      └── Zero-Cost Local CPU Vector Matching
                                                      │
                                                      ▼
                      [ Stage 3: Multi-Dimensional 70B Reasoning ]
                      ├── NVIDIA NIM (meta/llama-3.1-70b-instruct)
                      ├── 4-Pillar Weighted Rubric:
                      │   ├── Technical Competency (40%)
                      │   ├── Experience Relevance (30%)
                      │   ├── Domain Knowledge (20%)
                      │   └── Prerequisites Coverage (10%)
                      └── Outputs Calibrated 1-10 Score + Recruiter Justification
```

---

## ✨ Key Features

### 1. 🔍 Multi-Platform Live Job Aggregator
Directly queries public career APIs and job boards in real time without stale databases:
- **Greenhouse** (780+ live roles)
- **Lever** (200+ live roles)
- **Ashby** (250+ live roles)
- **Internshala** (Tier-1 tech internships)
- **LinkedIn** (Curated multi-city tech positions)

### 2. 🧠 Zero-Cost Local Vector Matcher
- Powered by `fastembed` with ONNX Runtime.
- Embeds candidate profiles and 1,000+ jobs locally in memory with `<200MB RAM` consumption and zero third-party vector API bills.

### 3. 🎯 Recruiter Smart Screener
- Evaluates bulk resumes against any custom Job Description.
- Outputs ranked candidate leaderboards with:
  - **Calibrated 1–10 Score**
  - **Verdict**: `Shortlisted ✅` | `Review / Follow-up ⚠️` | `Unmatched ❌`
  - **Strengths & Skill Gap Identification**
  - **Actionable Hiring Justification**

### 4. ✍️ AI Application & Cover Letter Tailor
- Leverages Llama 3.1 70B on NVIDIA DGX Cloud to generate ATS-optimized resume summary bullets and 3-paragraph tailored cover letters calibrated to each specific role.

### 5. 🌿 Enterprise UI Dashboard (Green & White Theme)
- **Landing Page (`/`)**: Conversion-optimized landing experience.
- **7-Step Onboarding (`/onboarding`)**: Interactive timeline, location, resume drop, experience, and compensation selector.
- **App Dashboard (`/dashboard`)**: Simplify-style Job Explorer with split-pane view, Kanban Application Tracker, and AI Matches view.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) + Uvicorn (Asynchronous ASGI) |
| **Parsing Engine** | [PyMuPDF](https://pymupdf.readthedocs.io/) (`fitz`) |
| **Vector Embeddings** | [FastEmbed](https://qdrant.github.io/fastembed/) (`BAAI/bge-small-en-v1.5` ONNX) |
| **LLM Inference** | [NVIDIA NIM](https://build.nvidia.com/) (`meta/llama-3.1-70b-instruct`) |
| **Data Contracts** | [Pydantic v2](https://docs.pydantic.dev/) + Settings Management |
| **Database & Vectors** | SQLite (Local) / Supabase PostgreSQL with `pgvector` (Production) |
| **Frontend UI** | Vanilla HTML5 / Modern CSS (Custom Glassmorphism Design System) |

---

## 🚀 Quickstart

### Prerequisites
- Python 3.11+
- Virtual environment (`venv` or `conda`)

### 1. Clone & Setup
```bash
git clone https://github.com/your-username/hircur-ai.git
cd hircur-ai

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```bash
NVIDIA_NIM_API_KEY="nvapi-your-key-here"
NVIDIA_MODEL="meta/llama-3.1-70b-instruct"
NVIDIA_BASE_URL="https://integrate.api.nvidia.com/v1"
```

### 3. Run the Platform
```bash
python main.py
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

---

## 📖 API Reference

### `GET /api/jobs`
Query aggregated jobs with optional multi-facet filtering.
```bash
curl "http://localhost:8000/api/jobs?city=Bengaluru&remote_only=true"
```

### `POST /api/match-resume`
Upload a candidate resume PDF or raw text to rank all active jobs by dense semantic fit.
```bash
curl -X POST "http://localhost:8000/api/match-resume" \
  -F "file=@resume.pdf"
```

### `POST /api/recruiter/screen`
Screen multiple candidate resumes against a target job description.
```bash
curl -X POST "http://localhost:8000/api/recruiter/screen" \
  -F "job_description=Seeking Backend Engineer proficient in Python, FastAPI, and PostgreSQL." \
  -F "files=@candidate1.pdf" \
  -F "files=@candidate2.pdf"
```

### `POST /api/generate-ai-doc`
Generate ATS highlights and tailored cover letters via 70B neural inference.
```bash
curl -X POST "http://localhost:8000/api/generate-ai-doc" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "job_123",
    "resume_text": "Experienced Python Backend Engineer..."
  }'
```

### `POST /api/scrape`
Trigger live background job aggregation across Greenhouse, Lever, Ashby, Internshala, and LinkedIn.
```bash
curl -X POST "http://localhost:8000/api/scrape"
```

---

## 👤 Author

**Hemasai Vattikuti**
- B.Tech Computer Science & Engineering (Batch 2027) · VIT-AP University
- Project Lead & System Architect — Hircur AI

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
