/**
 * skillsUniverse.js
 * ---------------------------------------------------------------------------
 * The portfolio's signature element: every technical skill from the resume
 * rendered as a floating, glowing 3D sphere inside a rotatable, zoomable
 * "universe". Built on raw Three.js r128 (no external control libraries).
 *
 * Interactions:
 *   - Drag                -> rotate the whole universe
 *   - Wheel / pinch        -> zoom
 *   - Mouse move            -> parallax + gentle node attraction
 *   - Hover a node          -> enlarge, glow, tooltip
 *   - Click a node           -> glassmorphism detail popup
 *   - Double-click a node    -> camera focuses on that node
 */
(function () {
  const stage = document.getElementById("universeStage") || document.querySelector(".universe-stage");
  const canvas = document.getElementById("skillsCanvas");
  const tooltip = document.getElementById("skillTooltip");
  const popup = document.getElementById("skillPopup");
  const popupClose = document.getElementById("skillPopupClose");
  const gridEl = document.getElementById("skillsGrid");
  const toggleBtns = document.querySelectorAll(".view-toggle-btn");

  if (!stage || !canvas || typeof THREE === "undefined") return;
  const SKILLS = window.SKILLS_DATA || [];
  if (!SKILLS.length) return;

  const CATEGORY_COLOR = {
    lang: 0x00d9ff,
    ai: 0x7c5cff,
    web: 0xffb86b,
    tools: 0x5cffb8,
  };
  const CATEGORY_LABEL = {
    lang: "Programming Language",
    ai: "Artificial Intelligence",
    web: "Web Technology",
    tools: "Tools & APIs",
  };
  const toCssColor = (hex) => "#" + hex.toString(16).padStart(6, "0");

  let width = stage.clientWidth;
  let height = stage.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
  camera.position.set(0, 0, 34);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const pointLight = new THREE.PointLight(0x7c5cff, 1.4, 100);
  pointLight.position.set(10, 10, 20);
  scene.add(pointLight);

  const universeGroup = new THREE.Group();
  scene.add(universeGroup);

  // ---------------------------------------------------------------------
  // Background stars
  // ---------------------------------------------------------------------
  const starGeo = new THREE.BufferGeometry();
  const STAR_COUNT = 400;
  const starArray = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    starArray[i * 3] = (Math.random() - 0.5) * 100;
    starArray[i * 3 + 1] = (Math.random() - 0.5) * 100;
    starArray[i * 3 + 2] = (Math.random() - 0.5) * 100 - 20;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starArray, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.4 });
  scene.add(new THREE.Points(starGeo, starMat));

  // ---------------------------------------------------------------------
  // Build skill nodes
  // ---------------------------------------------------------------------
  const UNIVERSE_RADIUS = 15;
  const nodes = [];

  function randomPointInSphere(radius) {
    const r = radius * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    return new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
  }

  SKILLS.forEach((skill, i) => {
    const radius = 0.35 + (skill.level / 100) * 0.55;
    const color = CATEGORY_COLOR[skill.category] || 0xffffff;

    const geo = new THREE.SphereGeometry(radius, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.55,
      roughness: 0.35,
      metalness: 0.2,
      transparent: true,
      opacity: 0.92,
    });
    const mesh = new THREE.Mesh(geo, mat);

    const pos = randomPointInSphere(UNIVERSE_RADIUS - radius);
    mesh.position.copy(pos);
    mesh.userData = { skill, baseScale: 1, radius };
    universeGroup.add(mesh);

    // Glow shell (slightly larger, additive, transparent)
    const glowGeo = new THREE.SphereGeometry(radius * 1.9, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    mesh.add(glow);

    nodes.push({
      mesh,
      glow,
      basePos: pos.clone(),
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.006, (Math.random() - 0.5) * 0.006, (Math.random() - 0.5) * 0.006),
      phase: Math.random() * Math.PI * 2,
      radius,
      hovered: false,
      focused: false,
    });
  });

  // ---------------------------------------------------------------------
  // Physics: gentle drift + collision avoidance (no overlap) + floating bob
  // ---------------------------------------------------------------------
  function updatePhysics(elapsed) {
    // Drift + boundary containment
    nodes.forEach((n) => {
      n.mesh.position.addScaledVector(n.velocity, 1);

      // Gentle float bob
      n.mesh.position.y += Math.sin(elapsed * 0.6 + n.phase) * 0.0015;

      const distFromCenter = n.mesh.position.length();
      if (distFromCenter > UNIVERSE_RADIUS) {
        n.mesh.position.setLength(UNIVERSE_RADIUS);
        n.velocity.multiplyScalar(-1);
      }
    });

    // Pairwise collision resolution (simple O(n^2), fine for ~30 nodes)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const minDist = a.radius + b.radius + 0.35;
        const delta = new THREE.Vector3().subVectors(b.mesh.position, a.mesh.position);
        const dist = delta.length();
        if (dist > 0 && dist < minDist) {
          const overlap = (minDist - dist) / 2;
          delta.normalize();
          a.mesh.position.addScaledVector(delta, -overlap);
          b.mesh.position.addScaledVector(delta, overlap);
          // gentle bounce
          a.velocity.addScaledVector(delta, -0.0008);
          b.velocity.addScaledVector(delta, 0.0008);
        }
      }
    }
  }

  // ---------------------------------------------------------------------
  // Interaction state
  // ---------------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const mouseNDC = new THREE.Vector2(9999, 9999);
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let rotationStart = { x: 0, y: 0 };
  let currentHover = null;
  let focusedNode = null;
  let cameraTargetZ = 34;
  let autoRotate = true;

  function setMouseFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    mouseNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    return { clientX, clientY };
  }

  canvas.addEventListener("pointerdown", (e) => {
    isDragging = true;
    autoRotate = false;
    dragStart = { x: e.clientX, y: e.clientY };
    rotationStart = { x: universeGroup.rotation.x, y: universeGroup.rotation.y };
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    setMouseFromEvent(e);
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      universeGroup.rotation.y = rotationStart.y + dx * 0.006;
      universeGroup.rotation.x = rotationStart.x + dy * 0.006;
      universeGroup.rotation.x = Math.max(-1, Math.min(1, universeGroup.rotation.x));
    }
  });

  window.addEventListener("pointerup", () => {
    isDragging = false;
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    cameraTargetZ += e.deltaY * 0.02;
    cameraTargetZ = Math.max(14, Math.min(55, cameraTargetZ));
  }, { passive: false });

  canvas.addEventListener("click", (e) => {
    if (Math.abs(e.clientX - dragStart.x) > 4 || Math.abs(e.clientY - dragStart.y) > 4) return; // was a drag
    if (currentHover) openPopup(currentHover.mesh.userData.skill);
  });

  canvas.addEventListener("dblclick", (e) => {
    setMouseFromEvent(e);
    raycaster.setFromCamera(mouseNDC, camera);
    const hits = raycaster.intersectObjects(nodes.map((n) => n.mesh));
    if (hits.length) {
      const node = nodes.find((n) => n.mesh === hits[0].object);
      focusedNode = node;
      autoRotate = false;
    }
  });

  popupClose.addEventListener("click", closePopup);
  popup.addEventListener("click", (e) => {
    if (e.target === popup) closePopup();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePopup();
  });

  function openPopup(skill) {
    document.getElementById("popupCategory").textContent = CATEGORY_LABEL[skill.category] || skill.category;
    document.getElementById("popupTitle").textContent = skill.name;
    document.getElementById("popupDesc").textContent = skill.description;
    document.getElementById("popupProjects").textContent = skill.projects;
    const fill = document.getElementById("popupLevelFill");
    fill.style.width = "0%";
    popup.classList.add("open");
    popup.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      fill.style.width = skill.level + "%";
    });
  }
  function closePopup() {
    popup.classList.remove("open");
    popup.setAttribute("aria-hidden", "true");
  }

  // ---------------------------------------------------------------------
  // 2D Grid view — same skill data, same click-to-open popup, no WebGL
  // ---------------------------------------------------------------------
  function buildGrid() {
    if (!gridEl) return;
    gridEl.innerHTML = "";
    SKILLS.forEach((skill) => {
      const color = toCssColor(CATEGORY_COLOR[skill.category] || 0xffffff);
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "skill-chip";
      chip.style.setProperty("--chip-color", color);
      chip.innerHTML = `
        <span class="skill-chip-name">${skill.name}</span>
        <div class="skill-chip-bar"><div class="skill-chip-bar-fill" style="width:${skill.level}%"></div></div>
        <div class="skill-chip-meta">
          <span class="skill-chip-category">${CATEGORY_LABEL[skill.category] || skill.category}</span>
          <span class="skill-chip-level">${skill.level}%</span>
        </div>
      `;
      chip.addEventListener("click", () => openPopup(skill));
      gridEl.appendChild(chip);
    });
  }
  buildGrid();

  // ---------------------------------------------------------------------
  // View toggle: 3D Universe <-> 2D Grid
  // ---------------------------------------------------------------------
  let currentView = "3d";

  function setView(view) {
    if (view === currentView) return;
    currentView = view;

    stage.classList.toggle("is-hidden", view !== "3d");
    if (gridEl) gridEl.classList.toggle("is-hidden", view !== "2d");

    toggleBtns.forEach((btn) => {
      const active = btn.dataset.view === view;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });

    if (view !== "3d") {
      tooltip.classList.remove("visible");
      mouseNDC.set(9999, 9999);
    } else {
      // stage was display:none, so its measured size was stale — refresh it
      resize();
    }
  }

  toggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });

  // ---------------------------------------------------------------------
  // Render loop
  // ---------------------------------------------------------------------
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    if (currentView !== "3d") return; // pause WebGL work while the grid view is shown

    const elapsed = clock.getElapsedTime();

    updatePhysics(elapsed);

    if (autoRotate && !isDragging) {
      universeGroup.rotation.y += 0.0009;
    }

    // Camera zoom smoothing
    camera.position.z += (cameraTargetZ - camera.position.z) * 0.08;

    // Focus behavior: smoothly orbit camera toward the focused node
    if (focusedNode) {
      const worldPos = new THREE.Vector3();
      focusedNode.mesh.getWorldPosition(worldPos);
      camera.lookAt(worldPos);
      cameraTargetZ = 14;
    } else {
      camera.lookAt(0, 0, 0);
    }

    // Hover detection
    raycaster.setFromCamera(mouseNDC, camera);
    const hits = raycaster.intersectObjects(nodes.map((n) => n.mesh));
    const hitNode = hits.length ? nodes.find((n) => n.mesh === hits[0].object) : null;

    if (hitNode !== currentHover) {
      if (currentHover) {
        gsapScale(currentHover.mesh, 1);
        currentHover.mesh.material.emissiveIntensity = 0.55;
      }
      currentHover = hitNode;
      if (currentHover) {
        gsapScale(currentHover.mesh, 1.6);
        currentHover.mesh.material.emissiveIntensity = 1.4;
      }
    }

    if (currentHover) {
      const worldPos = new THREE.Vector3();
      currentHover.mesh.getWorldPosition(worldPos);
      const screenPos = worldPos.clone().project(camera);
      const x = (screenPos.x * 0.5 + 0.5) * width;
      const y = (-screenPos.y * 0.5 + 0.5) * height;
      const skill = currentHover.mesh.userData.skill;
      tooltip.innerHTML = `<strong>${skill.name}</strong><span>${CATEGORY_LABEL[skill.category]} · ${skill.level}%</span>`;
      tooltip.style.left = x + "px";
      tooltip.style.top = y + "px";
      tooltip.classList.add("visible");
      canvas.style.cursor = "pointer";
    } else {
      tooltip.classList.remove("visible");
      canvas.style.cursor = isDragging ? "grabbing" : "grab";
    }

    renderer.render(scene, camera);
  }

  // Lightweight scale tween without requiring GSAP timing conflicts
  function gsapScale(mesh, target) {
    if (window.gsap) {
      gsap.to(mesh.scale, { x: target, y: target, z: target, duration: 0.35, ease: "power2.out" });
    } else {
      mesh.scale.set(target, target, target);
    }
  }

  function resize() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener("resize", resize);

  animate();
})();
