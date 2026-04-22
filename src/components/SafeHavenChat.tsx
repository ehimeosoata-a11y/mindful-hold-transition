import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import ResilienceWave, { type TriageState } from "./ResilienceWave";

type Message = { from: "haven" | "you"; text: string };

const initialMessages: Message[] = [
  { from: "haven", text: "You arrived. Take a moment — there's no rush here." },
  { from: "haven", text: "When you're ready, name one thing that's true right now." },
];

const SafeHavenChat = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [triage, setTriage] = useState<TriageState>("calm");

  useEffect(() => {
    document.documentElement.setAttribute("data-triage", triage);
  }, [triage]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "you", text }]);
    setDraft("");
  };

  return (
    <motion.div
      className="min-h-screen w-full flex justify-center safe-haven-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Mobile-first 480px shell */}
      <div className="relative w-full max-w-[480px] min-h-screen flex flex-col">
        {/* TOP — 10% : Minimal status header */}
        <header
          className="flex items-center justify-between px-6"
          style={{ minHeight: "10vh", paddingTop: "max(env(safe-area-inset-top), 1.25rem)" }}
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

          <button
            type="button"
            aria-label={`Triage: ${triage}. Tap to toggle.`}
            onClick={() => setTriage((s) => (s === "calm" ? "alert" : "calm"))}
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
        </header>

        {/* MIDDLE — 60% : Narrative space */}
        <main
          className="flex-1 px-6 pt-2 pb-4 flex flex-col gap-3 overflow-y-auto"
          style={{ minHeight: "60vh" }}
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
          className="relative w-full overflow-hidden"
          style={{
            height: "30vh",
            zIndex: 10,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
          aria-label="Resilience visualization"
        >
          <ResilienceWave triageState={triage} />
        </section>
      </div>
    </motion.div>
  );
};

export default SafeHavenChat;