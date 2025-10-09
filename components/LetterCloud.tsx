"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const CONFIG = {
  word: "Lighthouse",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
  fontWeight: 800,
  wordScale: 0.60,
  sampleGap: 4,
  letterSpacing: 0.06,
  mouseRepelRadius: 90,
  mouseRepelForce: 9,
  mouseSmooth: 0.18,
  dockDeadzone: 18,
  colorFg: "#e5e7eb",
  colorAccent: "#a78bfa",
  colorBg: "#0b0b10",
  dropDurationMs: 1200,
  morphDelayMs: 900,
  gravity: 2.8,
  bounce: -0.28,
  groundFriction: 0.82,
  launchXFrac: -0.08,
  launchYFrac: -0.22,
  launchRadiusFrac: 0.10,
  launchSpeed: 6.0,
  launchSpeedJitter: 0.35,
  launchAngleDeg: 70,
  launchSpreadDeg: 24,
  bgGlyphs: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+-=<>?@",
  bgDensity: 0.22,
  bgSpeed: 0.25,

  // ★ 待机轮播
  idleTargets: ["Lighthouse", "Halo"],
  idleStartDelayMs: 1400,
  idleIntervalMs: 6000,

  // ★ 新增：形态过渡参数（可接到 /tuner）
  transitionMs: 1200,        // 单次形态切换总时长
  transitionJitterMs: 180    // 逐粒子错峰时长（毫秒）
};

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefers(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return prefers;
}

// 工具：clamp + ease
function clamp01(x:number){ return x < 0 ? 0 : x > 1 ? 1 : x; }
// 近似 cubic-bezier(0.4, 0.0, 0.2, 1)
function easeInOut(t:number){ return t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }

type WPProps = {
  word?: string;
  gap?: number;
  letterSpacing?: number;
  gravity?: number; bounce?: number; groundFriction?: number;
  dropDurationMs?: number; morphDelayMs?: number;
  launchXFrac?: number; launchYFrac?: number; launchRadiusFrac?: number;
  launchSpeed?: number; launchSpeedJitter?: number;
  launchAngleDeg?: number; launchSpreadDeg?: number;
  outline?: boolean;
  morphK?: number;
  dockMaxOffset?: number;
  glyphSizePx?: number;       // 覆盖粒子字大小
  skipDrop?: boolean;         // 跳过“落地阶段”（用于轮播的平滑形变）
};

