"use client";

import React from "react";

import { BlogMain } from "@/components/BlogMain";

import type { PostSummary } from "@/lib/posts";


/** 全局参数（本地 /tuner 可通过 BroadcastChannel 覆盖其中多数） */
const CONFIG = {
  word: "Lighthouse",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
  fontWeight: 800,

  // 版面与取样
  wordScale: 0.60,       // 词形占 min(width,height) 的比例（用于取样目标点）
  sampleGap: 4,          // 取样间距（越小点越多）
  letterSpacing: 0.06,   // 字间距（按字号比例）

  // 交互（类 dock）
  mouseRepelRadius: 90,
  mouseRepelForce: 9,
  mouseSmooth: 0.18,
  dockDeadzone: 18,

  // 颜色与背景
  colorFg: "#e5e7eb",
  colorAccent: "#a78bfa",
  colorBg: "#0b0b10",
  bgGlyphs: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+-=<>?@",
  bgDensity: 0.22,
  bgSpeed: 0.25,

  // 首轮：抛撒→落地→汇聚
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

  // 待机轮播
  idleTargets: ["Lighthouse", "Halo"],
  idleStartDelayMs: 1400,
  idleIntervalMs: 6000,

  // 两形态之间的总体过渡
  transitionMs: 1200,
  transitionJitterMs: 180,

  // ★ 两阶段过渡：先汇聚成一束 → 再喷出成型
  funnelSplit: 0.45,       // 第一阶段所占比例（0..1）
  funnelXFrac: 0.50,       // 汇聚点 X（相对宽度 0..1）
  funnelYFrac: 0.52,       // 汇聚点 Y（相对高度 0..1）
  funnelRadiusPx: 18,      // 汇聚束初始半径
  funnelJitterPx: 6        // 汇聚时的轻微抖散
};

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setPrefers(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return prefers;
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
// 近似 cubic-bezier(0.4, 0.0, 0.2, 1)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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
  glyphSizePx?: number;            // 粒子字大小（px）
  skipDrop?: boolean;              // 轮播时 true：跳过落地，直接做两阶段过渡
};

export type WordParticlesHandle = {
  retarget(word: string): void;
  triggerExit(): void;
};

