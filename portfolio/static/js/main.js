/**
 * main.js
 * ---------------------------------------------------------------------------
 * Site-wide chrome: loading screen, dark/light theme, sticky navbar with
 * active-section highlighting, mobile menu, scroll progress bar, tilt cards,
 * and back-to-top control.
 */
(function () {
  // -------------------------------------------------------------------
  // Loading screen with simulated progress
  // -------------------------------------------------------------------
  function initLoader() {
    const fill = document.getElementById("loaderFill");
    const percentEl = document.getElementById("loaderPercent");
    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 18;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        finishLoading();
      }
      fill.style.width = progress + "%";
      percentEl.textContent = Math.round(progress) + "%";
    }, 140);

    function finishLoading() {
      setTimeout(() => {
        document.body.classList.remove("loading");
        document.body.style.overflow = "";
      }, 350);
    }

    // Safety net: never block the site for more than 4s even on slow loads
    window.addEventListener("load", () => {
      setTimeout(() => {
        if (document.body.classList.contains("loading")) {
          progress = 100;
          fill.style.width = "100%";
          percentEl.textContent = "100%";
          finishLoading();
        }
      }, 4000);
    });
  }

  // -------------------------------------------------------------------
  // Theme toggle — Local Storage persistence + system preference detect
  // -------------------------------------------------------------------
  function initTheme() {
    const toggle = document.getElementById("themeToggle");
    const stored = localStorage.getItem("portfolio-theme");
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const initial = stored || (prefersLight ? "light" : "dark");

    document.body.setAttribute("data-theme", initial);

    toggle.addEventListener("click", () => {
      const current = document.body.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.body.setAttribute("data-theme", next);
      localStorage.setItem("portfolio-theme", next);
    });
  }

  // -------------------------------------------------------------------
  // Navbar: scrolled state + active section highlighting
  // -------------------------------------------------------------------
  function initNavbar() {
    const navbar = document.getElementById("navbar");
    const navLinks = document.querySelectorAll(".nav-link");
    const sections = Array.from(navLinks)
      .map((link) => document.getElementById(link.dataset.section))
      .filter(Boolean);

    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 40);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach((link) => {
              link.classList.toggle("active", link.dataset.section === id);
            });
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));

    // Smooth-close mobile menu on link click
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        document.getElementById("navLinks").classList.remove("open");
        document.getElementById("hamburger").classList.remove("open");
      });
    });
  }

  // -------------------------------------------------------------------
  // Hamburger mobile menu
  // -------------------------------------------------------------------
  function initHamburger() {
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("navLinks");
    hamburger.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      hamburger.classList.toggle("open", isOpen);
      hamburger.setAttribute("aria-expanded", isOpen);
    });
  }

  // -------------------------------------------------------------------
  // Scroll progress bar
  // -------------------------------------------------------------------
  function initScrollProgress() {
    const bar = document.getElementById("scrollProgress");
    window.addEventListener("scroll", () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + "%";
    });
  }

  // -------------------------------------------------------------------
  // Back to top button
  // -------------------------------------------------------------------
  function initBackToTop() {
    const btn = document.getElementById("backToTop");
    window.addEventListener("scroll", () => {
      btn.classList.toggle("visible", window.scrollY > 600);
    });
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // -------------------------------------------------------------------
  // Vanilla Tilt on all .tilt-card elements
  // -------------------------------------------------------------------
  function initTilt() {
    if (!window.VanillaTilt) return;
    const cards = document.querySelectorAll(".tilt-card");
    VanillaTilt.init(cards, {
      max: 8,
      speed: 400,
      glare: true,
      "max-glare": 0.15,
      scale: 1.02,
    });
  }

  // -------------------------------------------------------------------
  // Misc: footer year, AOS init
  // -------------------------------------------------------------------
  function initMisc() {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    if (window.AOS) {
      AOS.init({ duration: 800, once: true, offset: 60, easing: "ease-out-cubic" });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.body.style.overflow = "hidden";
    initLoader();
    initTheme();
    initNavbar();
    initHamburger();
    initScrollProgress();
    initBackToTop();
    initTilt();
    initMisc();
  });
})();
