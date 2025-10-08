"use client";
import { useEffect, useRef, useState } from "react";

/** Message schema sent to the homepage via BroadcastChannel + storage */
type Msg = Partial<{
  // Copy & sampling
  word: string;
  sampleGap: number;
  letterSpacing: number;
  glyphSizePx: number;     // ★ particle font size in px
  wordScale: number;

  // Physics
  gravity: number;
  bounce: number;
  groundFriction: number;

  // Timers
  dropDurationMs: number;
  morphDelayMs: number;

  // Launch
  launchXFrac: number; launchYFrac: number; launchRadiusFrac: number;
  launchSpeed: number; launchSpeedJitter: number;
  launchAngleDeg: number; launchSpreadDeg: number;

  // Interaction
  dockMaxOffset: number;
  mouseRepelRadius: number; mouseRepelForce: number; mouseSmooth: number; dockDeadzone: number;

  // Background
  bgDensity: number; bgSpeed: number;

  // Colors
  colorFg: string; colorBg: string; colorAccent: string;

  // Morphing
  morphK: number;
}>;

export default function TunerPage() {
  const ch = useRef<BroadcastChannel | null>(null);

  // ---- Defaults (align to current CONFIG you use) ----
  const [word, setWord] = useState("Lighthouse");
  const [sampleGap, setGap] = useState(4);
  const [letterSpacing, setLetterSpacing] = useState(0.06);
  const [glyphSizePx, setGlyphSizePx] = useState(18);          // ★
  const [wordScale, setWordScale] = useState(0.60);

  const [gravity, setGravity] = useState(2.8);
  const [bounce, setBounce] = useState(-0.28);
  const [groundFriction, setFriction] = useState(0.82);

  const [dropDurationMs, setDropMs] = useState(1200);
  const [morphDelayMs, setWaitMs] = useState(900);

  const [launchXFrac, setLX] = useState(-0.08);
  const [launchYFrac, setLY] = useState(-0.22);
  const [launchRadiusFrac, setLR] = useState(0.10);
  const [launchSpeed, setLS] = useState(6.0);
  const [launchSpeedJitter, setLSJ] = useState(0.35);
  const [launchAngleDeg, setLA] = useState(70);
  const [launchSpreadDeg, setLSD] = useState(24);

  const [dockMaxOffset, setDockMax] = useState(10);
  const [mouseRepelRadius, setMRR] = useState(90);
  const [mouseRepelForce, setMRF] = useState(9);
  const [mouseSmooth, setMS] = useState(0.18);
  const [dockDeadzone, setDead] = useState(18);

  const [bgDensity, setBgD] = useState(0.22);
  const [bgSpeed, setBgS] = useState(0.25);

  const [colorFg, setFg] = useState("#e5e7eb");
  const [colorBg, setBg] = useState("#0b0b10");
  const [colorAccent, setAccent] = useState("#a78bfa");

  const [morphK, setMorphK] = useState(0.14);

  // ------------------------------------
  useEffect(() => { try { ch.current = new BroadcastChannel("lettercloud-tune"); } catch {} return () => ch.current?.close(); }, []);
  const post = (patch: Msg) => {
    ch.current?.postMessage(patch);
    try { localStorage.setItem("lettercloud-tune", JSON.stringify({ t: Date.now(), ...patch })); } catch {}
  };

  // Emit changes
  useEffect(() => { post({ word }); }, [word]);
  useEffect(() => { post({ sampleGap }); }, [sampleGap]);
  useEffect(() => { post({ letterSpacing }); }, [letterSpacing]);
  useEffect(() => { post({ glyphSizePx }); }, [glyphSizePx]);
  useEffect(() => { post({ wordScale }); }, [wordScale]);

  useEffect(() => { post({ gravity }); }, [gravity]);
  useEffect(() => { post({ bounce }); }, [bounce]);
  useEffect(() => { post({ groundFriction }); }, [groundFriction]);

  useEffect(() => { post({ dropDurationMs }); }, [dropDurationMs]);
  useEffect(() => { post({ morphDelayMs }); }, [morphDelayMs]);

  useEffect(() => { post({ launchXFrac, launchYFrac, launchRadiusFrac }); }, [launchXFrac, launchYFrac, launchRadiusFrac]);
  useEffect(() => { post({ launchSpeed, launchSpeedJitter, launchAngleDeg, launchSpreadDeg }); }, [launchSpeed, launchSpeedJitter, launchAngleDeg, launchSpreadDeg]);

  useEffect(() => { post({ dockMaxOffset }); }, [dockMaxOffset]);
  useEffect(() => { post({ mouseRepelRadius, mouseRepelForce, mouseSmooth, dockDeadzone }); }, [mouseRepelRadius, mouseRepelForce, mouseSmooth, dockDeadzone]);

  useEffect(() => { post({ bgDensity, bgSpeed }); }, [bgDensity, bgSpeed]);

  useEffect(() => { post({ colorFg, colorBg, colorAccent }); }, [colorFg, colorBg, colorAccent]);

  useEffect(() => { post({ morphK }); }, [morphK]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6 space-y-8">
      <h1 className="text-xl font-bold">Local Tuner (dev only)</h1>
      <p className="text-sm text-zinc-400">开两个标签页： <code>/</code> 与 <code>/tuner</code>。此页请加入 <code>.gitignore</code>，线上不会部署。</p>

      {/* Copy & sampling */}
      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <FieldText label="Word" value={word} onChange={setWord} />
        <FieldRange label={`sampleGap (${sampleGap})`} min={2} max={8} step={1} value={sampleGap} onChange={setGap} hint="越小粒子越多" />
        <FieldRange label={`letterSpacing (${letterSpacing.toFixed(2)})`} min={0} max={0.2} step={0.01} value={letterSpacing} onChange={setLetterSpacing} />
        <FieldRange label={`glyphSizePx (${glyphSizePx}px)`} min={10} max={36} step={1} value={glyphSizePx} onChange={setGlyphSizePx} hint="直接控制粒子字体大小"/>
        <FieldRange label={`wordScale (${wordScale.toFixed(2)})`} min={0.3} max={0.9} step={0.01} value={wordScale} onChange={setWordScale} />
      </section>

      {/* Physics & timing */}
      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <FieldRange label={`gravity (${gravity.toFixed(1)})`} min={0.5} max={4} step={0.1} value={gravity} onChange={setGravity} />
        <FieldRange label={`bounce (${bounce.toFixed(2)})`} min={-0.6} max={-0.05} step={0.01} value={bounce} onChange={setBounce} />
        <FieldRange label={`groundFriction (${groundFriction.toFixed(2)})`} min={0.7} max={0.98} step={0.01} value={groundFriction} onChange={setFriction} />
        <FieldRange label={`dropDurationMs (${dropDurationMs})`} min={300} max={3000} step={50} value={dropDurationMs} onChange={setDropMs} />
        <FieldRange label={`morphDelayMs (${morphDelayMs})`} min={0} max={3000} step={50} value={morphDelayMs} onChange={setWaitMs} />
        <FieldRange label={`morphK (${morphK.toFixed(2)})`} min={0.06} max={0.24} step={0.01} value={morphK} onChange={setMorphK} />
      </section>

      {/* Launch */}
      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <FieldRange label={`launchXFrac (${launchXFrac})`} min={-0.5} max={0.5} step={0.01} value={launchXFrac} onChange={setLX} />
        <FieldRange label={`launchYFrac (${launchYFrac})`} min={-0.5} max={0.5} step={0.01} value={launchYFrac} onChange={setLY} />
        <FieldRange label={`launchRadiusFrac (${launchRadiusFrac.toFixed(2)})`} min={0} max={0.4} step={0.01} value={launchRadiusFrac} onChange={setLR} />
        <FieldRange label={`launchSpeed (${launchSpeed.toFixed(2)})`} min={1} max={10} step={0.1} value={launchSpeed} onChange={setLS} />
        <FieldRange label={`launchSpeedJitter (${launchSpeedJitter.toFixed(2)})`} min={0} max={1} step={0.01} value={launchSpeedJitter} onChange={setLSJ} />
        <FieldRange label={`launchAngleDeg (${launchAngleDeg}°)`} min={0} max={90} step={1} value={launchAngleDeg} onChange={setLA} />
        <FieldRange label={`launchSpreadDeg (${launchSpreadDeg}°)`} min={0} max={60} step={1} value={launchSpreadDeg} onChange={setLSD} />
      </section>

      {/* Interaction */}
      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <FieldRange label={`dockMaxOffset (${dockMaxOffset}px)`} min={0} max={24} step={1} value={dockMaxOffset} onChange={setDockMax} />
        <FieldRange label={`mouseRepelRadius (${mouseRepelRadius}px)`} min={40} max={200} step={1} value={mouseRepelRadius} onChange={setMRR} />
        <FieldRange label={`mouseRepelForce (${mouseRepelForce})`} min={1} max={20} step={1} value={mouseRepelForce} onChange={setMRF} />
        <FieldRange label={`mouseSmooth (${mouseSmooth.toFixed(2)})`} min={0.05} max={0.5} step={0.01} value={mouseSmooth} onChange={setMS} />
        <FieldRange label={`dockDeadzone (${dockDeadzone}px)`} min={0} max={40} step={1} value={dockDeadzone} onChange={setDead} />
      </section>

      {/* Background & colors */}
      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        <FieldRange label={`bgDensity (${bgDensity.toFixed(2)})`} min={0} max={0.6} step={0.01} value={bgDensity} onChange={setBgD} />
        <FieldRange label={`bgSpeed (${bgSpeed.toFixed(2)})`} min={0} max={1} step={0.01} value={bgSpeed} onChange={setBgS} />
        <FieldColor label="colorFg"   value={colorFg}   onChange={setFg} />
        <FieldColor label="colorBg"   value={colorBg}   onChange={setBg} />
        <FieldColor label="colorAccent" value={colorAccent} onChange={setAccent} />
      </section>
    </div>
  );
}

/* Small presentational inputs */
function FieldText({label, value, onChange}:{label:string; value:string; onChange:(v:string)=>void}){
  return (
    <div>
      <label className="block text-sm">{label}</label>
      <input value={value} onChange={e=>onChange(e.target.value)}
        className="mt-1 w-full rounded-md bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/30"/>
    </div>
  );
}

function FieldRange(props:{label:string; min:number; max:number; step:number; value:number; onChange:(v:number)=>void; hint?:string}){
  const {label, min, max, step, value, onChange, hint} = props;
  return (
    <div>
      <label className="block text-sm">{label}</label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))}
        className="mt-2 w-full"/>
      {hint ? <p className="text-xs text-zinc-500 mt-1">{hint}</p> : null}
    </div>
  );
}

function FieldColor({label, value, onChange}:{label:string; value:string; onChange:(v:string)=>void}){
  return (
    <div>
      <label className="block text-sm">{label}</label>
      <input type="color" value={value} onChange={e=>onChange(e.target.value)} className="mt-2 h-9 w-full bg-white/5"/>
    </div>
  );
}