const WordParticles = React.forwardRef<WordParticlesHandle, WPProps>(function WordParticles(props, ref) {
  const {
    word = CONFIG.word,
    gap = CONFIG.sampleGap,
    letterSpacing = CONFIG.letterSpacing,

    gravity = CONFIG.gravity,
    bounce = CONFIG.bounce,
    groundFriction = CONFIG.groundFriction,

    dropDurationMs = CONFIG.dropDurationMs,
    morphDelayMs = CONFIG.morphDelayMs,

    launchXFrac = CONFIG.launchXFrac,
    launchYFrac = CONFIG.launchYFrac,
    launchRadiusFrac = CONFIG.launchRadiusFrac,
    launchSpeed = CONFIG.launchSpeed,
    launchSpeedJitter = CONFIG.launchSpeedJitter,
    launchAngleDeg = CONFIG.launchAngleDeg,
    launchSpreadDeg = CONFIG.launchSpreadDeg,

    outline = false,
    morphK,
    dockMaxOffset,
    glyphSizePx,
    skipDrop
  } = props;

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const tempRef = React.useRef<HTMLCanvasElement | null>(null);
  const readyRef = React.useRef(false);
  const [ready, setReady] = React.useState(false);
  const prefersReduced = usePrefersReducedMotion();
  const glyphs = React.useMemo(() => CONFIG.bgGlyphs.split(""), []);

  // 用于“在位重定向”与退出动画触发
  const retargetRef = React.useRef<null | ((newWord: string) => void)>(null);
  const exitTriggerRef = React.useRef<() => void>(() => {});

  React.useImperativeHandle(
    ref,
    () => ({
      retarget(newWord: string) {
        retargetRef.current?.(newWord);
      },
      triggerExit() {
        exitTriggerRef.current?.();
      }
    }),
    []
  );

  React.useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const temp = (tempRef.current ||= document.createElement("canvas"));
    const tctx = temp.getContext("2d")!;
    const DPR = Math.min(2, window.devicePixelRatio || 1);

    // 内部状态（不触发 React 渲染）
    let raf = 0;
    type P = {
      x: number; y: number; vx: number; vy: number;
      tx: number; ty: number; c: string;
      d?: number;                 // 错峰延迟（ms）
      hox?: number; hoy?: number; // 汇聚方向单位向量
      hrad?: number;              // 汇聚初始半径
    };
    let particles: P[] = [];
    let bg: Array<{x:number;y:number;c:string;t:number}> = [];

    let phase: "drop" | "morph" | "exit" = skipDrop ? "morph" : "drop";
    let wasMorph = phase === "morph";
    let morphElapsedMs = 0;
    let exitElapsedMs = 0;

    let elapsedMs = 0, lastTs = 0;

    const mouse = { x: -9999, y: -9999 };
    const smouse = { x: -9999, y: -9999 };

    const TRANS_DUR = CONFIG.transitionMs ?? 1200;
    const TRANS_JIT = CONFIG.transitionJitterMs ?? 0;

    function ensureTempSize() {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width * DPR));
      const h = Math.max(1, Math.floor(rect.height * DPR));
      if (temp.width !== w || temp.height !== h) {
        temp.width = w; temp.height = h;
      }
    }

    function renderWordToTemp(text: string) {
      ensureTempSize();
      const w = canvas.width / DPR;
      const h = canvas.height / DPR;

      // 根据 wordScale 估算字号，然后按目标宽 85% 自适配
      let size = Math.floor(Math.min(w, h) * CONFIG.wordScale);

      tctx.setTransform(1, 0, 0, 1, 0, 0);
      tctx.clearRect(0, 0, temp.width, temp.height);
      tctx.fillStyle = "white";
      tctx.textAlign = "center";
      tctx.textBaseline = "middle";

      const targetW = w * 0.85;

      const measureTotal = (sz: number) => {
        tctx.font = `${CONFIG.fontWeight} ${sz * DPR}px ${CONFIG.fontFamily}`;
        const sp = sz * (letterSpacing ?? 0.06);
        let width = 0;
        for (let i = 0; i < text.length; i++) {
          width += tctx.measureText(text[i]).width / DPR;
          if (i < text.length - 1) width += sp;
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
      const midY = (h / 2) * DPR;

      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const cw = tctx.measureText(ch).width / DPR;
        tctx.fillText(ch, (x + cw / 2) * DPR, midY);
        x += cw + spacingPx;
      }
    }

    function sampleTargetsFromTemp(spacing = gap) {
      const img = tctx.getImageData(0, 0, temp.width, temp.height).data;
      const targets: Array<{ x: number; y: number }> = [];
      const step = Math.max(1, Math.floor(spacing * DPR));
      const alphaThreshold = 160;
      for (let y = 0; y < temp.height; y += step) {
        for (let x = 0; x < temp.width; x += step) {
          const idx = (y * temp.width + x) * 4 + 3;
          if (img[idx] > alphaThreshold) {
            targets.push({
              x: x / DPR + (Math.random() - 0.5) * (spacing * 0.6),
              y: y / DPR + (Math.random() - 0.5) * (spacing * 0.6)
            });
          }
        }
      }
      return targets;
    }

    /** 首次构建场景（含首轮 drop） */
    function buildScene(text: string) {
      renderWordToTemp(text);
      const targets = sampleTargetsFromTemp(gap);
      const w = canvas.width / DPR;
      const h = canvas.height / DPR;

      // 初始化粒子
      particles.length = 0;
      const need = targets.length;

      const pushOne = (t: {x:number;y:number}, bornNearTarget: boolean) => {
        const jitter = gap * 1.2;
        const angR = Math.random() * Math.PI * 2;
        const r0   = (CONFIG.funnelRadiusPx ?? 18) * (0.4 + Math.random() * 0.6);

        if (bornNearTarget) {
          particles.push({
            x: t.x + (Math.random() - 0.5) * jitter,
            y: t.y + (Math.random() - 0.5) * jitter,
            vx: 0, vy: 0,
            tx: t.x, ty: t.y,
            d: Math.random() * TRANS_JIT,
            c: glyphs[(Math.random() * glyphs.length) | 0],
            hox: Math.cos(angR), hoy: Math.sin(angR), hrad: r0
          });
        } else {
          const minDim = Math.min(w, h);
          const r = launchRadiusFrac * minDim;
          const ang =
            (launchAngleDeg + (Math.random() - 0.5) * launchSpreadDeg) *
            (Math.PI / 180);
          const spd =
            launchSpeed * (1 + (Math.random() - 0.5) * launchSpeedJitter);
          const originX = w * launchXFrac + (Math.random() - 0.5) * r * 2;
          const originY = h * launchYFrac + (Math.random() - 0.5) * r * 2;

          particles.push({
            x: originX, y: originY,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            tx: t.x, ty: t.y,
            d: Math.random() * TRANS_JIT,
            c: glyphs[(Math.random() * glyphs.length) | 0],
            hox: Math.cos(angR), hoy: Math.sin(angR), hrad: r0
          });
        }
      };

      for (let i = 0; i < need; i++) {
        const t = targets[i];
        pushOne(t, !!skipDrop);
      }

      // 背景字符
      bg = [];
      const cell = Math.max(10, Math.floor(gap * 1.5));
      for (let yy = 0; yy < h; yy += cell) {
        for (let xx = 0; xx < w; xx += cell) {
          if (Math.random() < CONFIG.bgDensity) {
            bg.push({
              x: xx, y: yy,
              c: glyphs[(Math.random() * glyphs.length) | 0],
              t: Math.random() * 1000
            });
          }
        }
      }

      readyRef.current = true;
      setReady(true);
    }

    /** ★ 在位重定向：仅更新目标，不清场、不重建循环 */
    function retargetToWord(newWord: string) {
      if (phase === "exit") return;
      renderWordToTemp(newWord);
      const targets = sampleTargetsFromTemp(gap);
      const need = targets.length;

      // 调整粒子数量
      if (particles.length < need) {
        const jitter = gap * 1.2;
        for (let i = particles.length; i < need; i++) {
          const t = targets[i];
          const angR = Math.random() * Math.PI * 2;
          const r0   = (CONFIG.funnelRadiusPx ?? 18) * (0.4 + Math.random() * 0.6);
          particles.push({
            x: t.x + (Math.random() - 0.5) * jitter,
            y: t.y + (Math.random() - 0.5) * jitter,
            vx: 0, vy: 0, tx: t.x, ty: t.y,
            d: Math.random() * TRANS_JIT,
            c: glyphs[(Math.random() * glyphs.length) | 0],
            hox: Math.cos(angR), hoy: Math.sin(angR), hrad: r0
          });
        }
      } else if (particles.length > need) {
        particles = particles.slice(0, need);
      }

      // 写入新目标 & 刷新错峰与汇聚方向
      for (let i = 0; i < need; i++) {
        particles[i].tx = targets[i].x;
        particles[i].ty = targets[i].y;
        particles[i].d  = Math.random() * TRANS_JIT;

        const angR = Math.random() * Math.PI * 2;
        const r0   = (CONFIG.funnelRadiusPx ?? 18) * (0.4 + Math.random() * 0.6);
        particles[i].hox = Math.cos(angR);
        particles[i].hoy = Math.sin(angR);
        particles[i].hrad = r0;
      }

      // 进入 morph 并重置计时
      phase = "morph";
      wasMorph = false;
      morphElapsedMs = 0;
    }

    // 暴露给外层
    retargetRef.current = retargetToWord;

    function triggerExit() {
      if (phase === "exit") return;
      phase = "exit";
      exitElapsedMs = 0;
      for (const p of particles) {
        const ang = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 5;
        p.vx = Math.cos(ang) * speed * 0.9;
        p.vy = Math.sin(ang) * speed * 0.6 - 2.5;
      }
    }

    exitTriggerRef.current = triggerExit;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width * DPR));
      const h = Math.max(1, Math.floor(rect.height * DPR));
      canvas.width = w; canvas.height = h;
      (ctx as any).setTransform(DPR, 0, 0, DPR, 0, 0);
      buildScene(word);
    }

    function step(ts?: number) {
      if (ts == null || Number.isNaN(ts)) ts = performance.now();
      if (!lastTs) lastTs = ts;
      const dt = ts - lastTs; lastTs = ts;
      const fscale = Math.min(2, Math.max(0.5, dt / 16.6667));
      elapsedMs += dt;

      const w = canvas.width / DPR, h = canvas.height / DPR;

      // 背景
      ctx.fillStyle = CONFIG.colorBg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.font = `600 12px ${CONFIG.fontFamily}`;
      for (const g of bg) {
        g.t += CONFIG.bgSpeed * fscale;
        const flicker = 0.5 + 0.5 * Math.sin(g.t * 0.05);
        (ctx as any).globalAlpha = 0.08 + 0.12 * flicker;
        ctx.fillText(g.c, g.x, g.y);
      }
      (ctx as any).globalAlpha = 1;

      if (!prefersReduced) {
        if (phase !== "exit") {
          // 阶段切换
          const morphT = dropDurationMs + morphDelayMs;
          const newPhase: "drop" | "morph" = skipDrop ? "morph" : (elapsedMs >= morphT ? "morph" : "drop");
          if (newPhase === "morph" && !wasMorph) morphElapsedMs = 0;
          if (newPhase !== "morph")             morphElapsedMs = 0;
          wasMorph = newPhase === "morph";
          phase = newPhase;
        } else {
          exitElapsedMs += dt;
        }

        // 平滑鼠标
        const a = Math.min(0.9, CONFIG.mouseSmooth * fscale);
        smouse.x += (mouse.x - smouse.x) * a;
        smouse.y += (mouse.y - smouse.y) * a;

        for (const p of particles) {
          if (phase === "drop") {
            // ——落地阶段——
            p.vy += gravity * 0.08 * fscale;
            p.x += p.vx * fscale; p.y += p.vy * fscale;

            const groundY = h - 10;
            if (p.y > groundY) {
              p.y = groundY; p.vy *= bounce;
              p.vx = p.vx * groundFriction + (Math.random() - 0.5) * 1.6;
              if (Math.abs(p.vy) < 0.12) p.vy = 0;
            }
            const wall = 8;
            if (p.y >= groundY - 0.5) {
              if (p.x < wall) { p.x = wall; p.vx = -p.vx * 0.7; }
              else if (p.x > w - wall) { p.x = w - wall; p.vx = -p.vx * 0.7; }
            } else if (p.x > w - wall) { p.x = w - wall; p.vx = -p.vx * 0.7; }
          } else if (phase === "morph") {
            // ——两阶段形态过渡——
            morphElapsedMs += dt;

            // 轻微“挤开”
            let pushX = 0, pushY = 0;
            const dxm = p.x - smouse.x, dym = p.y - smouse.y;
            const r = CONFIG.mouseRepelRadius, d = Math.hypot(dxm, dym);
            if (d < r) {
              const dead = CONFIG.dockDeadzone || 0;
              const t = Math.max(0, (d - dead) / Math.max(1e-3, r - dead));
              const fall = 1 - t;
              const base = CONFIG.mouseRepelForce * fall * fall;
              const ux = d > 1e-3 ? dxm / d : 0, uy = d > 1e-3 ? dym / d : 0;
              const maxOff = typeof dockMaxOffset === "number" ? dockMaxOffset : 10;
              const off = Math.min(maxOff, base * 0.8);
              pushX = ux * off; pushY = uy * off;
            }

            // ——阶段性目标：funnel → out——
            const hubX = w * (CONFIG.funnelXFrac ?? 0.5);
            const hubY = h * (CONFIG.funnelYFrac ?? 0.5);
            const split = clamp01(CONFIG.funnelSplit ?? 0.45);
            const tLocal = clamp01((morphElapsedMs - (p.d || 0)) / (CONFIG.transitionMs || 1200));

            let targetX: number, targetY: number;
            if (tLocal < split) {
              const u = easeInOut(tLocal / Math.max(1e-3, split));
              const currR = (p.hrad ?? (CONFIG.funnelRadiusPx ?? 18)) * (1 - u);
              const j = (CONFIG.funnelJitterPx ?? 6) * 0.05;
              targetX = hubX + (p.hox ?? 1) * currR + (Math.random() - 0.5) * j;
              targetY = hubY + (p.hoy ?? 0) * currR + (Math.random() - 0.5) * j;
            } else {
              const v = easeInOut((tLocal - split) / Math.max(1e-3, 1 - split));
              targetX = hubX + (p.tx - hubX) * v;
              targetY = hubY + (p.ty - hubY) * v;
            }

            targetX += pushX; targetY += pushY;

            // 动态跟随强度（温和）
            const baseK = 0.04;
            const gainK = (typeof morphK === "number" ? morphK : 0.14);
            const kNow = baseK + easeInOut(tLocal) * gainK;

            const dx = targetX - p.x, dy = targetY - p.y;
            const tt = 1 - Math.pow(1 - kNow, Math.max(1, dt / 16.67));
            p.x += dx * tt; p.y += dy * tt;

            if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) { p.x = targetX; p.y = targetY; }
          } else {
            // ——退出阶段：向四周喷散 + 淡出——
            p.vy += gravity * 0.04 * fscale;
            p.vx *= 0.985;
            p.vy *= 0.985;
            p.x += p.vx * fscale;
            p.y += p.vy * fscale;
          }
        }
      } else {
        for (const p of particles) {
          if (phase === "exit") {
            p.x += p.vx ?? 0;
            p.y += p.vy ?? 0;
          } else {
            p.x = p.tx; p.y = p.ty;
          }
        }
      }

      // 绘制粒子字符
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = CONFIG.colorFg;
      const minDim = Math.min(canvas.width, canvas.height) / DPR;
      const autoFs = Math.max(8, Math.floor(gap * 1.4));
      const userFs = (typeof glyphSizePx === "number" && glyphSizePx > 0) ? Math.max(6, Math.floor(glyphSizePx)) : autoFs;
      const fs = Math.min(userFs, Math.floor(minDim * 0.06));
      ctx.font = `700 ${fs}px ${CONFIG.fontFamily}`;

      for (const p of particles) {
        // 轻微淡入
        let alpha = 1;
        if (phase === "exit") {
          const fade = 1 - clamp01(exitElapsedMs / 1400);
          alpha = Math.max(0, fade);
        } else if (wasMorph) {
          const tLocal = clamp01((morphElapsedMs - (p.d || 0)) / (CONFIG.transitionMs || 1200));
          alpha = 0.85 + 0.15 * easeInOut(tLocal);
        }
        (ctx as any).globalAlpha = alpha;
        if (outline) { ctx.lineWidth = 1; (ctx as any).strokeStyle = "rgba(0,0,0,0.6)"; ctx.strokeText(p.c, p.x, p.y); }
        ctx.fillText(p.c, p.x, p.y);
      }
      (ctx as any).globalAlpha = 1;

      raf = requestAnimationFrame(step as FrameRequestCallback);
    }

    // 监听尺寸与指针
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    // 初始化
    resize();
    raf = requestAnimationFrame(step as FrameRequestCallback);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
    // 注意：不要把 word 放进依赖，否则切换时会重建动画导致闪烁
  }, [
    gap, letterSpacing,
    gravity, bounce, groundFriction,
    dropDurationMs, morphDelayMs,
    launchXFrac, launchYFrac, launchRadiusFrac,
    launchSpeed, launchSpeedJitter, launchAngleDeg, launchSpreadDeg,
    glyphSizePx, morphK, dockMaxOffset, skipDrop
  ]);

  // ★ 当 word 变化时，触发“在位重定向”，产生两阶段的平滑过渡
  React.useEffect(() => {
    retargetRef.current?.(word);
  }, [word]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {!ready && !readyRef.current && (
        <div className="absolute inset-0 grid place-items-center text-zinc-500 text-sm">Preparing…</div>
      )}
    </div>
  );
});

