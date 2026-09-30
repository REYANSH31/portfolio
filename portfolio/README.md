# Reyansh Sharma — AI Engineer Portfolio

A premium, fully responsive, 3D-animated portfolio built for an AI Engineer,
powered by Flask on the backend and Three.js / GSAP on the front end. Content
is auto-populated from the resume data defined in `app.py`.

## ✨ Highlights

- **3D animated hero** — neural-network scene built in raw Three.js with mouse parallax.
- **Skills Universe** — every technical skill rendered as a floating, glowing, physics-driven 3D sphere with drag-to-rotate, zoom, hover tooltips, click-to-expand glassmorphism popups, and double-click camera focus.
- **Dark / light mode** — animated toggle, system-preference detection, persisted via `localStorage`.
- **GSAP + AOS animations** — scroll reveals, magnetic buttons, animated counters, card tilt (VanillaTilt).
- **Flask contact form** — Fetch API submission (no page reload), server-side validation, honeypot spam protection, rate limiting, and SMTP email delivery.
- **Fully responsive** — mobile-first layout down to small phones, with a slide-in nav menu.
- **Accessible** — visible focus states, semantic markup, `prefers-reduced-motion` respected.

## 🧱 Tech Stack

| Layer      | Technology                                             |
|------------|---------------------------------------------------------|
| Frontend   | HTML5, CSS3, JavaScript (ES6), Three.js, GSAP, AOS, Typed.js, VanillaTilt.js, Font Awesome |
| Backend    | Python, Flask                                           |
| Email      | SMTP (Gmail App Password or any provider) via `smtplib`, `python-dotenv` |

## 📁 Project Structure

```
portfolio/
├── app.py                  # Flask app, routes, email logic, resume/skill data
├── requirements.txt
├── README.md
├── .env.example
├── templates/
│   └── index.html
└── static/
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── main.js          # loader, theme, navbar, tilt, misc chrome
    │   ├── animations.js    # GSAP scroll reveals, counters, magnetic buttons
    │   ├── skillsUniverse.js# 3D Skills Universe
    │   ├── threeScene.js    # Hero 3D background
    │   └── contact.js       # Fetch-based contact form
    ├── images/
    ├── icons/
    └── resume/
        └── Reyansh_Sharma_Resume.pdf
```

## 🚀 Getting Started

1. **Create a virtual environment & install dependencies**

   ```bash
   python -m venv venv
   source venv/bin/activate       # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your SMTP credentials. For Gmail:
   - Enable 2-Step Verification on your Google account.
   - Create an [App Password](https://myaccount.google.com/apppasswords).
   - Use that 16-character password as `SMTP_PASSWORD` (not your normal password).

3. **Run the development server**

   ```bash
   python app.py
   ```

   Visit `http://localhost:5000`.

4. **Production run** (example with gunicorn)

   ```bash
   gunicorn -w 2 -b 0.0.0.0:8000 app:app
   ```

## ✏️ Updating Content

All resume-derived content (name, summary, skills, contact details) lives in
`SITE_DATA` and `SKILLS_DATA` near the top of `app.py`. Projects, experience,
education, certifications and achievements are written directly into
`templates/index.html` — update the relevant `<section>` to reflect changes to
your resume. Replace `static/resume/Reyansh_Sharma_Resume.pdf` with an updated
PDF (keep the same filename, or update `SITE_DATA["resume_file"]`).

## 🔒 Contact Form Security

- Server-side validation of name/email/message.
- Hidden honeypot field (`website`) silently discards bot submissions.
- In-memory rate limiting (5 submissions / hour / IP) — swap for Redis in a
  multi-instance production deployment.
- Credentials are never hard-coded; they're read from environment variables.

## ♿ Accessibility & Performance

- Keyboard-visible focus states throughout.
- `prefers-reduced-motion` disables animation for users who request it.
- Three.js scenes pause rendering intensity is capped and pixel ratio limited
  for smooth performance on mobile GPUs.
- Semantic landmarks (`header`, `main`, `section`, `footer`) and descriptive
  `aria-label`s on icon-only controls.
