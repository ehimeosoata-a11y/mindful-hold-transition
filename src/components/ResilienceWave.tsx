import { memo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * ResilienceWave — math-driven sine wave visualization.
 *
 *   y = A · sin(k · x + ω · t + φ)
 *
 * • 120 sample points for retina-smooth curves
 * • Two layered waves (primary + ghost) with SVG glow filter
 * • <linearGradient> fill from var(--wave-color) → transparent
 * • requestAnimationFrame drives horizontal "flow"
 * • A 10s breathing swell modulates amplitude + frequency
 * • triageState morphs the wave (emerald swell ↔ crimson heartbeat) over 3s
 */

export type TriageState = "calm" | "alert" | "crisis";

interface ResilienceWaveProps {
  triageState?: TriageState;
  /** Optional override; otherwise inherits CSS var --wave-color */
  color?: string;
}

const SAMPLE_COUNT = 120;
const VIEW_W = 480;
const VIEW_H = 200;
const BASELINE = VIEW_H * 0.6;

// Per-state physical parameters. We interpolate between these over 3s.
const STATE_PRESETS: Record<
  TriageState,
  { amplitude: number; frequency: number; speed: number }
> = {
  // Long, slow emerald swell
  calm: { amplitude: 22, frequency: 1.4, speed: 0.6 },
  // Tight, urgent crimson heartbeat
  alert: { amplitude: 34, frequency: 4.2, speed: 2.4 },
  // Crisis — sharper, faster, urgent
  crisis: { amplitude: 40, frequency: 5.0, speed: 3.0 },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const buildWavePath = (
  amplitude: number,
  frequency: number,
  phase: number,
  yOffset = 0,
) => {
  const k = (frequency * Math.PI * 2) / VIEW_W;
  let d = "";
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const x = (i / SAMPLE_COUNT) * VIEW_W;
    const y = BASELINE + yOffset + amplitude * Math.sin(k * x + phase);
    d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
};

const buildFillPath = (linePath: string) =>
  `${linePath} L ${VIEW_W} ${VIEW_H} L 0 ${VIEW_H} Z`;

const ResilienceWaveBase = ({ triageState = "calm", color }: ResilienceWaveProps) => {
  const filterId = "resilience-glow";
  const gradientId = "resilience-fill";

  // Animated paths driven by rAF (kept in refs to avoid React churn)
  const primaryRef = useRef<SVGPathElement | null>(null);
  const ghostRef = useRef<SVGPathElement | null>(null);
  const fillRef = useRef<SVGPathElement | null>(null);

  // State morph: 0 = calm, 1 = alert. Interpolated over 3s on triageState change.
  const morphRef = useRef(triageState === "alert" ? 1 : 0);
  const morphTargetRef = useRef(morphRef.current);
  const morphStartRef = useRef(performance.now());
  const morphFromRef = useRef(morphRef.current);

  const [active] = useState(true);

  useEffect(() => {
    morphFromRef.current = morphRef.current;
    morphTargetRef.current = triageState === "alert" ? 1 : 0;
    morphStartRef.current = performance.now();
  }, [triageState]);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const MORPH_MS = 3000;
    const BREATHE_MS = 10_000;

    const tick = (now: number) => {
      const t = (now - start) / 1000; // seconds since mount

      // ---- Triage morph (3s ease) ----
      const morphElapsed = now - morphStartRef.current;
      const morphP = Math.min(1, morphElapsed / MORPH_MS);
      morphRef.current = lerp(
        morphFromRef.current,
        morphTargetRef.current,
        easeInOut(morphP),
      );
      const m = morphRef.current;

      // Interpolate physical params from calm → alert
      const baseA = lerp(STATE_PRESETS.calm.amplitude, STATE_PRESETS.alert.amplitude, m);
      const baseF = lerp(STATE_PRESETS.calm.frequency, STATE_PRESETS.alert.frequency, m);
      const speed = lerp(STATE_PRESETS.calm.speed, STATE_PRESETS.alert.speed, m);

      // ---- 10s breathing swell (independent of input) ----
      const breath = Math.sin((now / BREATHE_MS) * Math.PI * 2);
      const A = baseA * (1 + 0.12 * breath);
      const f = baseF * (1 + 0.06 * breath);

      // ω·t — phase advance; speed scales with state
      const omegaT = t * speed * Math.PI;

      const primaryPath = buildWavePath(A, f, omegaT, 0);
      const ghostPath = buildWavePath(A * 0.85, f, omegaT + 0.6, -6);
      const fillPath = buildFillPath(primaryPath);

      primaryRef.current?.setAttribute("d", primaryPath);
      ghostRef.current?.setAttribute("d", ghostPath);
      fillRef.current?.setAttribute("d", fillPath);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const stroke = color ?? "var(--wave-color)";

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
      style={{ willChange: "transform" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Soft halo behind the wave */}
      <div
        className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[140%] h-64 rounded-[50%] blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--wave-color) 0%, transparent 65%)",
          opacity: 0.18,
          transition: "background 3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        style={{ willChange: "transform" }}
      >
        <defs>
          {/* High-intensity Gaussian blur used as a drop-shadow */}
          <filter id={filterId} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Fill under the wave: 20% wave-color → transparent */}
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.2" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          ref={fillRef}
          fill={`url(#${gradientId})`}
          style={{ transition: "fill 3s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />

        {/* Wave B — ghost */}
        <path
          ref={ghostRef}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.3}
          filter={`url(#${filterId})`}
          style={{ transition: "stroke 3s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />

        {/* Wave A — primary */}
        <path
          ref={primaryRef}
          fill="none"
          stroke={stroke}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={1}
          filter={`url(#${filterId})`}
          style={{ transition: "stroke 3s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
    </motion.div>
  );
};

const ResilienceWave = memo(ResilienceWaveBase);
export default ResilienceWave;
