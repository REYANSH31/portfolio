/**
 * animations.js
 * ---------------------------------------------------------------------------
 * GSAP + ScrollTrigger + Typed.js driven motion: hero role typing, animated
 * counters, magnetic buttons, and section-level scroll reveals that layer on
 * top of AOS for the signature moments.
 */
(function () {
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // -------------------------------------------------------------------
  // Typed.js — rotating role titles in the hero
  // -------------------------------------------------------------------
  function initTypedRoles() {
    const el = document.getElementById("typedRole");
    if (!el) return;
    const roles = (window.SITE_DATA && window.SITE_DATA.roles) || ["AI Engineer"];

    if (window.Typed) {
      new Typed("#typedRole", {
        strings: roles,
        typeSpeed: 48,
        backSpeed: 28,
        backDelay: 1400,
        startDelay: 300,
        loop: true,
        smartBackspace: true,
      });
    } else {
      el.textContent = roles[0];
    }
  }

  // -------------------------------------------------------------------
  // Animated counters (About section)
  // -------------------------------------------------------------------
  function initCounters() {
    const counters = document.querySelectorAll(".counter-num");
    counters.forEach((counter) => {
      const target = parseInt(counter.getAttribute("data-count"), 10) || 0;
      const state = { val: 0 };

      const run = () => {
        gsap.to(state, {
          val: target,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: () => {
            counter.textContent = Math.round(state.val);
          },
        });
      };

      if (window.ScrollTrigger) {
        ScrollTrigger.create({
          trigger: counter,
          start: "top 88%",
          once: true,
          onEnter: run,
        });
      } else {
        run();
      }
    });
  }

  // -------------------------------------------------------------------
  // Magnetic buttons — subtle pull toward the cursor
  // -------------------------------------------------------------------
  function initMagneticButtons() {
    const buttons = document.querySelectorAll(".magnetic");
    buttons.forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: x * 0.25, y: y * 0.35, duration: 0.4, ease: "power2.out" });
      });
      btn.addEventListener("mouseleave", () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  // -------------------------------------------------------------------
  // Section-title reveal + hero entrance timeline
  // -------------------------------------------------------------------
  function initHeroEntrance() {
    if (!window.gsap) return;
    const tl = gsap.timeline({ delay: 0.3 });
    tl.from(".hero-eyebrow", { opacity: 0, y: 16, duration: 0.6, ease: "power3.out" })
      .from(".hero-name", { opacity: 0, y: 30, duration: 0.8, ease: "power3.out" }, "-=0.35")
      .from(".hero-role", { opacity: 0, y: 20, duration: 0.7, ease: "power3.out" }, "-=0.45")
      .from(".hero-desc", { opacity: 0, y: 18, duration: 0.6, ease: "power3.out" }, "-=0.4")
      .from(".hero-actions .btn", { opacity: 0, y: 18, stagger: 0.1, duration: 0.6, ease: "power3.out" }, "-=0.35");
  }

  // -------------------------------------------------------------------
  // Project / cert / achievement card hover lift via GSAP for smoothness
  // -------------------------------------------------------------------
  function initCardLift() {
    document.querySelectorAll(".project-card, .cert-card, .achieve-card, .timeline-card").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        gsap.to(card, { y: -8, duration: 0.4, ease: "power2.out" });
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(card, { y: 0, duration: 0.5, ease: "power2.out" });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTypedRoles();
    if (window.gsap) {
      initHeroEntrance();
      initCounters();
      initMagneticButtons();
      initCardLift();
    }
  });
})();
