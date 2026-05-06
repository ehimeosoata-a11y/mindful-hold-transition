import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PhoneCall, MoonStar } from "lucide-react";

/**
 * InterventionModal — Non-Iatrogenic "Human Fail-Safe."
 *
 * Triggered by the Bayesian Triage Engine entering the "Muted Plum" state.
 * Sensory-dampened backdrop, weighted spring entry, and two clear escapes:
 *   • Connect to clinical support (tel: link to Lagos hotline)
 *   • Dim & exit (Blackout retreat)
 */

interface InterventionModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-configured Lagos crisis hotline (E.164). */
  hotline?: string;
}

const InterventionModal = ({
  open,
  onClose,
  hotline = "+2348000000232",
}: InterventionModalProps) => {
  const [blackout, setBlackout] = useState(false);

  // Auto-lift the blackout after a long beat so the user can re-engage.
  useEffect(() => {
    if (!blackout) return;
    const t = window.setTimeout(() => setBlackout(false), 12000);
    return () => window.clearTimeout(t);
  }, [blackout]);

  return (
    <>
      <AnimatePresence>
        {open && !blackout && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            role="dialog"
            aria-modal="true"
            aria-label="The load is heavy right now"
          >
            {/* Sensory dampener — 20px Gaussian blur, 60% dim */}
            <div
              className="absolute inset-0"
              style={{
                background: "rgba(2,6,23,0.6)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
              onClick={onClose}
            />

            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              // Weighted spring — mass 1, tension 120, friction 14
              transition={{ type: "spring", mass: 1, stiffness: 120, damping: 14 }}
              className="relative w-full max-w-[440px] mx-auto rounded-t-3xl px-6 pt-7"
              style={{
                background: "rgba(15,23,42,0.6)",
                backdropFilter: "blur(15px)",
                WebkitBackdropFilter: "blur(15px)",
                border: "1px solid rgba(255,255,255,0.06)",
                paddingBottom: "max(env(safe-area-inset-bottom), 1.75rem)",
              }}
            >
              {/* Notch */}
              <div
                className="mx-auto mb-5 w-10 h-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.14)" }}
              />

              <h2
                className="text-[22px] leading-tight"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: "#F8FAFC",
                  letterSpacing: "0.005em",
                }}
              >
                The load is heavy right now.
              </h2>

              <p
                className="mt-3 text-[14px]"
                style={{ color: "#94A3B8", lineHeight: 1.6 }}
              >
                The narrative strata are shifting. You don't have to carry this
                alone. Let's bring in a human who can help, or take a moment to
                find stillness.
              </p>

              <div className="mt-7 flex flex-col gap-3">
                {/* Primary — Connection */}
                <a
                  href={`tel:${hotline}`}
                  onClick={() => {
                    try { navigator.vibrate?.(15); } catch { /* no-op */ }
                  }}
                  className="flex items-center justify-center gap-2 h-12 rounded-full text-[13px] tracking-[0.14em] uppercase transition-transform active:scale-[0.98]"
                  style={{
                    background: "#10B981",
                    color: "#022C22",
                    boxShadow: "0 8px 30px -8px rgba(16,185,129,0.55)",
                    fontWeight: 500,
                  }}
                >
                  <PhoneCall className="w-4 h-4" strokeWidth={2} />
                  Connect to Clinical Support
                </a>

                {/* Secondary — Retreat */}
                <button
                  type="button"
                  onClick={() => {
                    try { navigator.vibrate?.(8); } catch { /* no-op */ }
                    setBlackout(true);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 h-12 rounded-full text-[13px] tracking-[0.14em] uppercase transition-colors"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.18)",
                    color: "#CBD5E1",
                  }}
                >
                  <MoonStar className="w-4 h-4" strokeWidth={1.75} />
                  Dim &amp; Exit
                </button>
              </div>

              <div className="mt-5 text-center text-[10px] tracking-[0.28em] uppercase text-foreground/35">
                Lagos · NDPR · Confidential
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blackout — simulated 0% brightness retreat */}
      <AnimatePresence>
        {blackout && (
          <motion.button
            type="button"
            aria-label="Tap anywhere to return"
            onClick={() => setBlackout(false)}
            className="fixed inset-0 z-[130]"
            style={{ background: "#000000" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default InterventionModal;
