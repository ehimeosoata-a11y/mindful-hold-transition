import { motion } from "framer-motion";

const messages = [
  { from: "haven", text: "You arrived. Take a moment — there's no rush here." },
];

const SafeHavenChat = () => {
  return (
    <motion.div
      className="min-h-screen nexilo-bg flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <header className="px-6 pt-8 pb-4 flex items-center justify-between border-b border-border/40">
        <div className="flex flex-col">
          <span className="text-foreground text-sm tracking-[0.3em]">NEXILO</span>
          <span className="text-muted-foreground text-[10px] tracking-[0.25em] uppercase">
            Safe Haven
          </span>
        </div>
        <div
          aria-hidden
          className="w-2.5 h-2.5 rounded-full bg-primary"
          style={{ boxShadow: "0 0 12px hsla(160, 84%, 55%, 0.7)" }}
        />
      </header>

      <main className="flex-1 px-6 py-8 flex flex-col gap-4 overflow-y-auto">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.2, duration: 0.6 }}
            className="max-w-[80%] rounded-2xl bg-card text-card-foreground px-4 py-3 text-sm leading-relaxed border border-border/40"
          >
            {m.text}
          </motion.div>
        ))}
      </main>

      <footer className="px-6 pb-8 pt-4 border-t border-border/40">
        <div className="flex items-center gap-3 rounded-full bg-card border border-border/60 px-4 py-3">
          <input
            type="text"
            placeholder="Say what's true right now…"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="button"
            className="text-xs tracking-[0.2em] uppercase text-primary hover:opacity-80 transition"
          >
            Send
          </button>
        </div>
      </footer>
    </motion.div>
  );
};

export default SafeHavenChat;