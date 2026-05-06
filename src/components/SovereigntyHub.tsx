import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { PURGE_ALL_DATA } from "@/lib/purge";

/**
 * SovereigntyHub — Tactile Sovereignty settings environment.
 *
 * Deep Obsidian backdrop, Liquid Toggles, and the Vaporize Kill Switch
 * (3000ms long-press → glitch deconstruct → forced re-onboarding).
 */

interface SovereigntyHubProps {
  open: boolean;
  onClose: () => void;
  /** Forced redirect target — clears app state back to onboarding. */
  onPurged: () => void;
}

const TOGGLES = [
  {
    key: "haptic",
    label: "Haptic Synchronization",
    hint: "Micro-vibrations align UI tempo to your nervous system.",
    default: true,
  },
  {
    key: "phenotyping",
    label: "Passive Phenotyping Engine",
    hint: "Behavioral biomarkers (latency, cadence) inform triage.",
    default: true,
  },
  {
    key: "residency",
    label: "Lagos Residency Storage",
    hint: "All narrative strata remain on Lagos-Residency-1.",
    default: true,
  },
] as const;

const HOLD_MS = 3000;

const SovereigntyHub = ({ open, onClose, onPurged }: SovereigntyHubProps) => {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TOGGLES.map((t) => [t.key, t.default])),
  );

  // Long-press state machine for the Vaporize switch
  const [holdProgress, setHoldProgress] = useState(0); // 0..1
  const [glitching, setGlitching] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const cancelHold = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;
    setHoldProgress(0);
  }, []);

  const completeKill = useCallback(async () => {
    setGlitching(true);
    try { navigator.vibrate?.([20, 30, 80]); } catch { /* no-op */ }
    // 0.5s glitch — pixels deconstruct.
    await new Promise((r) => window.setTimeout(r, 500));
    await PURGE_ALL_DATA();
    setGlitching(false);
    setHoldProgress(0);
    onPurged();
  }, [onPurged]);

  const startHold = useCallback(() => {
    if (glitching) return;
    startRef.current = performance.now();
    const tick = (now: number) => {
      if (startRef.current == null) return;
      const p = Math.min(1, (now - startRef.current) / HOLD_MS);
      setHoldProgress(p);
      if (p >= 1) {
        cancelHold();
        void completeKill();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [cancelHold, completeKill, glitching]);

  // Cleanup if the panel unmounts mid-hold.
  useEffect(() => () => cancelHold(), [cancelHold]);
  useEffect(() => {
    if (!open) cancelHold();
  }, [open, cancelHold]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-stretch justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label="Sovereignty Hub"
        >
          {/* Sensory dampener backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(2,6,23,0.78)", backdropFilter: "blur(10px)" }}
            onClick={() => !glitching && onClose()}
          />

          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-[480px] mx-auto flex flex-col"
            style={{
              background: "#020617",
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)",
              backgroundSize: "3px 3px",
              paddingTop: "max(env(safe-area-inset-top), 1.5rem)",
              paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)",
            }}
          >
            {/* Header */}
            <div className="px-6 pb-5 flex items-center justify-between">
              <div>
                <div className="text-[10px] tracking-[0.36em] uppercase text-foreground/45">
                  Sovereignty
                </div>
                <div
                  className="text-[18px] mt-1 text-foreground/95"
                  style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "0.01em" }}
                >
                  Your data, your gravity.
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={glitching}
                className="text-[10px] tracking-[0.28em] uppercase text-foreground/55 hover:text-foreground/85 transition-colors disabled:opacity-30"
                aria-label="Close Sovereignty Hub"
              >
                Close
              </button>
            </div>

            {/* Toggles */}
            <div className="px-6 flex flex-col gap-3">
              {TOGGLES.map((t) => {
                const on = toggles[t.key];
                return (
                  <div
                    key={t.key}
                    className="flex items-center justify-between gap-4 rounded-2xl px-4 py-4"
                    style={{
                      background: "rgba(255,255,255,0.015)",
                      border: `1px solid ${on ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.06)"}`,
                      boxShadow: on
                        ? "0 0 24px -6px rgba(16,185,129,0.45), inset 0 0 18px -10px rgba(16,185,129,0.55)"
                        : "inset 0 1px 1px rgba(255,255,255,0.03)",
                      transition:
                        "border-color 600ms ease, box-shadow 600ms ease, background 600ms ease",
                    }}
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] text-foreground/90">{t.label}</div>
                      <div className="text-[11px] mt-0.5 text-foreground/45 leading-snug">
                        {t.hint}
                      </div>
                    </div>

                    {/* Liquid Toggle */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={t.label}
                      onClick={() => {
                        try { navigator.vibrate?.(8); } catch { /* no-op */ }
                        setToggles((s) => ({ ...s, [t.key]: !s[t.key] }));
                      }}
                      className="relative shrink-0 rounded-full"
                      style={{
                        width: 44,
                        height: 26,
                        background: on
                          ? "linear-gradient(135deg, rgba(16,185,129,0.35), rgba(16,185,129,0.6))"
                          : "#020617",
                        border: `1px solid ${on ? "rgba(16,185,129,0.6)" : "rgba(255,255,255,0.1)"}`,
                        boxShadow: on
                          ? "0 0 14px rgba(16,185,129,0.55), inset 0 0 10px rgba(16,185,129,0.35)"
                          : "inset 0 1px 3px rgba(0,0,0,0.6)",
                        transition: "all 500ms cubic-bezier(0.4,0,0.2,1)",
                      }}
                    >
                      <span
                        aria-hidden
                        className="absolute top-1/2 -translate-y-1/2 rounded-full"
                        style={{
                          width: 18,
                          height: 18,
                          left: on ? 22 : 3,
                          background: on ? "#ECFDF5" : "rgba(255,255,255,0.6)",
                          boxShadow: on
                            ? "0 0 10px rgba(16,185,129,0.7)"
                            : "0 1px 2px rgba(0,0,0,0.4)",
                          transition: "left 420ms cubic-bezier(0.65,0,0.35,1), background 420ms ease",
                        }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Spacer */}
            <div className="flex-1 min-h-[28px]" />

            {/* Hairline rule */}
            <div
              className="mx-6"
              style={{ height: "0.5px", background: "rgba(255,255,255,0.08)" }}
            />

            {/* Vaporize Kill Switch */}
            <div className="px-6 pt-5">
              <div className="text-[9px] tracking-[0.32em] uppercase text-foreground/40 mb-2">
                Kill switch · irreversible
              </div>
              <button
                type="button"
                aria-label="Vaporize my narrative — hold for 3 seconds"
                onPointerDown={startHold}
                onPointerUp={cancelHold}
                onPointerLeave={cancelHold}
                onPointerCancel={cancelHold}
                disabled={glitching}
                className="relative w-full h-12 rounded-xl overflow-hidden select-none"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(112,26,117,0.55)",
                  fontFamily:
                    "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                  letterSpacing: "0.22em",
                  fontSize: 11,
                  color: "#F3E8FF",
                  textTransform: "uppercase",
                  filter: glitching
                    ? "url(#nx-glitch) hue-rotate(20deg) contrast(1.4)"
                    : "none",
                  transition: "filter 200ms",
                }}
              >
                {/* Viscous burgundy fill */}
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${holdProgress * 100}%`,
                    background:
                      "linear-gradient(90deg, rgba(112,26,117,0.85), rgba(157,23,77,0.95))",
                    boxShadow: "inset 0 0 18px rgba(0,0,0,0.45)",
                    transition: "width 80ms linear",
                  }}
                />
                {/* Glitch shards */}
                {glitching && (
                  <>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        aria-hidden
                        className="absolute"
                        style={{
                          left: `${(i * 19) % 100}%`,
                          top: `${(i * 23) % 100}%`,
                          width: 2 + (i % 3) * 4,
                          height: 12 + (i % 2) * 8,
                          background: i % 2 ? "#F3E8FF" : "#701A75",
                          opacity: 0.8,
                          transform: `translateX(${(i % 2 ? -1 : 1) * 12}px)`,
                          animation: `nx-shard 500ms ${i * 30}ms forwards`,
                        }}
                      />
                    ))}
                  </>
                )}
                <span className="relative z-10">
                  {glitching ? "Vaporizing…" : "Vaporize My Narrative"}
                </span>
              </button>
              <div className="text-[10px] mt-2 text-foreground/40 leading-relaxed">
                Hold for 3 seconds. All local strata are destroyed and a
                prioritized purge dispatches to Lagos-Residency-1.
              </div>
            </div>

            {/* Inline SVG filter for the glitch deconstruction */}
            <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
              <filter id="nx-glitch">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
                <feDisplacementMap in="SourceGraphic" scale="6" />
              </filter>
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SovereigntyHub;