/** 全屏首页：首轮抛撒→汇聚；随后进入待机轮播（跳过落地，仅两阶段过渡） */
type FullscreenHomeProps = {
  posts: PostSummary[];
};

export default function FullscreenHome({ posts }: FullscreenHomeProps) {
  const [word, setWord] = React.useState(CONFIG.word);
  const [gap, setGap] = React.useState(CONFIG.sampleGap);
  const [morphK, setMorphK] = React.useState<number>(0.14);
  const [dockMaxOffset, setDockMaxOffset] = React.useState<number>(10);
  const [glyphSizePx, setGlyphSizePx] = React.useState<number | undefined>(undefined);

  const particlesRef = React.useRef<WordParticlesHandle | null>(null);
  const [hasEnteredBlog, setHasEnteredBlog] = React.useState(false);
  const [blogVisible, setBlogVisible] = React.useState(false);

  // 轮播控制
  const [skipDrop, setSkipDrop] = React.useState(false);
  const idleIdxRef = React.useRef(0);
  const idleTimerRef = React.useRef<number | undefined>(undefined);
  const idleStartRef = React.useRef<number | undefined>(undefined);
  const enterTimerRef = React.useRef<number | undefined>(undefined);

  // 接收 /tuner 广播
  React.useEffect(() => {
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel("lettercloud-tune");
      const on = (e: MessageEvent) => handleMsg(e.data);
      ch.addEventListener("message", on);
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

    const numKeys = [
      "gravity","bounce","groundFriction",
      "dropDurationMs","morphDelayMs",
      "launchXFrac","launchYFrac","launchRadiusFrac",
      "launchSpeed","launchSpeedJitter",
      "launchAngleDeg","launchSpreadDeg",
      "mouseRepelRadius","mouseRepelForce","mouseSmooth","dockDeadzone",
      "bgDensity","bgSpeed","wordScale","letterSpacing",
      "transitionMs","transitionJitterMs",
      "funnelSplit","funnelXFrac","funnelYFrac","funnelRadiusPx","funnelJitterPx"
    ] as const;
    for (const k of numKeys) if (typeof m[k] === "number") (CONFIG as any)[k] = m[k];

    if (Array.isArray(m.idleTargets)) (CONFIG as any).idleTargets = m.idleTargets;
    if (typeof m.idleStartDelayMs === "number") (CONFIG as any).idleStartDelayMs = m.idleStartDelayMs;
    if (typeof m.idleIntervalMs === "number")   (CONFIG as any).idleIntervalMs = m.idleIntervalMs;

    const strKeys = ["colorFg","colorBg","colorAccent"] as const;
    for (const k of strKeys) if (typeof m[k] === "string") (CONFIG as any)[k] = m[k];
  }

  // 首轮结束后进入待机轮播（只做两阶段过渡）
  React.useEffect(() => {
    if (idleStartRef.current) clearTimeout(idleStartRef.current);
    if (idleTimerRef.current) clearInterval(idleTimerRef.current);

    setSkipDrop(false); // 首轮保留抛撒
    const initialDelay =
      (CONFIG.dropDurationMs ?? 1200) +
      (CONFIG.morphDelayMs ?? 900) +
      (CONFIG.idleStartDelayMs ?? 1200);

    idleStartRef.current = window.setTimeout(() => {
      setSkipDrop(true);
      const list = Array.isArray(CONFIG.idleTargets) ? CONFIG.idleTargets : [];
      if (!list.length) return;
      idleTimerRef.current = window.setInterval(() => {
        idleIdxRef.current = (idleIdxRef.current + 1) % list.length;
        setWord(list[idleIdxRef.current]);
      }, CONFIG.idleIntervalMs ?? 6000) as unknown as number;
    }, initialDelay) as unknown as number;

    return () => {
      if (idleStartRef.current) clearTimeout(idleStartRef.current);
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (!hasEnteredBlog) return;
    if (idleStartRef.current) clearTimeout(idleStartRef.current);
    if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    setWord(CONFIG.word);
    enterTimerRef.current = window.setTimeout(() => {
      setBlogVisible(true);
    }, 700) as unknown as number;
    return () => {
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
    };
  }, [hasEnteredBlog]);

  React.useEffect(() => {
    return () => {
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
    };
  }, []);

  const handleEnterBlog = React.useCallback(() => {
    if (hasEnteredBlog) return;
    setHasEnteredBlog(true);
    particlesRef.current?.triggerExit();
  }, [hasEnteredBlog]);

  const handleHeroKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (hasEnteredBlog) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleEnterBlog();
      }
    },
    [handleEnterBlog, hasEnteredBlog]
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <section
        className={`relative h-[100svh] w-full overflow-hidden transition-all duration-700 ease-out ${
          hasEnteredBlog ? "scale-[0.98] opacity-40 blur-[1.5px]" : ""
        }`}
        onClick={handleEnterBlog}
        onKeyDown={handleHeroKeyDown}
        role="button"
        tabIndex={hasEnteredBlog ? -1 : 0}
        aria-pressed={hasEnteredBlog}
        aria-label={hasEnteredBlog ? undefined : "Enter the Letter Cloud blog"}
        aria-describedby={hasEnteredBlog ? undefined : "enter-instruction"}
      >
        <div className="absolute inset-0">
          <WordParticles
            ref={particlesRef}
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
        <h1 className="sr-only" aria-live="polite">{word}</h1>
        {!hasEnteredBlog && (
          <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center">
            <div
              id="enter-instruction"
              className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold tracking-[0.3em] text-zinc-200 backdrop-blur"
            >
              CLICK TO ENTER
              <span aria-hidden className="animate-pulse text-violet-300">⟶</span>
            </div>
          </div>
        )}
      </section>
      <BlogMain visible={blogVisible} posts={posts} />
    </div>
  );
}
