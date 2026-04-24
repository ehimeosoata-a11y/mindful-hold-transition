import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Lock, Settings2, Flame, ShieldCheck, Activity } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import ResilienceWave, { type TriageState } from "./ResilienceWave";
import HistoricalPulse, { type PulseDatum } from "./HistoricalPulse";

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
  const narrativeRef = useRef<HTMLElement>(null);

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
        {/* TOP — 10% : Sticky minimal status header */}
        <header
          className="sticky top-0 z-50 flex items-center justify-between px-6 nexilo-shell-bg"
          style={{
            flex: "0 0 10%",
            minHeight: "64px",
            paddingTop: "max(env(safe-area-inset-top), 0.75rem)",
          }}
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="w-2 h-2 rounded-full"
              style={{
                background: "var(--wave-color)",
                boxShadow: "0 0 10px var(--wave-color)",
                transition: "background 3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
            <div className="flex flex-col leading-tight">
              <span className="text-foreground text-[11px] font-medium tracking-[0.32em]">NEXILO</span>
              <span className="text-muted-foreground text-[9px] tracking-[0.25em] uppercase">Safe Haven</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* NDPR Trust Badge — pill, semi-transparent, padlock + residency */}
            <div
              className="hidden sm:flex items-center gap-1.5 h-7 pl-2 pr-3 rounded-full"
              style={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              aria-label="NDPR Encrypted, Lagos data residency"
            >
              <Lock className="w-3 h-3 text-foreground/70" strokeWidth={1.75} />
              <span className="text-[9px] font-light tracking-[0.18em] uppercase text-foreground/70">
                NDPR Encrypted · Lagos
              </span>
            </div>

            <button
              type="button"
              aria-label={`Triage: ${triage}. Tap to cycle.`}
              onClick={() =>
                setTriage((s) =>
                  s === "calm" ? "alert" : s === "alert" ? "crisis" : "calm",
                )
              }
              className="px-3 h-9 rounded-full glass-panel flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-foreground/80 hover:text-foreground transition-colors"
            >
              <span
                aria-hidden
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "var(--wave-color)",
                  boxShadow: "0 0 8px var(--wave-color)",
                  transition: "background 3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
              {triage}
            </button>

            <button
              type="button"
              aria-label="Open settings"
              onClick={() => setSettingsOpen(true)}
              className="w-9 h-9 rounded-full glass-panel flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
            >
              <Settings2 className="w-4 h-4" strokeWidth={1.75} />
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
                  ? "self-start max-w-[82%] rounded-2xl rounded-bl-md glass-panel px-4 py-3 text-[14px] leading-relaxed text-foreground/90"
                  : "self-end max-w-[82%] rounded-2xl rounded-br-md px-4 py-3 text-[14px] leading-relaxed text-primary-foreground"
              }
              style={
                m.from === "you"
                  ? {
                      background: "var(--wave-color)",
                      transition: "background 3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }
                  : undefined
              }
            >
              {m.text}
            </motion.div>
          ))}

          {/* The Constant Thread — 7-day historical pulse */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="mt-2 rounded-2xl glass-panel px-3 py-3"
            style={{ pointerEvents: "auto" }}
          >
            <div className="px-2 pb-2 flex items-center justify-between">
              <span className="text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
                The Constant Thread
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70">
                7 days
              </span>
            </div>
            <HistoricalPulse data={samplePulse} />
          </motion.div>
          </motion.div>
          )}
        </main>

        {/* Composer sits above the visualization zone */}
        <div className="px-6 pb-3 relative z-20">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 rounded-full glass-panel pl-5 pr-2 py-2"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
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

        {/* BOTTOM — 30% : Visualization zone (Resilience Wave) */}
        <section
          className="relative w-full overflow-hidden pointer-events-none"
          style={{
            flex: keyboardOpen ? "0 0 0px" : "0 0 30%",
            zIndex: 0,
            opacity: keyboardOpen ? 0 : 1,
            transition: "flex-basis 0.35s ease, opacity 0.35s ease",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
          aria-label="Resilience visualization"
        >
          <ResilienceWave triageState={triage} />
        </section>
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