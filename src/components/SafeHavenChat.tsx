import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Lock, Settings2, Flame, ShieldCheck, Activity } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import ResilienceWave, { type TriageState } from "./ResilienceWave";
import HistoricalPulse, { type PulseDatum } from "./HistoricalPulse";
import NarrativeGhost from "./NarrativeGhost";

type Message = { from: "haven" | "you"; text: string };

const initialMessages: Message[] = [
  { from: "haven", text: "You arrived. Take a moment — there's no rush here." },
  { from: "haven", text: "When you're ready, name one thing that's true right now." },
];

// Demo: last 7 days of triage scores — a gentle arc from crisis → steady,
// so the "Constant Thread" reads as a story of recovery.
const samplePulse: PulseDatum[] = [
  { day: "MON", score: 0.42, state: "Crisis",   date: "Mon · Apr 17" },
  { day: "TUE", score: 0.55, state: "Elevated", date: "Tue · Apr 18" },
  { day: "WED", score: 0.48, state: "Crisis",   date: "Wed · Apr 19" },
  { day: "THU", score: 0.67, state: "Elevated", date: "Thu · Apr 20" },
  { day: "FRI", score: 0.74, state: "Elevated", date: "Fri · Apr 21" },
  { day: "SAT", score: 0.83, state: "Steady",   date: "Sat · Apr 22" },
  { day: "SUN", score: 0.88, state: "Steady",   date: "Sun · Apr 23" },
];

