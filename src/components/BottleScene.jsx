'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Escena 3D de frascos de la version vanilla (scene-3d.js), portada a React.
// Se mantienen todos los valores numericos para que el resultado sea identico.
export default function BottleScene() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let W = window.innerWidth, H = window.innerHeight;

    // Accesibilidad + rendimiento: si el usuario pide menos movimiento, la escena
    // se muestra estática (un solo frame, sin bucle de animación).
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── RENDERER ──────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    // pixelRatio 2 en pantallas retina = 4× los píxeles a renderar. 1.5 baja mucho
    // la carga de GPU sin notarse en una escena suave/translúcida como esta.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(W, H);
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 60);
    camera.position.z = 8.5;

    // ── LIGHTS ────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.22));

    const L1 = new THREE.PointLight(0xFFE8A0, 9, 22);
    scene.add(L1);
    const L2 = new THREE.PointLight(0xD4AF37, 6, 16);
    scene.add(L2);
    const L3 = new THREE.PointLight(0x5566AA, 2.5, 14);
    L3.position.set(0, -5, 2);
    scene.add(L3);
    const L4 = new THREE.PointLight(0xFFEECC, 4, 12);
    L4.position.set(-4, 4, -2);
    scene.add(L4);
    const L5 = new THREE.PointLight(0xC9927A, 3, 10);
    L5.position.set(0, 5, 1);
    scene.add(L5);

    // ── MATERIALS ─────────────────────────────────────────
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xD4C070, metalness: 0.04, roughness: 0.02,
      transparent: true, opacity: 0.52, clearcoat: 1.0, clearcoatRoughness: 0.0, reflectivity: 0.98,
    });
    const glassNeckMat = new THREE.MeshPhysicalMaterial({
      color: 0xD4C070, metalness: 0.04, roughness: 0.02,
      transparent: true, opacity: 0.58, clearcoat: 1.0, clearcoatRoughness: 0.0,
    });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 1.0, roughness: 0.07, envMapIntensity: 1.2 });
    const goldDarkMat = new THREE.MeshStandardMaterial({ color: 0xAA8C20, metalness: 1.0, roughness: 0.12 });
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: 0xBF6B1A, metalness: 0.0, roughness: 0.08,
      transparent: true, opacity: 0.55, clearcoat: 1.0, clearcoatRoughness: 0.03,
    });
    const labelMat = new THREE.MeshStandardMaterial({ color: 0xF4EED8, metalness: 0.06, roughness: 0.72 });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xD4AF37, transparent: true, opacity: 0.32 });
    const edgeCapMat = new THREE.LineBasicMaterial({ color: 0xFFD050, transparent: true, opacity: 0.6 });

    // ── BOTTLE BUILDER FUNCTION ────────────────────────────
    function buildBottle(scale, posX, posY, posZ, glassOpacity, goldOpacity) {
      const BG = new THREE.Group();

      const gM = glassOpacity < 1 ? glassMat.clone() : glassMat;
      if (glassOpacity !== undefined) gM.opacity = glassOpacity;
      const gNM = glassNeckMat.clone();
      if (glassOpacity !== undefined) gNM.opacity = glassOpacity + 0.05;
      const goldM = goldOpacity !== undefined
        ? Object.assign(goldMat.clone(), { transparent: true, opacity: goldOpacity })
        : goldMat;
      const goldDM = goldOpacity !== undefined
        ? Object.assign(goldDarkMat.clone(), { transparent: true, opacity: goldOpacity })
        : goldDarkMat;
      const eM = edgeMat.clone();
      if (glassOpacity !== undefined) eM.opacity = glassOpacity * 0.65;
      const ecM = edgeCapMat.clone();
      if (goldOpacity !== undefined) ecM.opacity = goldOpacity;

      const bodyG = new THREE.BoxGeometry(1.1, 2.4, 0.62);
      BG.add(new THREE.Mesh(bodyG, gM));
      BG.add(new THREE.LineSegments(new THREE.EdgesGeometry(bodyG), eM));

      const liq = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.92, 0.45), liquidMat.clone());
      liq.material.opacity = (glassOpacity || 0.52) * 1.05;
      liq.position.y = -0.06;
      BG.add(liq);

      const lblF = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.98), labelMat.clone());
      lblF.material.opacity = glassOpacity || 1;
      lblF.material.transparent = true;
      lblF.position.set(0, -0.08, 0.315);
      BG.add(lblF);
      const lblB = lblF.clone();
      lblB.position.set(0, -0.08, -0.315);
      lblB.rotation.y = Math.PI;
      BG.add(lblB);

      const band = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.13, 0.66), goldM);
      band.position.set(0, -1.21, 0); BG.add(band);
      const midRing = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.055, 0.66), goldDM);
      midRing.position.set(0, 0.62, 0); BG.add(midRing);

      const shl = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.565, 0.34, 4), gNM);
      shl.position.y = 1.37; shl.rotation.y = Math.PI / 4;
      BG.add(shl);
      const nk = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.64, 0.27), gNM);
      nk.position.set(0, 1.83, 0); BG.add(nk);
      const collar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.33), goldM);
      collar.position.set(0, 1.56, 0); BG.add(collar);
      const collarR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.33), goldDM);
      collarR.position.set(0, 1.64, 0); BG.add(collarR);

      const capG = new THREE.BoxGeometry(0.56, 0.7, 0.44);
      const capMesh = new THREE.Mesh(capG, goldM);
      capMesh.position.y = 2.49;
      BG.add(capMesh);
      const capEdges = new THREE.LineSegments(new THREE.EdgesGeometry(capG), ecM);
      capEdges.position.y = 2.49;
      BG.add(capEdges);
      const capTop = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.045, 0.36), goldDM);
      capTop.position.set(0, 2.87, 0); BG.add(capTop);

      BG.scale.setScalar(scale);
      BG.position.set(posX, posY, posZ);
      return BG;
    }

    // Main bottle
    const G = buildBottle(0.8, 2.0, 0, 0, 0.52, 1.0);
    scene.add(G);

    // Ghost bottle left-back
    const G2 = buildBottle(1.05, -2.8, 0.5, -4.5, 0.08, 0.09);
    scene.add(G2);

    // Third tiny bottle right-back
    const G3 = buildBottle(0.45, 3.8, -1.2, -5.5, 0.06, 0.07);
    scene.add(G3);

    // ── PARTICLES ─────────────────────────────────────────
    const N = 280;
    const pArr = new Float32Array(N * 3);
    const spd = new Float32Array(N);
    const phases = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pArr[i * 3] = (Math.random() - 0.5) * 18;
      pArr[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pArr[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
      spd[i] = 0.003 + Math.random() * 0.007;
      phases[i] = Math.random() * Math.PI * 2;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
    const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xD4AF37, size: 0.042, transparent: true, opacity: 0.38, sizeAttenuation: true }));
    scene.add(pts);

    // Orbit ring of particles around main bottle
    const N2 = 80;
    const pArr2 = new Float32Array(N2 * 3);
    const spd2 = new Float32Array(N2);
    for (let i = 0; i < N2; i++) {
      const angle = (i / N2) * Math.PI * 2;
      const radius = 1.8 + (Math.random() - 0.5) * 1.0;
      pArr2[i * 3] = Math.cos(angle) * radius;
      pArr2[i * 3 + 1] = (Math.random() - 0.5) * 4;
      pArr2[i * 3 + 2] = Math.sin(angle) * radius * 0.4;
      spd2[i] = 0.004 + Math.random() * 0.006;
    }
    const pGeo2 = new THREE.BufferGeometry();
    pGeo2.setAttribute('position', new THREE.BufferAttribute(pArr2, 3));
    const pts2 = new THREE.Points(pGeo2, new THREE.PointsMaterial({ color: 0xFFE8A0, size: 0.028, transparent: true, opacity: 0.55, sizeAttenuation: true }));
    scene.add(pts2);

    // ── SCROLL KEYFRAMES ──────────────────────────────────
    const keyframes = [
      { sp: 0.00, x: 2.0, y: 0, ry: 0, rx: 0, scale: 0.80, g2x: -2.8, g2ry: 0 },
      { sp: 0.18, x: 0.5, y: -0.3, ry: Math.PI, rx: 0.1, scale: 0.78, g2x: -3.2, g2ry: 0.4 },
      { sp: 0.38, x: -2.2, y: 0.2, ry: Math.PI * 1.6, rx: 0.15, scale: 0.72, g2x: 2.5, g2ry: 0.9 },
      { sp: 0.58, x: 2.4, y: -0.2, ry: Math.PI * 2.6, rx: 0.05, scale: 0.74, g2x: -2.0, g2ry: 1.4 },
      { sp: 0.78, x: -1.0, y: 0.1, ry: Math.PI * 3.4, rx: 0.12, scale: 0.68, g2x: 1.8, g2ry: 2.0 },
      { sp: 1.00, x: 0, y: -0.5, ry: Math.PI * 4.2, rx: 0.08, scale: 0.62, g2x: -1.5, g2ry: 2.6 },
    ];

    function lerpFrames(sp) {
      let a = keyframes[0], b = keyframes[keyframes.length - 1];
      for (let i = 0; i < keyframes.length - 1; i++) {
        if (sp >= keyframes[i].sp && sp <= keyframes[i + 1].sp) {
          a = keyframes[i]; b = keyframes[i + 1]; break;
        }
      }
      const t2 = a.sp === b.sp ? 0 : (sp - a.sp) / (b.sp - a.sp);
      const e = t2 < 0.5 ? 2 * t2 * t2 : -1 + (4 - 2 * t2) * t2; // ease in-out quad
      function li(ka, kb) { return a[ka] + (b[kb ?? ka] - a[ka]) * e; }
      return {
        x: li('x'), y: li('y'), ry: li('ry'), rx: li('rx'),
        scale: li('scale'), g2x: li('g2x'), g2ry: li('g2ry'),
      };
    }

    // ── STATE ─────────────────────────────────────────────
    let scrollY = 0, t = 0;
    let curX = 2, curY = 0, curRY = 0, curRX = 0, curScale = 0.8;
    let curG2X = -2.8, curG2RY = 0;

    const onScroll = () => { scrollY = window.scrollY; };
    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      camera.aspect = W / H; camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // ── ANIMATION LOOP ────────────────────────────────────
    let rafId;
    function tick() {
      rafId = requestAnimationFrame(tick);

      // Pausa el trabajo pesado (render + partículas) cuando el héroe ya no se ve
      // —el usuario está leyendo el catálogo, que tapa el canvas— o la pestaña está
      // oculta. Aquí es donde se recupera la mayor parte de los FPS al hacer scroll.
      if (document.hidden || scrollY > H * 1.1) return;

      t += 0.012;

      const totalH = document.body.scrollHeight - window.innerHeight;
      const sp = totalH > 0 ? Math.min(scrollY / totalH, 1) : 0;
      const mob = W < 700;

      const kf = lerpFrames(sp);
      const LERP = 0.055;

      curX += ((mob ? kf.x * 0.3 : kf.x) - curX) * LERP;
      curY += (kf.y - curY) * LERP;
      curRY += (kf.ry - curRY) * LERP;
      curRX += (kf.rx - curRX) * LERP;
      curScale += (kf.scale - curScale) * LERP;
      curG2X += (kf.g2x - curG2X) * LERP;
      curG2RY += (kf.g2ry - curG2RY) * LERP;

      G.rotation.y = curRY + Math.sin(t * 0.42) * 0.055;
      G.rotation.x = curRX + Math.sin(t * 0.28) * 0.03;
      G.rotation.z = Math.sin(t * 0.19) * 0.018;
      G.position.x = curX;
      G.position.y = curY + Math.sin(t * 0.5) * 0.18;
      G.scale.setScalar(curScale);

      G2.rotation.y = curG2RY + Math.sin(t * 0.22) * 0.14;
      G2.rotation.x = Math.sin(t * 0.17) * 0.04;
      G2.position.x = curG2X;
      G2.position.y = Math.sin(t * 0.33 + 1.2) * 0.22 + 0.3;

      G3.rotation.y = t * 0.28;
      G3.rotation.x = Math.sin(t * 0.21) * 0.08;
      G3.position.y = Math.sin(t * 0.41 + 2.3) * 0.18 - 1.2;

      L1.position.set(Math.sin(t * 0.44) * 5, 4.5, Math.cos(t * 0.44) * 3 + 2.5);
      L2.position.set(Math.cos(t * 0.3) * -3.5, 1.5 + Math.sin(t * 0.36) * 1.5, 2.8);
      L5.position.set(Math.sin(t * 0.55 + 1) * 2, 5, Math.cos(t * 0.55) * 1.5);

      for (let i = 0; i < N; i++) {
        pArr[i * 3 + 1] += spd[i];
        pArr[i * 3] += Math.sin(t + phases[i]) * 0.0008;
        if (pArr[i * 3 + 1] > 7) pArr[i * 3 + 1] = -7;
      }
      pGeo.attributes.position.needsUpdate = true;
      pts.rotation.y = t * 0.006;

      const base2 = new THREE.Vector3(G.position.x, G.position.y, G.position.z);
      for (let i = 0; i < N2; i++) {
        pArr2[i * 3 + 1] += spd2[i] * 0.5;
        if (pArr2[i * 3 + 1] > 2) pArr2[i * 3 + 1] = -2;
      }
      pGeo2.attributes.position.needsUpdate = true;
      pts2.position.copy(base2);
      pts2.rotation.y = t * 0.04;

      renderer.render(scene, camera);
    }

    renderer.render(scene, camera); // primer frame inmediato (nunca queda en blanco)
    if (!reduceMotion) tick();      // y si hay movimiento, arranca el bucle (con su freno)

    // ── CLEANUP ───────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  return <canvas id="global-canvas" ref={canvasRef}></canvas>;
}
