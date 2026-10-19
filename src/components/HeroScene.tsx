"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/*
 * A calm ball-and-stick molecule that turns slowly on the hero's pastel panel.
 *
 * The server renders only the static frame (hero-fallback.webp, captured from this scene),
 * so the hero is complete before any 3D code loads. `three` is imported dynamically, and only
 * when all four hold: WebGL works, reduced motion is not requested, the panel is in view, and
 * the browser is idle. The canvas then fades in over the matching still.
 */

// Brand greens from globals.css @theme (--color-brand-200 … 600). WebGL can't read CSS tokens,
// so the hex values are mirrored here; keep them in step with the theme.
const BRAND = {
  200: 0xbce2cb,
  300: 0x8fcda9,
  400: 0x57b083,
  500: 0x2e9263,
  600: 0x1e7a50,
} as const;

type Atom = { p: [number, number, number]; r: number; c: number };

/**
 * A six-membered ring in a chair shape with a branched side chain, roughly to scale.
 * Heavy atoms are brand-400/500, light terminal atoms brand-200/300.
 */
function buildMolecule() {
  const atoms: Atom[] = [];
  const bonds: [number, number][] = [];
  const add = (p: [number, number, number], r: number, c: number) => atoms.push({ p, r, c }) - 1;

  const ring: number[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ring.push(add([Math.cos(a) * 1.25, Math.sin(a) * 1.25, i % 2 ? 0.22 : -0.22], 0.34, i === 3 ? BRAND[500] : BRAND[400]));
  }
  ring.forEach((idx, i) => bonds.push([idx, ring[(i + 1) % 6]]));

  // Light substituents on four ring atoms, pointing outward and up or down with the chair.
  for (const i of [1, 2, 4, 5]) {
    const a = (i / 6) * Math.PI * 2;
    const h = add([Math.cos(a) * 2.15, Math.sin(a) * 2.15, i % 2 ? 0.75 : -0.75], 0.2, BRAND[200]);
    bonds.push([ring[i], h]);
  }

  // A zig-zag side chain off ring atom 0, ending in a branched head.
  let prev = ring[0];
  const chain: [number, number, number][] = [
    [2.35, 0.35, -0.45],
    [3.35, -0.3, 0.1],
    [4.4, 0.35, -0.3],
  ];
  for (const p of chain) {
    const next = add(p, 0.32, BRAND[400]);
    bonds.push([prev, next]);
    prev = next;
  }
  for (const p of [
    [5.05, 1.25, 0.15],
    [5.15, -0.35, -0.95],
    [4.85, 0.1, 0.75],
  ] as [number, number, number][]) {
    bonds.push([prev, add(p, 0.24, BRAND[300])]);
  }

  // A second, shorter branch off ring atom 3 with one heteroatom.
  const o = add([-2.35, 0.1, 0.55], 0.3, BRAND[600]);
  bonds.push([ring[3], o]);
  bonds.push([o, add([-3.05, -0.75, 0.2], 0.2, BRAND[200])]);

  // Centre the structure on its bounding box so it turns about its middle.
  for (const axis of [0, 1, 2]) {
    const values = atoms.map((a) => a.p[axis]);
    const mid = (Math.min(...values) + Math.max(...values)) / 2;
    for (const a of atoms) a.p[axis] -= mid;
  }

  return { atoms, bonds };
}

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Starting pose; the fallback still is captured from the first frame, so they match. */
const START_Y = -0.5;
const START_X = 0.42;
/** Radians per second: a full turn takes about 70 seconds. */
const SPIN = 0.09;