const SafeHavenChat = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [triage, setTriage] = useState<TriageState>("calm");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [burnConfirmOpen, setBurnConfirmOpen] = useState(false);
  const [burning, setBurning] = useState(false);
  const [burned, setBurned] = useState(false);
  const [pulseOpen, setPulseOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [ripples, setRipples] = useState<number[]>([]);
  const narrativeRef = useRef<HTMLElement>(null);

  // The user has spoken iff at least one message in the log is from "you".
  // Drives the NarrativeGhost exit so the ambient blob yields to dialogue.
  const userHasSpoken = messages.some((m) => m.from === "you");

  // Glow class is purely presentational and reflects the same triage signal
  // as the wave — keeping the entire UI in lock-step as a single organism.
  const sendGlowClass =
    triage === "calm" ? "send-glow-calm" : triage === "alert" ? "send-glow-alert" : "send-glow-crisis";
  const rippleColor =
    triage === "calm" ? "rgba(16,185,129,0.55)" : triage === "alert" ? "rgba(245,158,11,0.55)" : "rgba(112,26,117,0.6)";

  useEffect(() => {
    document.documentElement.setAttribute("data-triage", triage);
  }, [triage]);

  // Detect mobile keyboard via VisualViewport — protects the 10/60/30 ratio
  // by collapsing the visualization zone instead of squishing it.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const diff = window.innerHeight - vv.height;
      setKeyboardOpen(diff > 150);
    };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  // Auto-scroll narrative to bottom on new message
  useEffect(() => {
    const el = narrativeRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Lock the Evolutionary Drawer while the user is typing — no visual clutter.
  useEffect(() => {
    if (inputFocused && pulseOpen) setPulseOpen(false);
  }, [inputFocused, pulseOpen]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "you", text }]);
    setDraft("");
    // Fire a one-shot ripple keyed by timestamp; cleaned up after the animation.
    const id = Date.now();
    setRipples((r) => [...r, id]);
    window.setTimeout(() => setRipples((r) => r.filter((x) => x !== id)), 650);
  };

  return (
    <motion.div
      className="w-full flex justify-center nexilo-shell-bg"
      style={{ minHeight: "100dvh" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Mobile-first 480px shell — strict 10 / 60 / 30 distribution */}
      <div
        className="relative w-full max-w-[480px] flex flex-col"
        style={{ minHeight: "100dvh", height: "100dvh" }}
      >
        {/* TOP — 10% : Evolutionary Header. Brand left, trust+status grouped right. */}
        <header
          className="sticky top-0 z-50 flex items-center justify-between px-6 nexilo-shell-bg"
          style={{
            flex: "0 0 10%",
            minHeight: "64px",
            paddingTop: "max(env(safe-area-inset-top), 0.75rem)",
          }}
        >
          {/* LEFT — Brand pinned left */}
          <div className="flex flex-col leading-tight">
            <span className="text-foreground text-[12px] font-medium tracking-[0.42em]">NEXILO</span>
            <span className="text-muted-foreground text-[9px] tracking-[0.28em] uppercase">Safe Haven</span>
          </div>

          {/* RIGHT — NDPR badge + status dot, grouped tightly. Airy navy in the center. */}
          <div className="flex items-center gap-1.5">
            {/* Sparkline drawer toggle */}
            <button
              type="button"
              aria-label={pulseOpen ? "Close historical pulse" : "Open historical pulse"}
              aria-expanded={pulseOpen}
              disabled={inputFocused}
              onClick={() => setPulseOpen((v) => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Activity className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>

            {/* NDPR + status dot — grouped into one pill for tight visual unity */}
            <button
              type="button"
              aria-label={`NDPR Encrypted · Lagos. Triage: ${triage}. Tap to cycle.`}
              onClick={() =>
                setTriage((s) =>
                  s === "calm" ? "alert" : s === "alert" ? "crisis" : "calm",
                )
              }
              className="flex items-center gap-2 h-8 pl-2.5 pr-3 rounded-full transition-colors"
              style={{
                background: "rgba(255,255,255,0.03)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Lock className="w-3 h-3 text-foreground/60" strokeWidth={1.75} />
              <span className="text-[9px] font-light tracking-[0.22em] uppercase text-foreground/65">
                NDPR · Lagos
              </span>
              <span
                aria-hidden
                className="ml-1 w-1.5 h-1.5 rounded-full"
                style={{
                  background: "var(--wave-color)",
                  boxShadow: "0 0 8px var(--wave-color)",
                  transition: "background 3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
              <span className="text-[9px] tracking-[0.24em] uppercase text-foreground/70">
                {triage}
              </span>
            </button>

            <button
              type="button"
              aria-label="Open settings"
              onClick={() => setSettingsOpen(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Settings2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </header>

        {/* Bridge Indicator — only in crisis */}
        <AnimatePresence>
          {triage === "crisis" && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="mx-6 mt-1 mb-2 self-center flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(127, 29, 29, 0.18)",
                border: "1px solid rgba(220, 38, 38, 0.35)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                animation: "bridge-pulse 2.4s ease-in-out infinite",
              }}
              role="status"
            >
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#FCA5A5" }} strokeWidth={1.75} />
              <span className="text-[10px] tracking-[0.22em] uppercase" style={{ color: "#FCA5A5" }}>
                Verified Bridge · Clinician Notified
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MIDDLE — 60% : Narrative space, masked + scrollable */}
        <main
          ref={narrativeRef}
          className="px-6 pt-4 pb-4 flex flex-col gap-3 overflow-y-auto no-scrollbar narrative-mask"
          style={{ flex: keyboardOpen ? "1 1 auto" : "0 0 60%" }}
        >
          {burned ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="m-auto text-center px-6"
            >
              <div
                className="mx-auto mb-3 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Lock className="w-4 h-4 text-foreground/60" strokeWidth={1.75} />
              </div>
              <p className="text-[13px] leading-relaxed text-foreground/70">
                Your narrative space has been cleared and encrypted.
              </p>
            </motion.div>
          ) : (
          <motion.div
            className="contents"
            animate={{ opacity: burning ? 0 : 1 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i < initialMessages.length ? 0.4 + i * 0.25 : 0, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className={
                m.from === "haven"
                  ? "self-start max-w-[82%] rounded-2xl rounded-bl-md px-4 py-3 text-[14px] leading-relaxed text-foreground/90"
                  : "self-end max-w-[82%] rounded-2xl rounded-br-md px-4 py-3 text-[14px] leading-relaxed text-foreground/85"
              }
              style={
                m.from === "haven"
                  ? {
                      // AI: slightly lighter navy/charcoal, no border — soft and grounded
                      background: "rgba(255,255,255,0.035)",
                      border: "1px solid rgba(255,255,255,0.04)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                    }
                  : {
                      // User: border-only style, transparent fill — subtle hierarchy
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }
              }
            >
              {m.text}
            </motion.div>
          ))}
          </motion.div>
          )}
        </main>

        {/* BOTTOM LAYERS — Wave (z-0) and Floating Input (z-10), both pinned to bottom */}
        <section
          className="relative w-full"
          style={{
            flex: keyboardOpen ? "0 0 96px" : "0 0 30%",
            transition: "flex-basis 0.35s ease",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
          aria-label="Resilience visualization and composer"
        >
          {/* Z-0 — Resilience Wave, pointer-events-none so it never blocks input */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{
              zIndex: 0,
              opacity: keyboardOpen ? 0 : 1,
              transition: "opacity 0.35s ease",
            }}
          >
            <ResilienceWave triageState={triage} />
          </div>

          {/* Z-10 — Floating glass composer hovering OVER the wave */}
          <div
            className="absolute left-0 right-0 px-6"
            style={{
              zIndex: 10,
              bottom: "max(env(safe-area-inset-bottom), 0.75rem)",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 rounded-full pl-5 pr-2 py-2"
              style={{
                background: "rgba(10, 17, 40, 0.6)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Say what's true right now…"
                className="flex-1 bg-transparent outline-none text-[14px] text-foreground placeholder:text-muted-foreground/70 py-1.5"
              />
              <button
                type="submit"
                aria-label="Send"
                className="w-9 h-9 rounded-full flex items-center justify-center text-primary-foreground transition-transform active:scale-95"
                style={{
                  background: "var(--wave-color)",
                  transition: "background 3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s ease",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </button>
            </form>
          </div>
        </section>

        {/* EVOLUTIONARY DRAWER — Historical Pulse, slides down BEHIND the header (z-40) */}
        <AnimatePresence>
          {pulseOpen && (
            <>
              <motion.div
                key="pulse-scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 z-30"
                style={{ background: "rgba(10,17,40,0.35)" }}
                onClick={() => setPulseOpen(false)}
              />
              <motion.div
                key="pulse-drawer"
                initial={{ y: "-100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute top-0 left-0 right-0 z-40 rounded-b-3xl overflow-hidden"
                style={{
                  height: "50%",
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  paddingTop: "max(env(safe-area-inset-top), 0.75rem)",
                }}
                role="dialog"
                aria-label="Historical pulse"
              >
                <div className="h-full flex flex-col px-6 pt-16 pb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] tracking-[0.32em] uppercase text-foreground/70">
                      The Constant Thread
                    </span>
                    <span className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground/70">
                      7 days
                    </span>
                  </div>
                  <div className="flex-1 flex items-center">
                    <HistoricalPulse data={samplePulse} />
                  </div>
                  {/* Drag handle */}
                  <button
                    type="button"
                    onClick={() => setPulseOpen(false)}
                    aria-label="Close historical pulse"
                    className="mx-auto mt-2 h-3 w-12 flex items-center justify-center"
                  >
                    <span
                      className="block h-[2px] w-10 rounded-full"
                      style={{ background: "rgba(255,255,255,0.18)" }}
                    />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Settings drawer */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div
              className="absolute inset-0"
              style={{ background: "rgba(10,17,40,0.55)", backdropFilter: "blur(4px)" }}
              onClick={() => setSettingsOpen(false)}
            />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="relative w-full max-w-[480px] mx-auto rounded-t-3xl glass-panel p-6"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}
            >
              <div className="mx-auto mb-4 w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
              <h2 className="text-[11px] tracking-[0.32em] uppercase text-foreground/80 mb-4">Settings</h2>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-start gap-3">
                  <Flame className="w-4 h-4 mt-0.5 text-foreground/70" strokeWidth={1.75} />
                  <div>
                    <div className="text-[13px] text-foreground/90">Burn Narrative History</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 max-w-[260px]">
                      Permanently clear this session's narrative. Encryption keys rotated.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBurnConfirmOpen(true)}
                  aria-label="Burn narrative history"
                  className="px-3 h-8 rounded-full text-[10px] tracking-[0.22em] uppercase transition-colors"
                  style={{
                    background: "rgba(220, 38, 38, 0.12)",
                    border: "1px solid rgba(220, 38, 38, 0.35)",
                    color: "#FCA5A5",
                  }}
                >
                  Burn
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Burn confirmation */}
      <AnimatePresence>
        {burnConfirmOpen && (
          <motion.div
            className="fixed inset-0 z-[110] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="absolute inset-0"
              style={{ background: "rgba(10,17,40,0.7)", backdropFilter: "blur(6px)" }}
              onClick={() => setBurnConfirmOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="relative w-full max-w-[360px] rounded-2xl glass-panel p-6 text-center"
            >
              <div
                className="mx-auto mb-3 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)" }}
              >
                <Flame className="w-4 h-4" style={{ color: "#FCA5A5" }} strokeWidth={1.75} />
              </div>
              <h3 className="text-[14px] text-foreground/90 mb-2">Burn this narrative?</h3>
              <p className="text-[12px] text-muted-foreground mb-5 leading-relaxed">
                This action is irreversible. Your messages will be cryptographically destroyed.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBurnConfirmOpen(false)}
                  className="flex-1 h-10 rounded-full text-[12px] tracking-[0.18em] uppercase glass-panel text-foreground/80"
                >
                  Keep
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBurnConfirmOpen(false);
                    setBurning(true);
                    window.setTimeout(() => {
                      setMessages([]);
                      setBurned(true);
                      setBurning(false);
                      setSettingsOpen(false);
                    }, 500);
                  }}
                  className="flex-1 h-10 rounded-full text-[12px] tracking-[0.18em] uppercase"
                  style={{
                    background: "rgba(220, 38, 38, 0.18)",
                    border: "1px solid rgba(220, 38, 38, 0.45)",
                    color: "#FCA5A5",
                  }}
                >
                  Burn
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SafeHavenChat;