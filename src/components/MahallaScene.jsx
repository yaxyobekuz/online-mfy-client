import { useEffect, useRef } from "react";
import * as THREE from "three";

const box = (parent, size, position, material, rotationY = 0) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.rotation.y = rotationY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
};

const addHouse = (scene, x, z, scale, wallMaterial, roofMaterial) => {
  const house = new THREE.Group();
  house.position.set(x, 0, z);
  house.scale.setScalar(scale);
  scene.add(house);

  box(house, [1.8, 1.65, 1.5], [0, 0.84, 0], wallMaterial);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.45, 0.95, 4),
    roofMaterial,
  );
  roof.position.set(0, 2.12, 0);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  house.add(roof);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.92, 0.08),
    new THREE.MeshStandardMaterial({ color: "#694b35", roughness: 0.8 }),
  );
  door.position.set(0, 0.48, 0.79);
  house.add(door);

  const windowMaterial = new THREE.MeshStandardMaterial({
    color: "#f5d895",
    emissive: "#b47a37",
    emissiveIntensity: 0.3,
    roughness: 0.32,
  });
  for (const windowX of [-0.58, 0.58]) {
    const window = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.4, 0.08),
      windowMaterial,
    );
    window.position.set(windowX, 1.04, 0.79);
    house.add(window);
  }
  return house;
};

const addTree = (scene, x, z, scale, foliageMaterial) => {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);
  scene.add(tree);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.2, 1.8, 6),
    new THREE.MeshStandardMaterial({ color: "#765137", roughness: 0.9 }),
  );
  trunk.position.y = 0.9;
  trunk.castShadow = true;
  tree.add(trunk);

  for (let index = 0; index < 3; index += 1) {
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.88 - index * 0.13, 1.15, 7),
      foliageMaterial,
    );
    crown.position.set(0, 1.8 + index * 0.57, 0);
    crown.rotation.y = index * 0.4;
    crown.castShadow = true;
    tree.add(crown);
  }
  return tree;
};

