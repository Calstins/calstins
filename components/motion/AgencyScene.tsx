"use client";
import { useEffect, useRef } from "react";

/**
 * Hero WebGL scene (three.js, loaded on demand so it never blocks first paint).
 *  - The globe (glass wireframe orb + tilted orbit rings) is placed behind the element marked `data-scene-anchor`,
 *    i.e. the right-hand side of the hero.
 *  - The particle field and the flowing ribbons span the whole hero, behind the text.
 * Everything leans toward the cursor / finger. It pauses off-screen and in hidden tabs, draws a single still frame for
 * reduced motion, and quietly renders nothing if WebGL is unavailable. Decorative only: aria-hidden, no pointer events.
 */
export default function AgencyScene({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch {
        return; // no WebGL: the plain hero still looks right
      }
      const host = (canvas.closest("section") ?? canvas.parentElement) as HTMLElement;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const small = window.innerWidth < 700;

      const LEAF = 0x7fdc8a, MINT = 0xcaf5d0, TEAL = 0x4fd1b5;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.z = 8;
      const root = new THREE.Group();
      scene.add(root);

      // ── Particle field (whole hero) ──
      const count = small ? 700 : 1700;
      const pos = new Float32Array(count * 3);
      const seeds = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const radius = Math.pow(Math.random(), 0.82) * 6.4 + 0.4;
        const angle = Math.random() * Math.PI * 2;
        pos[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.85;
        pos[i * 3 + 1] = (Math.random() - 0.5) * (2.3 + radius * 0.58);
        pos[i * 3 + 2] = Math.sin(angle) * radius - 2.0 + (Math.random() - 0.5) * 0.9;
        seeds[i] = Math.random();
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      pGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
      const pMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uPointer: { value: new THREE.Vector2() }, uEnergy: { value: 0 }, uPx: { value: 1 } },
        vertexShader: `
          uniform float uTime; uniform vec2 uPointer; uniform float uEnergy; uniform float uPx;
          attribute float aSeed; varying float vAlpha; varying float vSeed;
          void main() {
            vec3 p = position;
            float t = uTime * (0.18 + aSeed * 0.2);
            float radial = length(p.xy);
            float angle = atan(p.y, p.x);
            angle += sin(t * 0.7 + radial * 0.9) * 0.08 + t * 0.06;
            p.xy = vec2(cos(angle), sin(angle)) * radial;
            p.x += sin(t + p.z * 0.7 + aSeed * 5.0) * (0.14 + uEnergy * 0.24);
            p.y += cos(t * 0.525 + p.x * 0.35) * (0.10 + uEnergy * 0.14);
            p.z += sin(t * 0.6 + p.y * 0.4) * 0.18;
            float mouse = 1.0 - smoothstep(0.0, 1.0, distance(p.xy * 0.13, uPointer));
            p.xy += uPointer * mouse * 0.75;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (1.1 + aSeed * 2.4 + uEnergy * 2.8) * (7.0 / max(1.0, -mv.z)) * uPx;
            vAlpha = 0.12 + aSeed * 0.5 + mouse * 0.28;
            vSeed = aSeed;
          }`,
        fragmentShader: `
          varying float vAlpha; varying float vSeed;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float glow = smoothstep(0.5, 0.0, d);
            float core = smoothstep(0.18, 0.0, d);
            vec3 leaf = vec3(0.50, 0.86, 0.54);
            vec3 mint = vec3(0.79, 0.96, 0.82);
            vec3 teal = vec3(0.31, 0.82, 0.71);
            vec3 c = mix(leaf, teal, vSeed * 0.8);
            c = mix(c, mint, smoothstep(0.8, 1.0, vSeed));
            float a = glow * vAlpha * 0.6 + core * 0.45;
            if (a < 0.01) discard;
            gl_FragColor = vec4(c, a);
          }`,
      });
      const particles = new THREE.Points(pGeo, pMat);
      particles.position.z = -0.8;
      root.add(particles);

      // ── Globe (right side): wireframe orb + orbit rings, with a travelling node on each ring ──
      const globe = new THREE.Group();
      root.add(globe);
      const orb = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.28, 2),
        new THREE.MeshBasicMaterial({ color: MINT, wireframe: true, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending }),
      );
      globe.add(orb);
      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.0, 1),
        new THREE.MeshBasicMaterial({ color: LEAF, wireframe: true, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending }),
      );
      globe.add(core);

      const rings: { line: import("three").LineLoop; speed: number; node: import("three").Mesh; r: number; phase: number }[] = [];
      function addRing(r: number, opacity: number, tilt: [number, number, number], speed: number, phase: number) {
        const pts = new THREE.EllipseCurve(0, 0, r, r * 0.55, 0, Math.PI * 2, false, 0).getPoints(180);
        const line = new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: LEAF, transparent: true, opacity, blending: THREE.AdditiveBlending }),
        );
        line.rotation.set(...tilt);
        const node = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), new THREE.MeshBasicMaterial({ color: MINT, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending }));
        line.add(node);
        globe.add(line);
        rings.push({ line, speed, node, r, phase });
      }
      addRing(2.25, 0.3, [1.16, 0.2, 0.12], 0.14, 0);
      addRing(3.15, 0.18, [0.86, -0.22, -0.18], -0.09, 2.1);
      addRing(4.15, 0.12, [1.42, 0.25, 0.3], 0.045, 4.2);

      // ── Flowing ribbons (whole hero) ──
      const ribbons: { line: import("three").Line; count: number; radius: number; phase: number; speed: number }[] = [];
      function addRibbon(i: number, color: number, radius: number, z: number, alpha: number) {
        const n = 150;
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: alpha, blending: THREE.AdditiveBlending, depthWrite: false }));
        line.position.z = z;
        root.add(line);
        ribbons.push({ line, count: n, radius, phase: i * 1.7, speed: 0.14 + i * 0.028 });
      }
      addRibbon(0, LEAF, 4.2, -1.9, 0.2);
      addRibbon(1, TEAL, 5.2, -2.5, 0.14);
      addRibbon(2, MINT, 6.2, -3.1, 0.1);
      function updateRibbons(t: number) {
        ribbons.forEach((it, ri) => {
          const arr = it.line.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < it.count; i++) {
            const p = i / (it.count - 1);
            const a = p * Math.PI * 2.4 + it.phase + t * it.speed;
            const wave = Math.sin(a * 2.5 + t * 0.52) * 0.32 + Math.cos(a * 1.7 - t * 0.34) * 0.16;
            arr[i * 3] = Math.cos(a) * (it.radius + wave) * 1.05;
            arr[i * 3 + 1] = Math.sin(a * 1.32 + it.phase) * (1.45 + ri * 0.35) + wave * 0.55;
            arr[i * 3 + 2] = -3.4 + Math.cos(a * 1.8 + t * 0.14) * 1.1 + p * 1.5;
          }
          it.line.geometry.attributes.position.needsUpdate = true;
          it.line.rotation.y = t * (0.02 + ri * 0.006);
          it.line.rotation.x = Math.sin(t * 0.22 + ri) * 0.08;
        });
      }

      // ── Layout: put the globe behind the anchor element ──
      let w = 1, h = 1;
      function layout() {
        const r = host.getBoundingClientRect();
        w = Math.max(1, r.width); h = Math.max(1, r.height);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
        pMat.uniforms.uPx.value = dpr;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z, halfW = halfH * camera.aspect;
        const anchor = host.querySelector<HTMLElement>("[data-scene-anchor]");
        let cx = w * 0.74, cy = h * 0.5, size = Math.min(w * 0.5, h * 0.8);
        if (anchor) {
          const a = anchor.getBoundingClientRect();
          cx = a.left - r.left + a.width / 2; cy = a.top - r.top + a.height / 2; size = Math.min(a.width, a.height) * 1.05;
        }
        globe.position.set((cx / w * 2 - 1) * halfW, -(cy / h * 2 - 1) * halfH, 0);
        const pxPerUnit = h / (2 * halfH);
        globe.scale.setScalar(Math.max(0.2, size / 2 / pxPerUnit / 2.6));
        draw(last);
      }

      // ── Pointer ──
      const target = new THREE.Vector2(), pointer = new THREE.Vector2();
      function onMove(e: PointerEvent) {
        const r = host.getBoundingClientRect();
        target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        target.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      }
      const onLeave = () => target.set(0, 0);
      host.addEventListener("pointermove", onMove as EventListener, { passive: true });
      host.addEventListener("pointerleave", onLeave);

      // ── Frame ──
      const clock = new THREE.Clock();
      let last = 0, raf = 0, running = false, visible = true;
      function draw(raw: number) {
        const t = raw * 1.35;
        last = raw;
        pointer.lerp(target, 0.085);
        pMat.uniforms.uTime.value = t;
        pMat.uniforms.uPointer.value.copy(pointer);
        updateRibbons(t);
        globe.rotation.y += (pointer.x * 0.5 - globe.rotation.y) * 0.04;
        globe.rotation.x += (-pointer.y * 0.35 - globe.rotation.x) * 0.04;
        orb.rotation.x = t * 0.11; orb.rotation.y = t * 0.17;
        core.rotation.x = -t * 0.09; core.rotation.y = t * 0.13;
        orb.scale.setScalar(1 + Math.sin(t * 1.35) * 0.022);
        const active = Math.floor(((t % 4.0) / 4.0) * 3);
        rings.forEach((rg, i) => {
          rg.line.rotation.z += rg.speed * 0.0026;
          const a = t * 0.5 * (1 + i * 0.3) + rg.phase;
          rg.node.position.set(Math.cos(a) * rg.r, Math.sin(a) * rg.r * 0.55, 0);
          const on = i === active;
          (rg.line.material as import("three").LineBasicMaterial).opacity = on ? 0.55 : [0.3, 0.18, 0.12][i];
          rg.node.scale.setScalar(on ? 2.2 : 1.2);
        });
        root.position.x += (pointer.x * 0.16 - root.position.x) * 0.03;
        root.position.y += (pointer.y * 0.11 - root.position.y) * 0.03;
        renderer.render(scene, camera);
      }
      function frame() { if (!running) return; draw(clock.getElapsedTime()); raf = requestAnimationFrame(frame); }
      const play = () => { if (reduce || running || !visible || document.hidden) return; running = true; clock.start(); raf = requestAnimationFrame(frame); };
      const stop = () => { running = false; cancelAnimationFrame(raf); };

      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) play(); else stop(); });
      io.observe(host);
      const ro = new ResizeObserver(layout);
      ro.observe(host);
      const onVis = () => (document.hidden ? stop() : play());
      document.addEventListener("visibilitychange", onVis);
      layout();
      if (reduce) draw(4); else play();

      cleanup = () => {
        stop(); io.disconnect(); ro.disconnect();
        host.removeEventListener("pointermove", onMove as EventListener);
        host.removeEventListener("pointerleave", onLeave);
        document.removeEventListener("visibilitychange", onVis);
        scene.traverse((o) => {
          const m = o as import("three").Mesh;
          m.geometry?.dispose?.();
          const mat = m.material as import("three").Material | import("three").Material[] | undefined;
          (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
        });
        renderer.dispose();
      };
    })();

    return () => { disposed = true; cleanup(); };
  }, []);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none ${className}`} />;
}
