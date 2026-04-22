import { motion } from "framer-motion";

/**
 * ResilienceWave — animated SVG band that lives in the bottom Visualization Zone.
 * Uses the live --wave-color / --wave-speed CSS vars so theme transitions are
 * driven entirely by the Resilience Triage tokens (3s cubic-bezier ease).
 */
const ResilienceWave = () => {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
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

      {/* Drifting wave layers */}
      <motion.div
        className="absolute bottom-0 left-0 w-[200%] h-full"
        style={{
          animation: "wave-drift var(--wave-speed) linear infinite",
          opacity: 0.35,
        }}
      >
        <svg
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <path
            d="M0,120 C150,80 300,160 600,110 C900,60 1050,140 1200,100 L1200,200 L0,200 Z"
            fill="var(--wave-color)"
            style={{ transition: "fill 3s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-0 left-0 w-[200%] h-full"
        style={{
          animation: "wave-drift calc(var(--wave-speed) * 1.6) linear infinite reverse",
          opacity: 0.5,
        }}
      >
        <svg
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <path
            d="M0,140 C200,100 400,180 600,130 C800,80 1000,160 1200,120 L1200,200 L0,200 Z"
            fill="var(--wave-color)"
            style={{ transition: "fill 3s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </svg>
      </motion.div>

      {/* Crisp foreground wave with breathing scaleY */}
      <div
        className="absolute bottom-0 left-0 w-[200%] h-full origin-bottom"
        style={{
          animation:
            "wave-drift calc(var(--wave-speed) * 0.8) linear infinite, wave-breathe var(--wave-speed) ease-in-out infinite",
          opacity: "var(--wave-opacity)",
        }}
      >
        <svg
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <path
            d="M0,160 C150,130 350,190 600,150 C850,110 1050,180 1200,150 L1200,200 L0,200 Z"
            fill="var(--wave-color)"
            style={{
              transition: "fill 3s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: "drop-shadow(0 -2px 12px var(--wave-color))",
            }}
          />
        </svg>
      </div>
    </div>
  );
};

export default ResilienceWave;