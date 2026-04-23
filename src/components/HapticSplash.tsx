import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";

const HOLD_DURATION = 3000;
const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
const IDLE_STROKE = "rgba(255, 255, 255, 0.2)";
const ACTIVE_STROKE = "#10B981";

interface HapticSplashProps {
  onComplete: () => void;
}

const HapticSplash = ({ onComplete }: HapticSplashProps) => {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Motion values for color interpolation (separate from React state to avoid re-renders).
  const colorProgress = useMotionValue(0);
  const strokeColor = useTransform(
    colorProgress,
    [0, 1],
    [IDLE_STROKE, ACTIVE_STROKE],
  );

  const stopLoop = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startRef.current = null;
  };

  const tick = useCallback(() => {
    if (startRef.current === null) return;
    const elapsed = performance.now() - startRef.current;
    const pct = Math.min(elapsed / HOLD_DURATION, 1);
    setProgress(pct);
    if (pct >= 1) {
      stopLoop();
      setHolding(false);
      setCompleted(true);
      try {
        navigator.vibrate?.(200);
      } catch {
        /* haptics unsupported */
      }
      window.setTimeout(onComplete, 900);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [onComplete]);

  const handleDown = (e: React.PointerEvent) => {
    if (completed) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setInterrupted(false);
    setHolding(true);
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    // Cubic-bezier interpolation of stroke color across the full 3s hold.
    animate(colorProgress, 1, { duration: HOLD_DURATION / 1000, ease: EASE });
  };

  const handleRelease = () => {
    if (completed) return;
    if (holding && progress < 1) {
      stopLoop();
      setHolding(false);
      setProgress(0);
      setInterrupted(true);
      // Quick 300ms fade back to muted grey-white — "connection lost".
      animate(colorProgress, 0, { duration: 0.3, ease: EASE });
    }
  };

  useEffect(() => () => stopLoop(), []);

  // SVG ring math
  const size = 220;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <AnimatePresence>
      {!completed || progress < 1 ? (
        <motion.div
          key="splash"
          className="fixed inset-0 z-50 nexilo-bg flex items-center justify-center overflow-hidden select-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      ) : null}

      <motion.div
        key="splash-content"
        className="fixed inset-0 z-50 nexilo-bg flex flex-col items-center justify-center overflow-hidden select-none touch-none"
        initial={{ opacity: 1 }}
        animate={completed ? { opacity: 0, scale: 1.4 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={() => {
          /* parent handles unmount via onComplete */
        }}
      >
        {/* Breathing radial gradient */}
        <motion.div
          aria-hidden
          className="absolute inset-0 breathing-pulse pointer-events-none"
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
        />

        {/* Holding Anchor */}
        <div
          role="button"
          aria-label="Hold for three seconds"
          tabIndex={0}
          onPointerDown={handleDown}
          onPointerUp={handleRelease}
          onPointerCancel={handleRelease}
          onPointerLeave={handleRelease}
          className="relative ring-glow rounded-full cursor-pointer touch-none"
          style={{ width: size, height: size }}
        >
          {/* Inner soft glow disc */}
          <motion.div
            className="absolute inset-3 rounded-full"
            style={{
              background:
                "radial-gradient(circle, hsla(160, 84%, 50%, 0.35) 0%, hsla(160, 84%, 39%, 0.05) 70%)",
            }}
            animate={{
              scale: holding ? [1, 1.06, 1] : 1,
              opacity: holding ? 1 : 0.85,
            }}
            transition={{
              duration: 1.2,
              repeat: holding ? Infinity : 0,
              ease: "easeInOut",
            }}
          />

          {/* Progress ring */}
          <svg
            width={size}
            height={size}
            className="absolute inset-0 -rotate-90"
            aria-hidden
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsla(160, 30%, 92%, 0.08)"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--nexilo-emerald))"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{
                filter: "drop-shadow(0 0 8px hsla(160, 84%, 55%, 0.6))",
                transition: holding ? "none" : "stroke-dashoffset 0.4s ease-out",
              }}
            />
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-foreground/80 text-sm tracking-[0.3em] uppercase">
              {completed ? "Arriving" : holding ? "Hold" : "Press"}
            </span>
          </div>
        </div>

        {/* Brand + instruction */}
        <div className="absolute top-[14%] flex flex-col items-center gap-2">
          <h1 className="text-foreground text-3xl font-light tracking-[0.4em]">
            NEXILO
          </h1>
          <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase">
            A Safe Haven
          </p>
        </div>

        {/* Bottom message */}
        <div className="absolute bottom-[14%] h-12 flex items-center justify-center px-8 text-center">
          <AnimatePresence mode="wait">
            {interrupted ? (
              <motion.p
                key="interrupt"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.5 }}
                className="text-muted-foreground text-sm"
              >
                Take a breath. Hold for three seconds.
              </motion.p>
            ) : (
              <motion.p
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="text-muted-foreground text-xs tracking-[0.2em] uppercase"
              >
                {holding ? "Breathe in" : "Press and hold the ring"}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HapticSplash;