const MahallaScene = () => {
  const sceneHost = useRef(null);

  useEffect(() => {
    const host = sceneHost.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#c7d9cc");
    scene.fog = new THREE.Fog("#c7d9cc", 14, 36);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
    camera.position.set(0, 5.2, 15.5);
    camera.lookAt(0, 2, -1.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "block h-full w-full";
    host.appendChild(renderer.domElement);

    const hemisphereLight = new THREE.HemisphereLight("#f9f2dc", "#577565", 2.1);
    scene.add(hemisphereLight);
    const sunlight = new THREE.DirectionalLight("#ffe0a3", 3.2);
    sunlight.position.set(-7, 11, 8);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(1024, 1024);
    sunlight.shadow.camera.left = -15;
    sunlight.shadow.camera.right = 15;
    sunlight.shadow.camera.top = 15;
    sunlight.shadow.camera.bottom = -10;
    scene.add(sunlight);

    const grass = new THREE.MeshStandardMaterial({ color: "#788e64", roughness: 1 });
    const pathMaterial = new THREE.MeshStandardMaterial({ color: "#c9b99b", roughness: 0.95 });
    const stone = new THREE.MeshStandardMaterial({ color: "#e1c99b", roughness: 0.85 });
    const gatePaint = new THREE.MeshStandardMaterial({ color: "#3e705e", roughness: 0.62 });
    const gateTrim = new THREE.MeshStandardMaterial({ color: "#d69c50", roughness: 0.55, metalness: 0.12 });

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), grass);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.04;
    ground.receiveShadow = true;
    scene.add(ground);

    const pathway = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 28), pathMaterial);
    pathway.rotation.x = -Math.PI / 2;
    pathway.position.set(-0.2, 0.01, -3.8);
    pathway.receiveShadow = true;
    scene.add(pathway);

    const gate = new THREE.Group();
    gate.position.set(-0.2, 0, -0.4);
    scene.add(gate);
    for (const pillarX of [-1.8, 1.8]) {
      box(gate, [0.72, 3.25, 0.9], [pillarX, 1.62, 0], gatePaint);
      box(gate, [0.92, 0.2, 1.08], [pillarX, 3.28, 0], gateTrim);
      box(gate, [0.9, 0.16, 1.06], [pillarX, 0.12, 0], stone);
      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(0.57, 0.48, 4),
        gateTrim,
      );
      cap.position.set(pillarX, 3.58, 0);
      cap.rotation.y = Math.PI / 4;
      cap.castShadow = true;
      gate.add(cap);
    }

    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(1.79, 0.2, 12, 56, Math.PI),
      gateTrim,
    );
    arch.position.y = 3.22;
    arch.castShadow = true;
    gate.add(arch);

    const innerArch = new THREE.Mesh(
      new THREE.TorusGeometry(1.48, 0.055, 8, 48, Math.PI),
      stone,
    );
    innerArch.position.set(0, 3.22, 0.05);
    gate.add(innerArch);

    for (const doorSide of [-1, 1]) {
      const door = box(
        gate,
        [0.22, 2.35, 0.12],
        [doorSide * 1.45, 1.22, 0.52],
        gatePaint,
        doorSide * -0.42,
      );
      for (let slat = 0; slat < 3; slat += 1) {
        const detail = box(
          gate,
          [0.035, 2.16, 0.035],
          [doorSide * (1.37 + slat * 0.08), 1.22, 0.6],
          gateTrim,
          doorSide * -0.42,
        );
        detail.castShadow = false;
      }
      door.castShadow = true;
    }

    const medallionShape = new THREE.Shape();
    const points = 8;
    for (let index = 0; index < points * 2; index += 1) {
      const radius = index % 2 === 0 ? 0.42 : 0.2;
      const angle = (index * Math.PI) / points - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) medallionShape.moveTo(x, y);
      else medallionShape.lineTo(x, y);
    }
    medallionShape.closePath();
    const medallion = new THREE.Mesh(
      new THREE.ExtrudeGeometry(medallionShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.03, bevelSegments: 2 }),
      gateTrim,
    );
    medallion.position.set(-0.42, 3.75, 0.21);
    medallion.castShadow = true;
    gate.add(medallion);

    addHouse(scene, -4.9, -5.5, 1.15, stone, new THREE.MeshStandardMaterial({ color: "#bd7954", roughness: 0.82 }));
    addHouse(scene, 2.05, -7.8, 1.08, new THREE.MeshStandardMaterial({ color: "#d5b57b", roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: "#9e604a", roughness: 0.85 }));
    addHouse(scene, -5.6, -12.3, 0.82, new THREE.MeshStandardMaterial({ color: "#d0aa77", roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: "#a8674f", roughness: 0.85 }));
    addHouse(scene, 4.6, -14, 0.72, new THREE.MeshStandardMaterial({ color: "#e0c89c", roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: "#b87952", roughness: 0.85 }));

    const foliage = new THREE.MeshStandardMaterial({ color: "#52785a", roughness: 0.94 });
    const trees = [
      addTree(scene, -5.1, 0.5, 1.15, foliage),
      addTree(scene, 3.35, -2.5, 0.88, foliage),
      addTree(scene, -5.7, -8.6, 0.8, foliage),
      addTree(scene, 5.4, -9.3, 0.82, foliage),
      addTree(scene, 2.9, -13.5, 0.62, foliage),
    ];

    const lanterns = [];
    for (const side of [-1, 1]) {
      const lantern = new THREE.PointLight("#ffc36f", 2.8, 5, 2);
      lantern.position.set(-1.35 + side * 2.15, 2.5, 0.95);
      scene.add(lantern);
      lanterns.push(lantern);
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 8),
        new THREE.MeshBasicMaterial({ color: "#ffe1a1" }),
      );
      lamp.position.copy(lantern.position);
      scene.add(lamp);
    }

    const pointer = { x: 0, y: 0 };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;
    let elapsed = 0;
    let lastFrameTime = performance.now();

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      camera.fov = width < 520 ? 46 : 34;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };

    const onPointerMove = (event) => {
      const bounds = host.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };

    const onPointerLeave = () => {
      pointer.x = 0;
      pointer.y = 0;
    };

    const animate = (timestamp) => {
      animationFrame = window.requestAnimationFrame(animate);
      const delta = Math.min((timestamp - lastFrameTime) / 1000, 0.05);
      lastFrameTime = timestamp;
      elapsed += delta;

      camera.position.x += (pointer.x * 0.5 - camera.position.x) * delta * 0.6;
      camera.position.y += (5.2 - pointer.y * 0.16 - camera.position.y) * delta * 0.6;
      camera.lookAt(pointer.x * 0.18, 2 - pointer.y * 0.08, -1.5);
      trees.forEach((tree, index) => {
        tree.rotation.z = Math.sin(elapsed * 0.72 + index) * 0.025;
      });
      lanterns.forEach((lantern, index) => {
        lantern.intensity = 2.4 + Math.sin(elapsed * 2.1 + index * 1.4) * 0.45;
      });
      renderer.render(scene, camera);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);
    resize();

    if (!reducedMotion.matches) {
      animationFrame = window.requestAnimationFrame(animate);
    }

    const onMotionPreferenceChange = (event) => {
      if (event.matches) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        renderer.render(scene, camera);
      } else if (animationFrame === 0) {
        lastFrameTime = performance.now();
        animationFrame = window.requestAnimationFrame(animate);
      }
    };
    reducedMotion.addEventListener("change", onMotionPreferenceChange);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      reducedMotion.removeEventListener("change", onMotionPreferenceChange);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={sceneHost} className="absolute inset-0 overflow-hidden" aria-hidden="true" />;
};

export default MahallaScene;
