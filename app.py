"""
AI Engineer Portfolio — Flask Backend
======================================
Serves the single-page portfolio and exposes a JSON contact endpoint that
sends mail via SMTP (Gmail App Password or any SMTP provider). All secrets
are read from environment variables (see .env.example).
"""

import os
import re
import smtplib
import time
from collections import defaultdict
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request

load_dotenv()

app = Flask(__name__)

# ----------------------------------------------------------------------------
# Configuration (all pulled from environment — never hard-code secrets)
# ----------------------------------------------------------------------------
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
CONTACT_RECEIVER = os.getenv("CONTACT_RECEIVER", SMTP_USER)

# Simple in-memory rate limiter: max 5 submissions / hour / IP.
# For production, swap this for Redis or a proper rate-limit middleware.
_RATE_LIMIT_WINDOW = 60 * 60
_RATE_LIMIT_MAX = 5
_submission_log = defaultdict(list)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

SITE_DATA = {
    "name": "Reyansh Sharma",
    "title": "AI Engineer",
    "roles": [
        "AI Engineer",
        "Generative AI Developer",
        "Machine Learning Engineer",
        "LLM Engineer",
        "Python Developer",
    ],
    "location": "Delhi, India",
    "email": "reyanshsharma3103@gmail.com",
    "linkedin": "https://linkedin.com/in/reyanshsharma31",
    "github": "https://github.com/REYANSH31",
    "resume_file": "Reyansh_Sharma_Resume.pdf",
    "summary": (
        "AI Engineer with a strong foundation in Python, Machine Learning, Deep Learning, "
        "Natural Language Processing (NLP), and Generative AI. Experienced in building "
        "intelligent applications using Large Language Models (LLMs), Retrieval-Augmented "
        "Generation (RAG), LangChain, Prompt Engineering, and AI APIs. Skilled in developing "
        "AI-powered chatbots, voice assistants, and document intelligence systems using Google "
        "Gemini API and Groq API, with a focus on scalable, real-world AI solutions."
    ),
}


def _is_rate_limited(ip: str) -> bool:
    now = time.time()
    window_start = now - _RATE_LIMIT_WINDOW
    _submission_log[ip] = [t for t in _submission_log[ip] if t > window_start]
    if len(_submission_log[ip]) >= _RATE_LIMIT_MAX:
        return True
    _submission_log[ip].append(now)
    return False


def send_contact_email(name: str, email: str, subject: str, message: str) -> None:
    """Send the contact-form submission via SMTP. Raises on failure."""
    if not SMTP_USER or not SMTP_PASSWORD:
        raise RuntimeError(
            "SMTP credentials are not configured. Set SMTP_USER and SMTP_PASSWORD "
            "in your .env file (see .env.example)."
        )

    msg = MIMEMultipart()
    msg["From"] = SMTP_USER
    msg["To"] = CONTACT_RECEIVER
    msg["Reply-To"] = email
    msg["Subject"] = f"[Portfolio Contact] {subject or 'New message'} — {name}"

    body = (
        f"New portfolio contact form submission\n"
        f"{'-' * 40}\n"
        f"Name:    {name}\n"
        f"Email:   {email}\n"
        f"Subject: {subject}\n\n"
        f"Message:\n{message}\n"
    )
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)


def _skill(name, category, level, description, projects):
    return {
        "name": name,
        "category": category,  # lang | ai | web | tools
        "level": level,
        "description": description,
        "projects": projects,
    }


