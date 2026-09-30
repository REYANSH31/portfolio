/**
 * contact.js
 * ---------------------------------------------------------------------------
 * Client-side validation + Fetch API submission for the contact form, talking
 * to the Flask /api/contact endpoint. No page reload.
 */
(function () {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const submitBtn = document.getElementById("contactSubmit");
  const statusEl = document.getElementById("formStatus");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function clearErrors() {
    form.querySelectorAll(".form-error").forEach((el) => (el.textContent = ""));
    statusEl.textContent = "";
    statusEl.className = "form-status";
  }

  function setError(field, message) {
    const el = form.querySelector(`[data-error-for="${field}"]`);
    if (el) el.textContent = message;
  }

  function validate(data) {
    let valid = true;
    if (!data.name.trim()) {
      setError("name", "Please enter your name.");
      valid = false;
    }
    if (!data.email.trim()) {
      setError("email", "Please enter your email.");
      valid = false;
    } else if (!emailRegex.test(data.email.trim())) {
      setError("email", "Please enter a valid email address.");
      valid = false;
    }
    if (!data.message.trim()) {
      setError("message", "Please enter a message.");
      valid = false;
    }
    return valid;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const formData = new FormData(form);
    const payload = {
      name: formData.get("name") || "",
      email: formData.get("email") || "",
      subject: formData.get("subject") || "",
      message: formData.get("message") || "",
      website: formData.get("website") || "", // honeypot
    };

    if (!validate(payload)) return;

    submitBtn.classList.add("is-loading");
    submitBtn.disabled = true;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        statusEl.textContent = result.message || "Thanks! Your message has been sent.";
        statusEl.classList.add("success");
        form.reset();
      } else if (result.errors) {
        Object.entries(result.errors).forEach(([field, message]) => {
          if (field === "form") {
            statusEl.textContent = message;
            statusEl.classList.add("error");
          } else {
            setError(field, message);
          }
        });
      } else {
        statusEl.textContent = "Something went wrong. Please try again.";
        statusEl.classList.add("error");
      }
    } catch (err) {
      statusEl.textContent = "Network error — please email me directly.";
      statusEl.classList.add("error");
    } finally {
      submitBtn.classList.remove("is-loading");
      submitBtn.disabled = false;
    }
  });
})();