function WordParticles(props: WPProps) {
  const {
    word = CONFIG.word, gap = CONFIG.sampleGap, letterSpacing = CONFIG.letterSpacing,
    gravity = CONFIG.gravity, bounce = CONFIG.bounce, groundFriction = CONFIG.groundFriction,
    dropDurationMs = CONFIG.dropDurationMs, morphDelayMs = CONFIG.morphDelayMs,
    launchXFrac = CONFIG.launchXFrac, launchYFrac = CONFIG.launchYFrac, launchRadiusFrac = CONFIG.launchRadiusFrac,
    launchSpeed = CONFIG.launchSpeed, launchSpeedJitter = CONFIG.launchSpeedJitter,
    launchAngleDeg = CONFIG.launchAngleDeg, launchSpreadDeg = CONFIG.launchSpreadDeg,
    outline = false, morphK, dockMaxOffset, glyphSizePx, skipDrop
  } = props;

  // 供外侧在 word 变化时触发“平滑重定向”
  const retargetRef = useRef<null | ((newWord: string) => void)>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tempRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);
  const prefersReduced = usePrefersReducedMotion();
  const glyphs = useMemo(() => CONFIG.bgGlyphs.split(""), []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const temp = tempRef.current || document.createElement("canvas");
    tempRef.current = temp;
    const tctx = temp.getContext("2d")!;

    let raf = 0;
    let particles: any[] = [];
    let phase: "drop" | "morph" = skipDrop ? "morph" : "drop";
    let wasMorph = phase === "morph";        // ★ 记录上帧是否处于 morph
    let morphElapsedMs = 0;                  // ★ morph 阶段累计时长
    const TRANS_DUR = CONFIG.transitionMs ?? 1200;
    const TRANS_JIT = CONFIG.transitionJitterMs ?? 0;

    let elapsedMs = 0; let lastTs = 0;
    let bg: any[] = [];
    let mouse = { x: -9999, y: -9999 };
    let smouse = { x: -9999, y: -9999 };

    const DPR = Math.min(2, window.devicePixelRatio || 1);

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width * DPR));
      const h = Math.max(1, Math.floor(rect.height * DPR));
      canvas.width = w; canvas.height = h;
      (ctx as any).setTransform(DPR, 0, 0, DPR, 0, 0);
      buildScene();
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left);
      mouse.y = (e.clientY - rect.top);
    };
    const onMouseLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    function buildScene() {
      const w = canvas.width / DPR;
      const h = canvas.height / DPR;
      let size = Math.floor(Math.min(w, h) * CONFIG.wordScale);
      temp.width = Math.max(1, Math.floor(w * DPR));
      temp.height = Math.max(1, Math.floor(h * DPR));
      tctx.setTransform(1, 0, 0, 1, 0, 0);
      tctx.clearRect(0, 0, temp.width, temp.height);
      tctx.fillStyle = "white";
      tctx.textAlign = "center";
      tctx.textBaseline = "middle";
      tctx.font = `${CONFIG.fontWeight} ${size * DPR}px ${CONFIG.fontFamily}`;
      const targetW = w * 0.85;
      const midY = (h / 2) * DPR;
      const measureTotal = (sz: number) => {
        tctx.font = `${CONFIG.fontWeight} ${sz * DPR}px ${CONFIG.fontFamily}`;
        const sp = sz * (letterSpacing ?? 0.06);
        let width = 0;
        for (let i = 0; i < word.length; i++) {
          width += tctx.measureText(word[i]).width / DPR;
          if (i < word.length - 1) width += sp;
        }
        return { width, sp };
      };
      let { width: totalW, sp: spacingPx } = measureTotal(size);
      if (totalW > 0) {
        const fitted = Math.min(size * (targetW / totalW), h * 0.60);
        size = Math.max(12, fitted);
        ({ width: totalW, sp: spacingPx } = measureTotal(size));
      }
      tctx.font = `${CONFIG.fontWeight} ${size * DPR}px ${CONFIG.fontFamily}`;
      let x = (w - totalW) / 2;
      for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        const cw = tctx.measureText(ch).width / DPR;
        tctx.fillText(ch, (x + cw / 2) * DPR, midY);
        x += cw + spacingPx;
      }

      const img = tctx.getImageData(0, 0, temp.width, temp.height).data;
      const targets: {x:number;y:number;}[] = [];
      const step = Math.max(1, Math.floor((gap ?? 4) * DPR));
      const alphaThreshold = 160;
      for (let y = 0; y < temp.height; y += step) {
        for (let x = 0; x < temp.width; x += step) {
          const idx = (y * temp.width + x) * 4 + 3;
          if (img[idx] > alphaThreshold)
            targets.push({ x: x / DPR + (Math.random() - 0.5) * ((gap ?? 4) * 0.6), y: y / DPR + (Math.random() - 0.5) * ((gap ?? 4) * 0.6) });
        }
      }

      const needed = targets.length;
      if (particles.length < needed) {
        for (let i = particles.length; i < needed; i++) {
          if (skipDrop) {
            // 轮播：从目标附近生成，避免再次“落地”
            const tx = targets[i].x, ty = targets[i].y;
            const jitter = (gap ?? 4) * 1.2;
            particles.push({
              x: tx + (Math.random() - 0.5) * jitter,
              y: ty + (Math.random() - 0.5) * jitter,
              vx: 0, vy: 0, tx: 0, ty: 0,
              d: Math.random() * TRANS_JIT,      // ★ 每粒子错峰
              c: glyphs[(Math.random()*glyphs.length)|0]
            });
          } else {
            const minDim = Math.min(w, h);
            const r = (launchRadiusFrac ?? CONFIG.launchRadiusFrac) * minDim;
            const originX = w * (launchXFrac ?? CONFIG.launchXFrac) + (Math.random() - 0.5) * r * 2;
            const originY = h * (launchYFrac ?? CONFIG.launchYFrac) + (Math.random() - 0.5) * r * 2;
            const ang = ((launchAngleDeg ?? CONFIG.launchAngleDeg) + (Math.random() - 0.5) * (launchSpreadDeg ?? CONFIG.launchSpreadDeg)) * Math.PI / 180;
            const spd = (launchSpeed ?? CONFIG.launchSpeed) * (1 + (Math.random() - 0.5) * (launchSpeedJitter ?? CONFIG.launchSpeedJitter));
            particles.push({
              x: originX, y: originY, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, tx: 0, ty: 0,
              d: Math.random() * TRANS_JIT,      // ★ 首轮 morph 也略有错峰
              c: glyphs[(Math.random()*glyphs.length)|0]
            });
          }
        }
      } else if (particles.length > needed) {
        particles = particles.slice(0, needed);
      }
      for (let i = 0; i < needed; i++) { particles[i].tx = targets[i].x; particles[i].ty = targets[i].y; }

      bg = [];
      const cell = Math.max(10, Math.floor((gap ?? 4) * 1.5));
      for (let yy = 0; yy < h; yy += cell) {
        for (let xx = 0; xx < w; xx += cell) {
          if (Math.random() < CONFIG.bgDensity) bg.push({ x: xx, y: yy, c: glyphs[(Math.random()*glyphs.length)|0], t: Math.random()*1000 });
        }
      }
      setReady(true);
    }