SKILLS_DATA = [
    # -- Programming Languages --
    _skill("Python", "lang", 95, "Primary language for AI systems, scripting and backend services.",
           "AI-Powered PDF Chatbot, JARVIS Voice Assistant, Auto Reply AI Chatbot"),
    _skill("JavaScript", "lang", 70, "Used for interactive, responsive front-ends around AI-powered apps.",
           "AI-Powered PDF Chatbot, Auto Reply AI Chatbot"),
    _skill("SQL", "lang", 72, "Relational querying and data modeling for application data.",
           "Backend data storage"),
    _skill("C++", "lang", 65, "Core systems and DSA foundation from coursework.", "Academic coursework"),
    _skill("C", "lang", 62, "Low-level programming fundamentals.", "Academic coursework"),

    # -- Web Technologies --
    _skill("HTML5", "web", 80, "Semantic markup for accessible, responsive interfaces.",
           "AI-Powered PDF Chatbot, Auto Reply AI Chatbot"),
    _skill("CSS3", "web", 78, "Responsive, animated styling including dark/light themes.",
           "AI-Powered PDF Chatbot, Auto Reply AI Chatbot"),
    _skill("FastAPI", "web", 75, "High-performance Python API framework for serving ML/AI endpoints.",
           "Backend services for AI applications"),

    # -- Artificial Intelligence / Generative AI --
    _skill("Machine Learning", "ai", 88, "Core ML concepts, model training and evaluation.", "All AI projects"),
    _skill("Deep Learning", "ai", 82, "Neural network architectures for language and vision tasks.", "AI-Powered PDF Chatbot"),
    _skill("NLP", "ai", 85, "Text processing, semantic understanding and language pipelines.", "AI-Powered PDF Chatbot"),
    _skill("Computer Vision", "ai", 68, "Image understanding techniques applied to document intelligence.", "AI-Powered PDF Chatbot"),
    _skill("Generative AI", "ai", 92, "Building applications on top of generative language models.", "All AI projects"),
    _skill("LLMs", "ai", 90, "Applying large language models to reasoning, summarization and chat.", "All AI projects"),
    _skill("RAG", "ai", 90, "Retrieval-Augmented Generation for grounded, document-based answers.", "AI-Powered PDF Chatbot"),
    _skill("LangChain", "ai", 85, "Orchestrating retrieval, chains and agents around LLMs.", "AI-Powered PDF Chatbot"),
    _skill("Prompt Engineering", "ai", 88, "Crafting reliable prompts for accuracy, tone and safety.", "Auto Reply AI Chatbot, JARVIS"),
    _skill("AI Agents", "ai", 78, "Designing autonomous, tool-using AI workflows.", "JARVIS AI Voice Assistant"),

    # -- Tools, Data & APIs --
    _skill("NumPy", "tools", 75, "Numerical computing for data preprocessing.", "AI/ML coursework and projects"),
    _skill("Pandas", "tools", 78, "Data wrangling and analysis for ML pipelines.", "AI/ML coursework and projects"),
    _skill("Scikit-learn", "tools", 74, "Classical ML models and evaluation pipelines.", "AI/ML coursework"),
    _skill("Matplotlib", "tools", 70, "Data visualization for model insights.", "AI/ML coursework"),
    _skill("MySQL", "tools", 70, "Relational database design and querying.", "Backend data storage"),
    _skill("Google Gemini API", "tools", 88, "Contextual reasoning, summarization and chat completions.",
           "AI-Powered PDF Chatbot, Auto Reply AI Chatbot"),
    _skill("Groq API", "tools", 84, "Low-latency LLM inference for real-time voice interaction.", "JARVIS AI Voice Assistant"),
    _skill("Cohere API", "tools", 78, "LLM completions, embeddings and retrieval for language-heavy features.",
           "AI-Powered PDF Chatbot"),
    _skill("Tavily API", "tools", 76, "Real-time web search retrieval to ground AI agent responses.",
           "JARVIS AI Voice Assistant"),
    _skill("REST APIs", "tools", 80, "Designing and consuming HTTP APIs between services.", "All AI projects"),
    _skill("Git", "tools", 82, "Version control and collaborative workflows.", "All projects"),
    _skill("GitHub", "tools", 82, "Source hosting, issues and project history.", "github.com/REYANSH31"),
    _skill("Docker", "tools", 65, "Containerizing applications for consistent deployment.", "Deployment workflows"),
    _skill("VS Code", "tools", 90, "Primary development environment.", "All projects"),
]


@app.route("/")
def index():
    return render_template("index.html", data=SITE_DATA, skills=SKILLS_DATA)


@app.route("/api/contact", methods=["POST"])
def contact():
    payload = request.get_json(silent=True) or {}

    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip()
    subject = (payload.get("subject") or "").strip()
    message = (payload.get("message") or "").strip()

    # Honeypot field — bots fill hidden inputs, humans never see them.
    if (payload.get("website") or "").strip():
        return jsonify({"success": True}), 200  # silently swallow bot traffic

    errors = {}
    if not name:
        errors["name"] = "Please enter your name."
    if not email:
        errors["email"] = "Please enter your email."
    elif not EMAIL_REGEX.match(email):
        errors["email"] = "Please enter a valid email address."
    if not message:
        errors["message"] = "Please enter a message."
    elif len(message) > 5000:
        errors["message"] = "Message is too long (max 5000 characters)."

    if errors:
        return jsonify({"success": False, "errors": errors}), 400

    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "unknown")
    if _is_rate_limited(client_ip):
        return jsonify(
            {"success": False, "errors": {"form": "Too many messages sent. Please try again later."}}
        ), 429

    try:
        send_contact_email(name, email, subject, message)
    except Exception as exc:  # noqa: BLE001
        app.logger.error("Failed to send contact email: %s", exc)
        return jsonify(
            {"success": False, "errors": {"form": "Message could not be sent. Please email me directly."}}
        ), 500

    return jsonify({"success": True, "message": "Thanks! Your message has been sent."}), 200


@app.route("/healthz")
def healthz():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
