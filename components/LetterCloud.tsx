"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { BlogMain } from "@/components/BlogMain";
import type { PostSummary } from "@/lib/posts";

/** 全局参数（本地 /tuner 可通过 BroadcastChannel 覆盖其中多数） */
const CONFIG = {
  word: "Lighthouse",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
  fontWeight: 800,

  // 版面与取样
  wordScale: 0.60,       // 词形占 min(width,height) 的比例（用于取样目标点）
  sampleGap: 7.5,          // 取样间距（越小点越多）
  letterSpacing: 0.06,   // 字间距（按字号比例）

  // 交互（类 dock）
  mouseRepelRadius: 90,
  mouseRepelForce: 9,
  mouseSmooth: 0.18,
  dockDeadzone: 18,

  // 颜色与字符
  colorFg: "#e5e7eb",
  colorAccent: "#a78bfa",
  bgGlyphs: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+-=<>?@",

  // 首轮：抛撒→落地→汇聚
  dropDurationMs: 1800,
  morphDelayMs: 1600,
  gravity: 2.8,
  bounce: -0.28,
  groundFriction: 0.7,
  launchXFrac: -0.08,
  launchYFrac: -0.22,
  launchRadiusFrac: 0.2,
  launchSpeed: 12.0,
  launchSpeedJitter: 0.40,
  launchAngleDeg: 60,
  launchSpreadDeg: 24,

  // 两形态之间的总体过渡
  transitionMs: 1200,
  transitionJitterMs: 180,

  funnelSplit: 0.45,       // 第一阶段所占比例（0..1）
  funnelXFrac: 0.50,       // 汇聚点 X（相对宽度 0..1）
  funnelYFrac: 0.52,       // 汇聚点 Y（相对高度 0..1）
  funnelRadiusPx: 18,      // 汇聚束初始半径
  funnelJitterPx: 6,       // 汇聚时的轻微抖散

  // 待机循环
  idleWords: ["Lighthouse", "Halo","⌘Q","Storm"],
  idleHoldMs: 4200,
  idleScatterMs: 1800,
  idleGatherDelayMs: 520,
  idleGustStrength: 6.2,
  idleGustJitter: 1.8,
  idleAmbientDrift: 0.24,
  idleScatterSpeedFloor: 0.7,
  idleScatterSpeedRange: 0.72,
  idleScatterSpeedLimit: 1.4,
  idleScatterVelocityApproach: 0.36,
  idleGatherTransitionMs: 2600
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
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

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
  idleWords?: string[];
  idleHoldMs?: number;
  idleScatterMs?: number;
  idleGatherDelayMs?: number;
  idleGustStrength?: number;
  idleGustJitter?: number;
  idleAmbientDrift?: number;
  idleScatterSpeedFloor?: number;
  idleScatterSpeedRange?: number;
  idleScatterSpeedLimit?: number;
  idleScatterVelocityApproach?: number;
  idleGatherTransitionMs?: number;
  onWordChange?: (word: string) => void;
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
    idleWords: idleWordsProp,
    idleHoldMs: idleHoldMsProp,
    idleScatterMs: idleScatterMsProp,
    idleGatherDelayMs: idleGatherDelayMsProp,
    idleGustStrength: idleGustStrengthProp,
    idleGustJitter: idleGustJitterProp,
    idleAmbientDrift: idleAmbientDriftProp,
    idleScatterSpeedFloor: idleScatterSpeedFloorProp,
    idleScatterSpeedRange: idleScatterSpeedRangeProp,
    idleScatterSpeedLimit: idleScatterSpeedLimitProp,
    idleScatterVelocityApproach: idleScatterVelocityApproachProp,
    idleGatherTransitionMs: idleGatherTransitionMsProp,
    onWordChange
  } = props;

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const tempRef = React.useRef<HTMLCanvasElement | null>(null);
  const readyRef = React.useRef(false);
  const [ready, setReady] = React.useState(false);
  const prefersReduced = usePrefersReducedMotion();
  const glyphs = React.useMemo(() => CONFIG.bgGlyphs.split(""), []);
  const idleWords = React.useMemo(
    () => (idleWordsProp && idleWordsProp.length > 0 ? idleWordsProp : CONFIG.idleWords || []),
    [idleWordsProp]
  );
  const idleHold = idleHoldMsProp ?? CONFIG.idleHoldMs ?? 2800;
  const idleScatter = idleScatterMsProp ?? CONFIG.idleScatterMs ?? 1400;
  const idleGatherDelay = idleGatherDelayMsProp ?? CONFIG.idleGatherDelayMs ?? 520;
  const idleGustStrength = idleGustStrengthProp ?? CONFIG.idleGustStrength ?? 8.4;
  const idleGustJitter = idleGustJitterProp ?? CONFIG.idleGustJitter ?? 2.6;
  const idleAmbientDrift = idleAmbientDriftProp ?? CONFIG.idleAmbientDrift ?? 0.16;
  const idleScatterSpeedFloor =
    idleScatterSpeedFloorProp ?? CONFIG.idleScatterSpeedFloor ?? 0.38;
  const idleScatterSpeedRange =
    idleScatterSpeedRangeProp ?? CONFIG.idleScatterSpeedRange ?? 0.5;
  const idleScatterSpeedLimit =
    idleScatterSpeedLimitProp ?? CONFIG.idleScatterSpeedLimit ?? 1.22;
  const idleScatterVelocityApproach =
    idleScatterVelocityApproachProp ?? CONFIG.idleScatterVelocityApproach ?? 0.24;
  const idleGatherTransitionMs =
    idleGatherTransitionMsProp ?? CONFIG.idleGatherTransitionMs ?? (CONFIG.transitionMs ?? 1200) * 1.35;

  const onWordChangeRef = React.useRef(onWordChange);
  React.useEffect(() => {
    onWordChangeRef.current = onWordChange;
  }, [onWordChange]);

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
      gx?: number; gy?: number;   // 本轮汇聚起始位置
      introGather?: boolean;
      svx?: number; svy?: number; // 待机散开初始速度
    };
    let particles: P[] = [];
    let baseParticleCount = 0;

    type WordCacheEntry = {
      canvasW: number;
      canvasH: number;
      gap: number;
      letterSpacing: number;
      count: number;
      targets: Array<{ x: number; y: number }>;
    };
    const wordCache = new Map<string, WordCacheEntry>();
    type LayoutMeta = {
      size: number;
      width: number;
      spacingPx: number;
      glyphWidths: number[];
    };
    let baselineArea = 0;
    let baselineWordLength = 0;

    type Phase = "drop" | "morph" | "idleScatter" | "exit";
    let phase: Phase = "drop";
    let wasMorph = false;
    let morphElapsedMs = 0;
    let exitElapsedMs = 0;

    let animElapsedMs = 0;
    let timelineElapsedMs = 0;
    let lastTs = 0;

    let currentWord = word;
    type IdleState = "inactive" | "waiting" | "gust" | "awaitGather" | "gathering";
    let idleState: IdleState = "inactive";
    let idleHoldElapsed = 0;
    let idleScatterElapsed = 0;
    let idleGatherDelayLeft = 0;
    let introSettled = false;
    let idleWordIndex = idleWords.indexOf(currentWord);
    if (idleWordIndex < 0) idleWordIndex = 0;

    const mouse = { x: -9999, y: -9999 };
    const smouse = { x: -9999, y: -9999 };

    const baseTransitionMs = CONFIG.transitionMs ?? 1200;
    const baseTransitionJitter = CONFIG.transitionJitterMs ?? 0;
    let activeTransitionMs = baseTransitionMs;
    let activeTransitionJitter = baseTransitionJitter;
    let gatherCompleteMs = activeTransitionMs + activeTransitionJitter + 260;
    const updateGatherTiming = () => {
      gatherCompleteMs = activeTransitionMs + activeTransitionJitter + 260;
    };

    const canIdleCycle = () => idleWords.length > 1 && phase !== "exit" && !prefersReduced;

    const markGatherStart = (isIntro: boolean) => {
      for (const p of particles) {
        p.gx = p.x;
        p.gy = p.y;
        p.introGather = isIntro;
      }
    };

    function syncIdleIndex(next: string) {
      const idx = idleWords.indexOf(next);
      if (idx >= 0) idleWordIndex = idx;
    }

    function startIdleHold() {
      if (!canIdleCycle()) {
        idleState = "inactive";
        return;
      }
      idleState = "waiting";
      idleHoldElapsed = 0;
    }

    function startIdleScatter() {
      if (!canIdleCycle()) return;
      idleState = "gust";
      idleScatterElapsed = 0;
      phase = "idleScatter";
      wasMorph = false;
      morphElapsedMs = 0;
      for (const p of particles) {
        const baseSpd = idleGustStrength * (idleScatterSpeedFloor + Math.random() * idleScatterSpeedRange);
        const theta = Math.random() * Math.PI * 2;
        const gust = {
          x: Math.cos(theta) * baseSpd,
          y: Math.sin(theta) * baseSpd
        };
        const jitterX = (Math.random() - 0.5) * idleGustJitter;
        const jitterY = (Math.random() - 0.5) * idleGustJitter * 0.6;
        p.vx = gust.x + jitterX;
        p.vy = gust.y + jitterY;
        const maxScatterSpeed = idleGustStrength * idleScatterSpeedLimit;
        const vMag = Math.hypot(p.vx, p.vy);
        if (vMag > maxScatterSpeed) {
          const scale = maxScatterSpeed / vMag;
          p.vx *= scale;
          p.vy *= scale;
        }
        p.svx = p.vx;
        p.svy = p.vy;
      }
    }

    function scheduleIdleGather() {
      if (!canIdleCycle()) {
        idleState = "inactive";
        return;
      }
      idleState = "awaitGather";
      idleGatherDelayLeft = idleGatherDelay;
    }

    function beginIdleGather() {
      if (!canIdleCycle()) {
        idleState = "inactive";
        return;
      }
      if (idleWords.length === 0) {
        idleState = "inactive";
        return;
      }
      idleState = "gathering";
      idleScatterElapsed = 0;
      idleHoldElapsed = 0;
      idleGatherDelayLeft = 0;
      idleWordIndex = (idleWordIndex + 1) % idleWords.length;
      const nextWord = idleWords[idleWordIndex];
      retargetToWord(nextWord);
    }

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

      const minSize = 12;
      const maxHeight = Math.max(minSize, h * 0.9);
      const targetW = w * 0.85;
      const baseSize = Math.floor(Math.min(w, h) * CONFIG.wordScale);

      const measureWord = (sz: number) => {
        const glyphWidths: number[] = new Array(text.length);
        tctx.font = `${CONFIG.fontWeight} ${sz * DPR}px ${CONFIG.fontFamily}`;
        const spacingPx = sz * (letterSpacing ?? 0.06);
        let width = 0;
        for (let i = 0; i < text.length; i++) {
          const wGlyph = tctx.measureText(text[i]).width / DPR;
          glyphWidths[i] = wGlyph;
          width += wGlyph;
          if (i < text.length - 1) width += spacingPx;
        }
        return { width, spacingPx, glyphWidths };
      };

      const clampSize = (sz: number) => Math.max(minSize, Math.min(maxHeight, sz));
      const needsBaseline = baselineArea <= 0 || text.length > baselineWordLength;

      let layout: LayoutMeta;

      if (needsBaseline) {
        let size = clampSize(baseSize);
        let metrics = measureWord(size);
        if (metrics.width > targetW) {
          const scale = targetW / Math.max(metrics.width, 1e-3);
          size = clampSize(size * scale);
          metrics = measureWord(size);
        }
        if (size > maxHeight) {
          size = maxHeight;
          metrics = measureWord(size);
        }
        layout = {
          size,
          width: metrics.width,
          spacingPx: metrics.spacingPx,
          glyphWidths: metrics.glyphWidths
        };
        baselineArea = metrics.width * size;
        baselineWordLength = text.length;
      } else {
        let size = clampSize(Math.sqrt(baselineArea / Math.max(text.length, 1)));
        let metrics = measureWord(size);
        for (let iter = 0; iter < 6; iter++) {
          const width = metrics.width;
          const area = width * size;
          let adjusted = false;
          if (width > targetW) {
            const scale = targetW / Math.max(width, 1e-3);
            size = clampSize(size * scale);
            metrics = measureWord(size);
            adjusted = true;
          }
          if (size > maxHeight) {
            size = maxHeight;
            metrics = measureWord(size);
            adjusted = true;
          }
          if (adjusted) {
            continue;
          }
          if (baselineArea > 0) {
            const ratio = Math.sqrt(baselineArea / Math.max(area, 1));
            if (Math.abs(ratio - 1) < 0.01) {
              break;
            }
            size = clampSize(size * Math.max(0.75, Math.min(1.25, ratio)));
            metrics = measureWord(size);
          } else {
            break;
          }
        }
        layout = {
          size,
          width: metrics.width,
          spacingPx: metrics.spacingPx,
          glyphWidths: metrics.glyphWidths
        };
      }

      tctx.setTransform(1, 0, 0, 1, 0, 0);
      tctx.clearRect(0, 0, temp.width, temp.height);
      tctx.fillStyle = "white";
      tctx.textAlign = "center";
      tctx.textBaseline = "middle";
      tctx.font = `${CONFIG.fontWeight} ${layout.size * DPR}px ${CONFIG.fontFamily}`;

      let x = (w - layout.width) / 2;
      const midY = (h / 2) * DPR;
      for (let i = 0; i < text.length; i++) {
        const cw = layout.glyphWidths[i] ?? 0;
        tctx.fillText(text[i], (x + cw / 2) * DPR, midY);
        x += cw + layout.spacingPx;
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

    function collectTargets(desiredCount?: number) {
      let spacing = gap;
      let targets = sampleTargetsFromTemp(spacing);
      if (!desiredCount || desiredCount <= 0 || targets.length >= desiredCount) {
        return targets;
      }

      const minSpacing = Math.max(1.0, gap * 0.3);
      let attempt = 0;
      while (attempt < 4 && targets.length < desiredCount && spacing > minSpacing) {
        spacing = Math.max(minSpacing, spacing * 0.86);
        const candidate = sampleTargetsFromTemp(spacing);
        if (candidate.length > targets.length) {
          targets = candidate;
        }
        attempt++;
      }

      return targets;
    }

    function prepareTargets(text: string, desiredCount?: number) {
      const cached = wordCache.get(text);
      const matches =
        cached &&
        cached.canvasW === canvas.width &&
        cached.canvasH === canvas.height &&
        Math.abs(cached.gap - gap) < 1e-6 &&
        Math.abs(cached.letterSpacing - letterSpacing) < 1e-6 &&
        (!desiredCount || cached.count >= desiredCount);
      if (matches) {
        return cached.targets;
      }

      renderWordToTemp(text);
      const targets = collectTargets(desiredCount);
      wordCache.set(text, {
        canvasW: canvas.width,
        canvasH: canvas.height,
        gap,
        letterSpacing,
        count: targets.length,
        targets
      });
      return targets;
    }

    function remapTargets(
      source: Array<{ x: number; y: number }>,
      desiredCount: number
    ) {
      if (desiredCount <= 0) {
        return [];
      }
      if (source.length === 0) {
        const fallback: Array<{ x: number; y: number }> = [];
        const cx = canvas.width / (DPR * 2);
        const cy = canvas.height / (DPR * 2);
        for (let i = 0; i < desiredCount; i++) {
          const ang = (i / Math.max(1, desiredCount)) * Math.PI * 2;
          const rad = (CONFIG.funnelRadiusPx ?? 18) * 0.6;
          fallback.push({
            x: cx + Math.cos(ang) * rad,
            y: cy + Math.sin(ang) * rad
          });
        }
        return fallback;
      }
      if (source.length === desiredCount) {
        return source;
      }

      const remapped: Array<{ x: number; y: number }> = [];
      if (source.length > desiredCount) {
        const chosen: number[] = [];
        const used = new Uint8Array(source.length);
        const minDistSq = new Float64Array(source.length);
        const { width: canvasW, height: canvasH } = canvas;
        const cx = canvasW / (DPR * 2);
        const cy = canvasH / (DPR * 2);

        let firstIdx = 0;
        let bestToCenter = Number.POSITIVE_INFINITY;
        for (let i = 0; i < source.length; i++) {
          const dx = source[i].x - cx;
          const dy = source[i].y - cy;
          const distSq = dx * dx + dy * dy;
          if (distSq < bestToCenter) {
            bestToCenter = distSq;
            firstIdx = i;
          }
          minDistSq[i] = Number.POSITIVE_INFINITY;
        }

        chosen.push(firstIdx);
        used[firstIdx] = 1;

        function updateMinDistances(newIdx: number) {
          const pick = source[newIdx];
          for (let i = 0; i < source.length; i++) {
            if (used[i]) continue;
            const dx = source[i].x - pick.x;
            const dy = source[i].y - pick.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < minDistSq[i]) {
              minDistSq[i] = distSq;
            }
          }
        }

        updateMinDistances(firstIdx);

        while (chosen.length < desiredCount) {
          let nextIdx = -1;
          let farthest = -1;
          for (let i = 0; i < source.length; i++) {
            if (used[i]) continue;
            const distSq = minDistSq[i];
            if (distSq > farthest) {
              farthest = distSq;
              nextIdx = i;
            }
          }
          if (nextIdx === -1) {
            break;
          }
          chosen.push(nextIdx);
          used[nextIdx] = 1;
          updateMinDistances(nextIdx);
        }

        for (let i = 0; i < chosen.length && remapped.length < desiredCount; i++) {
          remapped.push({ x: source[chosen[i]].x, y: source[chosen[i]].y });
        }

        if (remapped.length < desiredCount) {
          // fallback to random picks to fill any missing spots (should be rare)
          while (remapped.length < desiredCount) {
            const idx = Math.floor(Math.random() * source.length);
            remapped.push({ x: source[idx].x, y: source[idx].y });
          }
        }
        return remapped;
      }

      const repeats = Math.floor(desiredCount / source.length);
      const remainder = desiredCount % source.length;
      for (let r = 0; r < repeats; r++) {
        for (let i = 0; i < source.length; i++) {
          const base = source[i];
          remapped.push({
            x: base.x + (Math.random() - 0.5) * gap * 0.35,
            y: base.y + (Math.random() - 0.5) * gap * 0.35
          });
        }
      }
      if (remainder > 0) {
        const step = source.length / remainder;
        let cursor = 0;
        for (let i = 0; i < remainder; i++, cursor += step) {
          const idx = Math.min(source.length - 1, Math.floor(cursor));
          const base = source[idx];
          remapped.push({
            x: base.x + (Math.random() - 0.5) * gap * 0.35,
            y: base.y + (Math.random() - 0.5) * gap * 0.35
          });
        }
      }
      return remapped.slice(0, desiredCount);
    }

    /** 首次构建场景（含首轮 drop） */
    function buildScene(text: string) {
      currentWord = text;
      syncIdleIndex(text);
      introSettled = false;
      idleState = "inactive";
      idleHoldElapsed = 0;
      idleScatterElapsed = 0;
      idleGatherDelayLeft = 0;
      const targets = prepareTargets(text);
      const w = canvas.width / DPR;
      const h = canvas.height / DPR;

      // 初始化粒子
      particles.length = 0;
      const need = targets.length;

      const pushOne = (t: {x:number;y:number}) => {
        const jitter = gap * 1.2;
        const angR = Math.random() * Math.PI * 2;
        const r0   = (CONFIG.funnelRadiusPx ?? 18) * (0.4 + Math.random() * 0.6);

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
          d: Math.random() * activeTransitionJitter,
          c: glyphs[(Math.random() * glyphs.length) | 0],
          hox: Math.cos(angR), hoy: Math.sin(angR), hrad: r0
        });
      };

      for (let i = 0; i < need; i++) {
        const t = targets[i];
        pushOne(t);
      }

      baseParticleCount = particles.length;
      // 让首轮汇聚使用与待机循环一致的时长/力度，确保投掷后的落点动画与待机阶段风格统一
      activeTransitionMs = idleGatherTransitionMs;
      activeTransitionJitter = baseTransitionJitter;
      updateGatherTiming();
      readyRef.current = true;
      setReady(true);
    }

    /** ★ 在位重定向：仅更新目标，不清场、不重建循环 */
    function retargetToWord(newWord: string) {
      if (phase === "exit") return;
      if (!newWord) return;
      const sameWord = newWord === currentWord;
      if (sameWord && phase !== "idleScatter") {
        return;
      }
      const wasIdleCycle =
        idleState === "gathering" || idleState === "gust" || idleState === "awaitGather";

      if (!sameWord) {
        currentWord = newWord;
        syncIdleIndex(newWord);
        onWordChangeRef.current?.(newWord);
      } else {
        syncIdleIndex(newWord);
      }

      const desiredCount =
        particles.length > 0
          ? particles.length
          : baseParticleCount > 0
          ? baseParticleCount
          : undefined;
      const targets = prepareTargets(newWord, desiredCount);
      const currentCount = desiredCount ?? targets.length;
      const mappedTargets = remapTargets(targets, currentCount);

      if (wasIdleCycle) {
        activeTransitionMs = idleGatherTransitionMs;
        activeTransitionJitter = baseTransitionJitter;
        updateGatherTiming();
      } else {
        activeTransitionMs = baseTransitionMs;
        activeTransitionJitter = baseTransitionJitter;
        updateGatherTiming();
      }

      // 写入新目标 & 刷新错峰与汇聚方向
      const count = Math.min(particles.length, mappedTargets.length);
      for (let i = 0; i < count; i++) {
        const target = mappedTargets[i];
        particles[i].tx = target.x;
        particles[i].ty = target.y;
        particles[i].d  = Math.random() * activeTransitionJitter;

        const angR = Math.random() * Math.PI * 2;
        const r0   = (CONFIG.funnelRadiusPx ?? 18) * (0.4 + Math.random() * 0.6);
        particles[i].hox = Math.cos(angR);
        particles[i].hoy = Math.sin(angR);
        particles[i].hrad = r0;
      }

      if (particles.length > count) {
        for (let i = count; i < particles.length; i++) {
          const angR = Math.random() * Math.PI * 2;
          const r0   = (CONFIG.funnelRadiusPx ?? 18) * (0.4 + Math.random() * 0.6);
          particles[i].tx = canvas.width / (DPR * 2);
          particles[i].ty = canvas.height / (DPR * 2);
          particles[i].d = Math.random() * activeTransitionJitter;
          particles[i].hox = Math.cos(angR);
          particles[i].hoy = Math.sin(angR);
          particles[i].hrad = r0;
        }
      }

      markGatherStart(false);

      // 进入 morph 并重置计时
      if (idleState === "gust" || idleState === "awaitGather") {
        idleState = "gathering";
      }
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
      idleState = "inactive";
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
      wordCache.clear();
      baselineArea = 0;
      baselineWordLength = 0;
      activeTransitionMs = baseTransitionMs;
      activeTransitionJitter = baseTransitionJitter;
      updateGatherTiming();
      buildScene(word);
    }

    function step(ts?: number) {
      if (ts == null || Number.isNaN(ts)) ts = performance.now();
      if (!lastTs) lastTs = ts;
      const rawDt = Math.max(0, ts - lastTs);
      lastTs = ts;
      const dropDt = Math.min(rawDt, 100);
      const fastDt = Math.min(rawDt * 1.25, 100);
      const dropFactor = dropDt / (1000 / 60);
      const fastFactor = fastDt / (1000 / 60);
      timelineElapsedMs += rawDt;

      const w = canvas.width / DPR, h = canvas.height / DPR;

      // 清除上一帧，保留透明背景
      ctx.clearRect(0, 0, w, h);
      (ctx as any).globalAlpha = 1;

      if (!prefersReduced) {
        const prevPhase = phase;
        if (phase !== "exit" && phase !== "idleScatter") {
          const morphT = dropDurationMs + morphDelayMs;
          const newPhase: Phase = timelineElapsedMs >= morphT ? "morph" : "drop";
          if (newPhase === "morph" && !wasMorph) morphElapsedMs = 0;
          if (newPhase !== "morph") morphElapsedMs = 0;
          wasMorph = newPhase === "morph";
          phase = newPhase;
          if (phase === "morph" && prevPhase !== "morph") {
            markGatherStart(!introSettled && idleState === "inactive");
          }
        } else if (phase === "exit") {
          exitElapsedMs += fastDt;
          wasMorph = false;
        } else {
          wasMorph = false;
        }

        const phaseNow = phase;
        const useFastClock = phaseNow !== "drop" && phaseNow !== "idleScatter";
        const phaseDt = useFastClock ? fastDt : dropDt;
        const dtFactor = useFastClock ? fastFactor : dropFactor;
        animElapsedMs += phaseDt;

        const a = Math.min(0.9, (CONFIG.mouseSmooth ?? 0) * dtFactor);
        smouse.x += (mouse.x - smouse.x) * a;
        smouse.y += (mouse.y - smouse.y) * a;

        for (const p of particles) {
          if (phaseNow === "drop") {
            p.vy += gravity * 0.08 * dtFactor;
            p.x += p.vx * dtFactor; p.y += p.vy * dtFactor;

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
          } else if (phaseNow === "morph") {
            morphElapsedMs += fastDt;

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

            const hubX = w * (CONFIG.funnelXFrac ?? 0.5);
            const hubY = h * (CONFIG.funnelYFrac ?? 0.5);
            const split = clamp01(CONFIG.funnelSplit ?? 0.45);
            const tLocal = clamp01((morphElapsedMs - (p.d || 0)) / Math.max(1, activeTransitionMs));

            let targetX: number, targetY: number;
            const startX = p.gx ?? p.x;
            const startY = p.gy ?? p.y;
            const isIntroGather = !!p.introGather && !introSettled;

            if (isIntroGather) {
              const liftDenom = Math.max(1e-3, split);
              const liftT = easeInOut(Math.min(1, tLocal / liftDenom));
              const lateralBase = clamp01((tLocal - split * 0.55) / Math.max(1e-3, 1 - split * 0.55));
              const lateralT = easeInOut(lateralBase);
              targetX = startX + (p.tx - startX) * lateralT;
              targetY = startY + (p.ty - startY) * liftT;
            } else if (tLocal < split) {
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

            const stiffnessScale = Math.max(
              0.22,
              Math.min(2.4, (baseTransitionMs || 1200) / Math.max(1, activeTransitionMs))
            );
            const baseK = 0.04 * stiffnessScale;
            const gainBase = typeof morphK === "number" ? morphK : 0.14;
            const gainK = gainBase * stiffnessScale;
            const kNow = baseK + easeInOut(tLocal) * gainK;

            const dx = targetX - p.x, dy = targetY - p.y;
            const tt = 1 - Math.pow(1 - kNow, Math.max(0, dtFactor));
            p.x += dx * tt; p.y += dy * tt;

            if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) { p.x = targetX; p.y = targetY; }
          } else if (phaseNow === "idleScatter") {
            const scatterDuration = Math.max(1, idleScatter);
            const scatterProgress = clamp01(idleScatterElapsed / scatterDuration);
            const speedMultiplier = 1 - easeOutCubic(scatterProgress);
            const approach = 1 - Math.pow(1 - idleScatterVelocityApproach, Math.max(0, dtFactor));
            const swirlA = Math.sin((animElapsedMs + p.tx * 7 + p.ty * 5) * 0.003) * 0.28;
            const swirlB = Math.cos((animElapsedMs * 0.0018 + p.ty * 9 - p.tx * 6) * 0.004) * 0.22;
            const jitterX = Math.sin((animElapsedMs + p.ty * 13) * 0.0023) * idleAmbientDrift * 0.12;
            const jitterY = Math.cos((animElapsedMs * 0.0026 + p.tx * 17) * 0.0021) * idleAmbientDrift * 0.12;

            const targetVx = (p.svx ?? p.vx) * speedMultiplier;
            const targetVy = (p.svy ?? p.vy) * speedMultiplier;
            p.vx += (targetVx - p.vx) * approach;
            p.vy += (targetVy - p.vy) * approach;

            const swirlStrength = speedMultiplier;
            p.vx += ((swirlA * 0.06) + (swirlB * 0.11) + jitterX) * dtFactor * swirlStrength;
            p.vy += ((swirlB * 0.07) - (swirlA * 0.05) + jitterY) * dtFactor * swirlStrength;

            p.x += p.vx * dtFactor;
            p.y += p.vy * dtFactor;
            const margin = Math.max(18, gap * 2.2);
            if (p.x < -margin) { p.x = -margin; p.vx *= -0.42; p.svx = p.vx; }
            else if (p.x > w + margin) { p.x = w + margin; p.vx *= -0.42; p.svx = p.vx; }
            if (p.y < -margin) { p.y = -margin; p.vy *= -0.36; p.svy = p.vy; }
            else if (p.y > h + margin) { p.y = h + margin; p.vy *= -0.48; p.svy = p.vy; }
          } else {
            const idleDecay = Math.pow(0.985, dtFactor);
            p.vx *= idleDecay;
            p.vy *= idleDecay;
            p.x += p.vx * dtFactor;
            p.y += p.vy * dtFactor;
          }
        }

        if (canIdleCycle()) {
          if (!introSettled && phase === "morph" && morphElapsedMs > gatherCompleteMs) {
            introSettled = true;
            if (idleState === "inactive") startIdleHold();
          }

          if (idleState === "waiting") {
            idleHoldElapsed += useFastClock ? fastDt : dropDt;
            if (idleHoldElapsed >= idleHold) {
              startIdleScatter();
            }
          } else if (idleState === "gust") {
            idleScatterElapsed += dropDt;
            if (idleScatterElapsed >= idleScatter) {
              scheduleIdleGather();
            }
          } else if (idleState === "awaitGather") {
            idleGatherDelayLeft -= dropDt;
            if (idleGatherDelayLeft <= 0) {
              beginIdleGather();
            }
          } else if (idleState === "gathering") {
            if (phase === "morph" && morphElapsedMs > gatherCompleteMs) {
              idleState = "waiting";
              idleHoldElapsed = 0;
            }
          } else if (idleState === "inactive" && introSettled && phase === "morph" && morphElapsedMs > gatherCompleteMs) {
            startIdleHold();
          }
        } else if (idleState !== "inactive" && phase !== "exit") {
          idleState = "inactive";
          if (phase === "idleScatter") {
            retargetToWord(currentWord);
          }
        }
      } else {
        if (idleState !== "inactive" && phase !== "exit") {
          idleState = "inactive";
          if (phase === "idleScatter") {
            retargetToWord(currentWord);
          }
        }
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
        } else if (phase === "idleScatter") {
          const gustFade = 1 - clamp01(idleScatterElapsed / Math.max(1, idleScatter));
          alpha = 0.6 + 0.4 * gustFade;
        } else if (phase === "morph") {
          const tLocal = clamp01((morphElapsedMs - (p.d || 0)) / Math.max(1, activeTransitionMs));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gap, letterSpacing,
    gravity, bounce, groundFriction,
    dropDurationMs, morphDelayMs,
    launchXFrac, launchYFrac, launchRadiusFrac,
    launchSpeed, launchSpeedJitter, launchAngleDeg, launchSpreadDeg,
    glyphSizePx, morphK, dockMaxOffset,
    idleWords, idleHold, idleScatter, idleGatherDelay,
    idleGustStrength, idleGustJitter, idleAmbientDrift, idleGatherTransitionMs
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

/** 全屏首页：首轮抛撒→汇聚 */
type FullscreenHomeProps = {
  posts: PostSummary[];
  initialBlogView?: boolean;
};

export default function FullscreenHome({ posts, initialBlogView = false }: FullscreenHomeProps) {
  const prefersReducedGlobal = usePrefersReducedMotion();
  const [word, setWord] = React.useState(CONFIG.word);
  const [gap, setGap] = React.useState(CONFIG.sampleGap);
  const [letterSpacing, setLetterSpacing] = React.useState(CONFIG.letterSpacing);
  const [morphK, setMorphK] = React.useState<number>(0.14);
  const [dockMaxOffset, setDockMaxOffset] = React.useState<number>(10);
  const [glyphSizePx, setGlyphSizePx] = React.useState<number | undefined>(undefined);
  const [isMobile, setIsMobile] = React.useState(false);

  const particlesRef = React.useRef<WordParticlesHandle | null>(null);
  const [hasEnteredBlog, setHasEnteredBlog] = React.useState(initialBlogView);
  const [blogVisible, setBlogVisible] = React.useState(initialBlogView);
  const [heroRetired, setHeroRetired] = React.useState(initialBlogView);
  const initialBlogRef = React.useRef(initialBlogView);

  const animationEnabled = !prefersReducedGlobal && !isMobile;

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const coarseMq = window.matchMedia("(hover: none) and (pointer: coarse)");
    const compute = () => {
      const coarse = typeof coarseMq.matches === "boolean" ? coarseMq.matches : false;
      return coarse || window.innerWidth <= 768;
    };
    const update = () => setIsMobile(compute());
    update();
    window.addEventListener("resize", update);
    const handleChange = () => update();
    coarseMq.addEventListener?.("change", handleChange);
    if (!coarseMq.addEventListener && coarseMq.addListener) {
      coarseMq.addListener(handleChange);
    }
    return () => {
      window.removeEventListener("resize", update);
      coarseMq.removeEventListener?.("change", handleChange);
      if (!coarseMq.removeEventListener && coarseMq.removeListener) {
        coarseMq.removeListener(handleChange);
      }
    };
  }, []);

  React.useEffect(() => {
    if (isMobile) {
      setGap(5.0);
      setLetterSpacing(0.04);
      setGlyphSizePx(8);
    } else {
      setGap(CONFIG.sampleGap);
      setLetterSpacing(CONFIG.letterSpacing);
      setGlyphSizePx(undefined);
    }
  }, [isMobile]);

  const router = useRouter();

  // 进入博客过渡控制
  const enterTimerRef = React.useRef<number | undefined>(undefined);



  React.useEffect(() => {
    if (!hasEnteredBlog) return;
    setWord(CONFIG.word);

    if (initialBlogRef.current) {
      initialBlogRef.current = false;
      setBlogVisible(true);
      setHeroRetired(true);
      return;
    }

    enterTimerRef.current = window.setTimeout(() => {
      setBlogVisible(true);
      setHeroRetired(true);
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
    if (hasEnteredBlog || !animationEnabled) return;
    router.replace("?view=blog", { scroll: false });
    setHasEnteredBlog(true);
    particlesRef.current?.triggerExit();
  }, [animationEnabled, hasEnteredBlog, router]);

  React.useEffect(() => {
    if (!animationEnabled) {
      setHasEnteredBlog(true);
      setBlogVisible(true);
      setHeroRetired(true);
    }
  }, [animationEnabled]);

  const showHero = animationEnabled && !heroRetired;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      {showHero && (
        <section
          className={`relative h-[100svh] w-full overflow-hidden transition-all duration-700 ease-out ${
            hasEnteredBlog ? "scale-[0.98] opacity-40 blur-[1.5px]" : ""
          }`}
        >
          <div className="absolute inset-0">
            <WordParticles
              ref={particlesRef}
              word={word}
              gap={gap}
              letterSpacing={letterSpacing}
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
              onWordChange={setWord}
            />
          </div>
          <h1 className="sr-only" aria-live="polite">{word}</h1>
          {!hasEnteredBlog && (
            <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center">
              <button
                type="button"
                onClick={handleEnterBlog}
                className="pointer-events-auto group flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold tracking-[0.3em] text-zinc-200 backdrop-blur shadow-[0_30px_80px_-45px_rgba(167,139,250,0.55)] transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:border-violet-400/60 hover:shadow-[0_45px_120px_-50px_rgba(167,139,250,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                CLICK TO ENTER
                <span aria-hidden className="animate-pulse text-violet-300 transition-transform duration-300 group-hover:translate-x-1">⟶</span>
              </button>
            </div>
          )}
        </section>
      )}
      <BlogMain visible={animationEnabled ? blogVisible : true} posts={posts} />
    </div>
  );
}