function retargetToWord(newWord: string) {
  // 复用与 buildScene 相同的“采样文字轮廓”流程，但只更新目标点，不重建一切
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.width / DPR;
  const h = canvas.height / DPR;

  // 在 temp 画布上绘新字
  let size = Math.floor(Math.min(w, h) * CONFIG.wordScale);
  tctx.setTransform(1,0,0,1,0,0);
  tctx.clearRect(0,0,temp.width,temp.height);
  tctx.fillStyle = "white";
  tctx.textAlign = "center";
  tctx.textBaseline = "middle";

  const targetW = w * 0.85;
  const measureTotal = (sz:number) => {
    tctx.font = `${CONFIG.fontWeight} ${sz * DPR}px ${CONFIG.fontFamily}`;
    const sp = sz * (letterSpacing ?? 0.06);
    let width = 0;
    for (let i=0;i<newWord.length;i++){
      width += tctx.measureText(newWord[i]).width / DPR;
      if (i < newWord.length - 1) width += sp;
    }
    return { width, sp };
  };
  let { width: totalW, sp: spacingPx } = measureTotal(size);
  if (totalW > 0) {
    const fitted = Math.min(size * (targetW / totalW), h * 0.60);
    size = Math.max(12, fitted);
    ({ width: totalW, sp: spacingPx } = measureTotal(size));
  }
  tctx.font = `${CONFIG.fontWeight} ${size * DPR}px ${CONFIG.fontFamily}`;
  const midY = (h / 2) * DPR;
  let x0 = ((w - totalW) / 2) * DPR;
  for (let i=0;i<newWord.length;i++){
    const ch = newWord[i];
    const cw = tctx.measureText(ch).width;
    tctx.fillText(ch, x0 + cw/2, midY);
    x0 += cw + spacingPx * DPR;
  }

  // 采样像素 → 目标点
  const img = tctx.getImageData(0, 0, temp.width, temp.height).data;
  const targets: {x:number;y:number}[] = [];
  const stepPix = Math.max(1, Math.floor((gap ?? 4) * DPR));
  const alphaThreshold = 160;
  for (let y=0; y<temp.height; y += stepPix) {
    for (let x=0; x<temp.width; x += stepPix) {
      const idx = (y * temp.width + x) * 4 + 3;
      if (img[idx] > alphaThreshold) {
        targets.push({
          x: x / DPR + (Math.random()-0.5) * ((gap ?? 4) * 0.6),
          y: y / DPR + (Math.random()-0.5) * ((gap ?? 4) * 0.6)
        });
      }
    }
  }

  // 调整粒子数量并写入目标；为每个粒子刷新错峰延迟
  if (particles.length < targets.length) {
    // 新增的粒子就近生成（跳过落地）
    const jitter = (gap ?? 4) * 1.2;
    for (let i=particles.length; i<targets.length; i++){
      const t = targets[i];
      particles.push({
        x: t.x + (Math.random()-0.5)*jitter,
        y: t.y + (Math.random()-0.5)*jitter,
        vx: 0, vy: 0, tx: t.x, ty: t.y,
        d: Math.random() * (CONFIG.transitionJitterMs ?? 0),
        c: glyphs[(Math.random()*glyphs.length)|0]
      });
    }
  } else if (particles.length > targets.length) {
    particles = particles.slice(0, targets.length);
  }
  for (let i=0;i<targets.length;i++){
    particles[i].tx = targets[i].x;
    particles[i].ty = targets[i].y;
    particles[i].d = Math.random() * (CONFIG.transitionJitterMs ?? 0);
  }

  // 强制进入 morph，并重置过渡计时，让切换“可见”
  phase = "morph";
  wasMorph = false;        // 下一帧会被识别为“刚进入 morph”，从 0 计时
  morphElapsedMs = 0;
}