async function startScene(host: HTMLElement, onFirstFrame: () => void) {
  const THREE = await import("three");

  const lowPower = (navigator.hardwareConcurrency ?? 8) <= 4;
  const renderer = new THREE.WebGLRenderer({ antialias: !lowPower, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "absolute inset-0 size-full opacity-0 transition-opacity duration-300 ease-(--ease-out)";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 4 / 3, 0.1, 100);
  camera.position.set(0, 0, 13);

  scene.add(new THREE.HemisphereLight(0xffffff, BRAND[200], 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 6);
  scene.add(key);

  const { atoms, bonds } = buildMolecule();
  const group = new THREE.Group();
  group.rotation.set(START_X, START_Y, 0);
  scene.add(group);

  // One draw call for every atom, one for every bond.
  const atomGeometry = new THREE.IcosahedronGeometry(1, 3);
  const atomMaterial = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0 });
  const atomMesh = new THREE.InstancedMesh(atomGeometry, atomMaterial, atoms.length);
  const bondGeometry = new THREE.CylinderGeometry(0.07, 0.07, 1, 10, 1, true);
  const bondMaterial = new THREE.MeshStandardMaterial({ color: BRAND[300], roughness: 0.6, metalness: 0 });
  const bondMesh = new THREE.InstancedMesh(bondGeometry, bondMaterial, bonds.length);

  const m = new THREE.Matrix4();
  const colour = new THREE.Color();
  atoms.forEach((a, i) => {
    m.makeScale(a.r, a.r, a.r).setPosition(...a.p);
    atomMesh.setMatrixAt(i, m);
    atomMesh.setColorAt(i, colour.setHex(a.c));
  });

  const up = new THREE.Vector3(0, 1, 0);
  const from = new THREE.Vector3();
  const to = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  bonds.forEach(([a, b], i) => {
    from.set(...atoms[a].p);
    to.set(...atoms[b].p);
    const length = from.distanceTo(to);
    q.setFromUnitVectors(up, to.clone().sub(from).normalize());
    m.compose(from.clone().add(to).multiplyScalar(0.5), q, s.set(1, length, 1));
    bondMesh.setMatrixAt(i, m);
  });
  group.add(bondMesh, atomMesh);

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  host.appendChild(canvas);

  // Time only advances while the scene is drawing, so a paused scene resumes where it stopped.
  let elapsed = 0;
  let last = 0;
  let frame = 0;
  let first = true;
  let inView = true;

  const tick = (now: number) => {
    elapsed += last ? Math.min(now - last, 100) / 1000 : 0;
    last = now;
    group.rotation.y = START_Y + elapsed * SPIN;
    group.rotation.x = START_X + Math.sin(elapsed * 0.25) * 0.06;
    renderer.render(scene, camera);
    if (first) {
      first = false;
      onFirstFrame();
      canvas.classList.replace("opacity-0", "opacity-100");
    }
    frame = requestAnimationFrame(tick);
  };

  const sync = () => {
    const run = inView && document.visibilityState === "visible";
    if (run && !frame) {
      last = 0;
      frame = requestAnimationFrame(tick);
    } else if (!run && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  const viewObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  });
  viewObserver.observe(host);
  document.addEventListener("visibilitychange", sync);
  sync();

  return () => {
    cancelAnimationFrame(frame);
    frame = 0;
    viewObserver.disconnect();
    resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", sync);
    atomMesh.dispose();
    bondMesh.dispose();
    atomGeometry.dispose();
    bondGeometry.dispose();
    atomMaterial.dispose();
    bondMaterial.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
}

/** The hero's 3D panel: a static frame first, the live scene once it is cheap and welcome. */
export function HeroScene() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches || !webglAvailable()) return;

    let cancelled = false;
    let stop: (() => void) | undefined;
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const begin = () => {
      startScene(host, () => setLive(true))
        .then((dispose) => {
          if (cancelled) dispose();
          else stop = dispose;
        })
        .catch(() => {
          // Any failure (a lost context, a blocked chunk) leaves the static frame in place.
        });
    };

    // Wait until the panel is on screen, then until the browser has nothing better to do.
    const view = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      view.disconnect();
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(begin, { timeout: 2000 });
      else timer = setTimeout(begin, 200);
    });
    view.observe(host);

    // Turning reduced motion on mid-visit removes the scene again.
    const onReduce = () => {
      if (!reduce.matches) return;
      cancelled = true;
      view.disconnect();
      stop?.();
      stop = undefined;
      setLive(false);
    };
    reduce.addEventListener("change", onReduce);

    return () => {
      cancelled = true;
      view.disconnect();
      reduce.removeEventListener("change", onReduce);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) clearTimeout(timer);
      stop?.();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      data-live={live || undefined}
      className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-brand-50"
    >
      <Image
        src="/hero-fallback.webp"
        alt=""
        fill
        loading="eager"
        sizes="(min-width: 1024px) 45vw, 100vw"
        // Once the canvas has faded in over it, the still steps out so the two never double up.
        className={`object-cover transition-opacity delay-300 duration-0 ${live ? "opacity-0" : ""}`}
      />
    </div>
  );
}
