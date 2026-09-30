/**
 * threeScene.js
 * ---------------------------------------------------------------------------
 * Hero background: a rotating holographic wireframe sphere surrounded by a
 * floating neural-network of nodes/edges and ambient particles, with subtle
 * mouse-parallax. Pure Three.js r128, no external assets.
 */
(function () {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas || typeof THREE === "undefined") return;

  const heroSection = document.getElementById("home");
  let width = heroSection.clientWidth;
  let height = heroSection.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
  camera.position.set(0, 0, 26);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  // ---------------------------------------------------------------------
  // Holographic core sphere (wireframe)
  // ---------------------------------------------------------------------
  const coreGeo = new THREE.IcosahedronGeometry(6.2, 2);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x7c5cff,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  rootGroup.add(core);

  const coreGeo2 = new THREE.IcosahedronGeometry(4.4, 1);
  const coreMat2 = new THREE.MeshBasicMaterial({
    color: 0x00d9ff,
    wireframe: true,
    transparent: true,
    opacity: 0.25,
  });
  const core2 = new THREE.Mesh(coreGeo2, coreMat2);
  rootGroup.add(core2);

  // ---------------------------------------------------------------------
  // Neural network: nodes + connecting edges, distributed in a sphere shell
  // ---------------------------------------------------------------------
  const NODE_COUNT = 70;
  const nodePositions = [];
  const nodeGeo = new THREE.BufferGeometry();
  const nodeArray = new Float32Array(NODE_COUNT * 3);

  for (let i = 0; i < NODE_COUNT; i++) {
    const radius = 9 + Math.random() * 9;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    nodePositions.push(new THREE.Vector3(x, y, z));
    nodeArray[i * 3] = x;
    nodeArray[i * 3 + 1] = y;
    nodeArray[i * 3 + 2] = z;
  }
  nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodeArray, 3));

  const nodeMat = new THREE.PointsMaterial({
    color: 0x00d9ff,
    size: 0.22,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
  });
  const nodePoints = new THREE.Points(nodeGeo, nodeMat);
  rootGroup.add(nodePoints);

  // Connect nearby nodes with faint lines (neural network wiring)
  const edgeVertices = [];
  const MAX_DIST = 6.2;
  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      if (nodePositions[i].distanceTo(nodePositions[j]) < MAX_DIST) {
        edgeVertices.push(nodePositions[i].x, nodePositions[i].y, nodePositions[i].z);
        edgeVertices.push(nodePositions[j].x, nodePositions[j].y, nodePositions[j].z);
      }
    }
  }
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgeVertices, 3));
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x7c5cff, transparent: true, opacity: 0.12 });
  const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
  rootGroup.add(edgeLines);

  // ---------------------------------------------------------------------
  // Ambient floating particles (background depth)
  // ---------------------------------------------------------------------
  const PARTICLE_COUNT = 260;
  const particleGeo = new THREE.BufferGeometry();
  const particleArray = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particleArray[i * 3] = (Math.random() - 0.5) * 70;
    particleArray[i * 3 + 1] = (Math.random() - 0.5) * 70;
    particleArray[i * 3 + 2] = (Math.random() - 0.5) * 70 - 10;
  }
  particleGeo.setAttribute("position", new THREE.BufferAttribute(particleArray, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.09,
    transparent: true,
    opacity: 0.35,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ---------------------------------------------------------------------
  // Animated grid plane beneath the scene
  // ---------------------------------------------------------------------
  const grid = new THREE.GridHelper(80, 40, 0x7c5cff, 0x1a1a2e);
  grid.position.y = -14;
  grid.material.transparent = true;
  grid.material.opacity = 0.12;
  scene.add(grid);

  // ---------------------------------------------------------------------
  // Interaction: mouse parallax + slow autorotation
  // ---------------------------------------------------------------------
  let mouseX = 0;
  let mouseY = 0;
  let targetRotX = 0;
  let targetRotY = 0;

  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  });

  function resize() {
    width = heroSection.clientWidth;
    height = heroSection.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener("resize", resize);

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    core.rotation.y = elapsed * 0.08;
    core.rotation.x = elapsed * 0.04;
    core2.rotation.y = -elapsed * 0.12;
    core2.rotation.x = elapsed * 0.06;

    nodePoints.rotation.y = elapsed * 0.03;
    edgeLines.rotation.y = elapsed * 0.03;

    particles.rotation.y = elapsed * 0.015;

    targetRotX += (mouseY * 0.25 - targetRotX) * 0.03;
    targetRotY += (mouseX * 0.35 - targetRotY) * 0.03;
    rootGroup.rotation.x = targetRotX;
    rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0 + 0.0; // base handled below
    rootGroup.rotation.y = targetRotY + elapsed * 0.02;

    renderer.render(scene, camera);
  }
  animate();

  // Pause rendering when hero is off-screen (perf)
  let isVisible = true;
  const observer = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0].isIntersecting;
    },
    { threshold: 0 }
  );
  observer.observe(heroSection);
})();