// 挂到 ref，供外部 useEffect 调用
retargetRef.current = retargetToWord;


    function step(ts?: number) {
      if (ts == null || Number.isNaN(ts)) ts = performance.now();
      if (!lastTs) lastTs = ts;
      const dt = ts - lastTs; lastTs = ts;
      const fscale = Math.min(2, Math.max(0.5, dt / 16.6667));
      elapsedMs += dt;
      const w = canvas.width / DPR;
      const h = canvas.height / DPR;

      // 背景
      ctx.fillStyle = CONFIG.colorBg; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.font = `600 12px ${CONFIG.fontFamily}`;
      for (const g of bg) {
        (g as any).t += CONFIG.bgSpeed * fscale;
        const flicker = 0.5 + 0.5 * Math.sin((g as any).t * 0.05);
        (ctx as any).globalAlpha = 0.08 + 0.12 * flicker;
        ctx.fillText(g.c, g.x, g.y);
      }
      (ctx as any).globalAlpha = 1;

      if (!prefersReduced) {
        const morphT = (dropDurationMs ?? CONFIG.dropDurationMs) + (morphDelayMs ?? CONFIG.morphDelayMs);
        const forceMorph = !!skipDrop;
        const newPhase: "drop" | "morph" = forceMorph ? "morph" : (elapsedMs >= morphT ? "morph" : "drop");

        // ★ 进入 morph 的第一帧：重置计时
        if (newPhase === "morph" && !wasMorph) { morphElapsedMs = 0; }
        if (newPhase !== "morph") { morphElapsedMs = 0; }
        wasMorph = newPhase === "morph";
        phase = newPhase;

        // 平滑鼠标
        const a = Math.min(0.9, (CONFIG.mouseSmooth || 0.18) * fscale);
        smouse.x += (mouse.x - smouse.x) * a; smouse.y += (mouse.y - smouse.y) * a;

        for (const p of particles) {
          if (phase === "drop") {
            // 落地阶段
            p.vy += (gravity ?? CONFIG.gravity) * 0.08 * fscale;
            p.x += p.vx * fscale; p.y += p.vy * fscale;
            const groundY = h - 10;
            if (p.y > groundY) {
              p.y = groundY; p.vy *= (bounce ?? CONFIG.bounce);
              p.vx = p.vx * (groundFriction ?? CONFIG.groundFriction) + (Math.random() - 0.5) * 1.6;
              if (Math.abs(p.vy) < 0.12) p.vy = 0;
            }
            const wall = 8;
            if (p.y >= groundY - 0.5) {
              if (p.x < wall) { p.x = wall; p.vx = -p.vx * 0.7; }
              else if (p.x > w - wall) { p.x = w - wall; p.vx = -p.vx * 0.7; }
            } else if (p.x > w - wall) { p.x = w - wall; p.vx = -p.vx * 0.7; }
          } else {
            // 形变阶段
            morphElapsedMs += dt;

            // 轻 dock 交互
            let pushX = 0, pushY = 0;
            const dxm = p.x - smouse.x; const dym = p.y - smouse.y;
            const r = CONFIG.mouseRepelRadius; const d = Math.hypot(dxm, dym);
            if (d < r) {
              const dead = CONFIG.dockDeadzone || 0;
              const t = Math.max(0, (d - dead) / Math.max(1e-3, r - dead));
              const falloff = 1 - t;
              const base = (CONFIG.mouseRepelForce || 9) * falloff * falloff;
              const ux = d > 1e-3 ? dxm / d : 0; const uy = d > 1e-3 ? dym / d : 0;
              const maxOffset = typeof (props.dockMaxOffset) === 'number' ? props.dockMaxOffset : 10;
              const off = Math.min(maxOffset, base * 0.8);
              pushX = ux * off; pushY = uy * off;
            }

            // 目标向量
            const dx = (p.tx + pushX) - p.x; const dy = (p.ty + pushY) - p.y;

            // ★ 缓动进度（带错峰）
            const tLocal = clamp01((morphElapsedMs - (p.d || 0)) / TRANS_DUR);
            const eased = easeInOut(tLocal);

            // ★ 动态跟随强度：起步更温柔，靠近时平滑收敛
            const baseK = 0.04; // 起步更柔
            const gainK = (typeof (morphK) === 'number' ? morphK : 0.14) * 1.00; // 去掉 1.35 的放大
            const kNow = baseK + eased * gainK;


            const tt = 1 - Math.pow(1 - kNow, Math.max(1, dt / 16.67));
            p.x += dx * tt; p.y += dy * tt;

            if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) { p.x = p.tx; p.y = p.ty; }
          }
        }
      } else {
        for (const p of particles) { p.x = p.tx; p.y = p.ty; }
      }

      // 绘制
      ctx.fillStyle = CONFIG.colorFg;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const minDim = Math.min(canvas.width, canvas.height) / DPR;
      const autoFs = Math.max(8, Math.floor((gap ?? 4) * 1.4));
      const userFs = (typeof glyphSizePx === "number" && glyphSizePx > 0)
        ? Math.max(6, Math.floor(glyphSizePx))
        : autoFs;
      const baseFs = Math.min(userFs, Math.floor(minDim * 0.06));
      ctx.font = `700 ${baseFs}px ${CONFIG.fontFamily}`;

      for (const p of particles) {
        // 可选：微淡入（0.85 → 1.0）
        let alpha = 1;
        if (wasMorph) {
          const tLocal = clamp01((morphElapsedMs - (p.d || 0)) / (CONFIG.transitionMs ?? 1200));
          const eased = easeInOut(tLocal);
          alpha = 0.85 + 0.15 * eased;
        }
        (ctx as any).globalAlpha = alpha;
        if (outline) { ctx.lineWidth = 1; (ctx as any).strokeStyle = "rgba(0,0,0,0.6)"; ctx.strokeText(p.c, p.x, p.y); }
        ctx.fillText(p.c, p.x, p.y);
      }
      (ctx as any).globalAlpha = 1;

      raf = requestAnimationFrame(step as FrameRequestCallback);
    }

    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(canvas);
    const onMove = (e: MouseEvent) => onMouseMove(e);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    raf = requestAnimationFrame(step as FrameRequestCallback);

    return () => {
      cancelAnimationFrame(raf);
      resizeObs.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [word, gap, letterSpacing, gravity, bounce, groundFriction, dropDurationMs, morphDelayMs, launchXFrac, launchYFrac, launchRadiusFrac, launchSpeed, launchSpeedJitter, launchAngleDeg, launchSpreadDeg, glyphSizePx, morphK, dockMaxOffset, skipDrop]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {!ready && (<div className="absolute inset-0 grid place-items-center text-zinc-400 text-sm">Preparing…</div>)}
    </div>
  );
}

export default function FullscreenHome() {
  // 可被 /tuner 覆盖的参数
  const [word, setWord] = useState(CONFIG.word);
  const [gap, setGap] = useState(CONFIG.sampleGap);
  const [morphK, setMorphK] = useState<number>(0.14);
  const [dockMaxOffset, setDockMaxOffset] = useState<number>(10);
  const [glyphSizePx, setGlyphSizePx] = useState<number | undefined>(undefined);

  // 轮播控制
  const [skipDrop, setSkipDrop] = useState(false); // 首轮完整，之后只 morph
  const idleIdxRef = useRef(0);
  const idleIntervalRef = useRef<number | undefined>(undefined);
  const idleStarterRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel("lettercloud-tune");
      const onMsg = (e: MessageEvent) => handleMsg(e.data);
      ch.addEventListener("message", onMsg);
    } catch {}
    const onStorage = (ev: StorageEvent) => {
      if (ev.key !== "lettercloud-tune" || !ev.newValue) return;
      try { handleMsg(JSON.parse(ev.newValue)); } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => { ch?.close(); window.removeEventListener("storage", onStorage); };
  }, []);

  function handleMsg(m: any) {
    if (!m) return;
    if (typeof m.word === "string") setWord(m.word);
    if (typeof m.sampleGap === "number") setGap(m.sampleGap);
    if (typeof m.morphK === "number") setMorphK(m.morphK);
    if (typeof m.dockMaxOffset === "number") setDockMaxOffset(m.dockMaxOffset);
    if (typeof m.glyphSizePx === "number") setGlyphSizePx(m.glyphSizePx);

    // Idle rotation 接收
    if (Array.isArray(m.idleTargets)) (CONFIG as any).idleTargets = m.idleTargets;
    if (typeof m.idleStartDelayMs === "number") (CONFIG as any).idleStartDelayMs = m.idleStartDelayMs;
    if (typeof m.idleIntervalMs === "number") (CONFIG as any).idleIntervalMs = m.idleIntervalMs;

    const numKeys = ["gravity","bounce","groundFriction","dropDurationMs","morphDelayMs",
      "launchXFrac","launchYFrac","launchRadiusFrac","launchSpeed","launchSpeedJitter","launchAngleDeg","launchSpreadDeg",
      "mouseRepelRadius","mouseRepelForce","mouseSmooth","dockDeadzone","bgDensity","bgSpeed","wordScale","letterSpacing",
      "transitionMs","transitionJitterMs" // ★ 可通过 tuner 注入
    ];
    for (const k of numKeys) if (typeof m[k] === "number") (CONFIG as any)[k] = m[k];
    const strKeys = ["colorFg","colorBg","colorAccent"];
    for (const k of strKeys) if (typeof m[k] === "string") (CONFIG as any)[k] = m[k];
  }

  // 首次完整动画结束后启动轮播
  useEffect(() => {
    // 清理旧计时器
    if (idleStarterRef.current) { clearTimeout(idleStarterRef.current); idleStarterRef.current = undefined; }
    if (idleIntervalRef.current) { clearInterval(idleIntervalRef.current); idleIntervalRef.current = undefined; }

    setSkipDrop(false); // 首轮允许 drop → morph

    const initialDelay =
      (CONFIG.dropDurationMs ?? 1200) + (CONFIG.morphDelayMs ?? 900) + (CONFIG.idleStartDelayMs ?? 1200);

    idleStarterRef.current = window.setTimeout(() => {
      setSkipDrop(true); // 进入待机：之后只做 morph
      const list = Array.isArray(CONFIG.idleTargets) ? CONFIG.idleTargets : [];
      if (!list.length) return;
      idleIntervalRef.current = window.setInterval(() => {
        idleIdxRef.current = (idleIdxRef.current + 1) % list.length;
        setWord(list[idleIdxRef.current]);
      }, CONFIG.idleIntervalMs ?? 6000) as unknown as number;
    }, initialDelay) as unknown as number;

    return () => {
      if (idleStarterRef.current) clearTimeout(idleStarterRef.current);
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <section className="relative h-[100svh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <WordParticles
            word={word}
            gap={gap}
            letterSpacing={CONFIG.letterSpacing}
            glyphSizePx={glyphSizePx}
            gravity={CONFIG.gravity}
            bounce={CONFIG.bounce}
            groundFriction={CONFIG.groundFriction}
            dropDurationMs={CONFIG.dropDurationMs}
            morphDelayMs={CONFIG.morphDelayMs}
            launchXFrac={CONFIG.launchXFrac}
            launchYFrac={CONFIG.launchYFrac}
            launchRadiusFrac={CONFIG.launchRadiusFrac}
            launchSpeed={CONFIG.launchSpeed}
            launchSpeedJitter={CONFIG.launchSpeedJitter}
            launchAngleDeg={CONFIG.launchAngleDeg}
            launchSpreadDeg={CONFIG.launchSpreadDeg}
            morphK={morphK}
            dockMaxOffset={dockMaxOffset}
            skipDrop={skipDrop}
          />
        </div>
        {/* Replay 按钮已移除 */}
        <h1 className="sr-only" aria-live="polite">{word}</h1>
      </section>
    </div>
  );
}
