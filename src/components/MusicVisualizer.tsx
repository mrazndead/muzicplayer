import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, Palette, Shapes } from "lucide-react";

type VisualizerShape = "bars" | "circle" | "wave" | "starburst" | "blob";

interface ColorTheme {
  id: string;
  label: string;
  colors: string[];
}

const COLOR_THEMES: ColorTheme[] = [
  { id: "neon", label: "Neon", colors: ["#a855f7", "#ec4899", "#6366f1"] },
  { id: "ocean", label: "Ocean", colors: ["#06b6d4", "#3b82f6", "#8b5cf6"] },
  { id: "fire", label: "Fire", colors: ["#f97316", "#ef4444", "#eab308"] },
  { id: "forest", label: "Forest", colors: ["#22c55e", "#10b981", "#06b6d4"] },
  { id: "sunset", label: "Sunset", colors: ["#f43f5e", "#f97316", "#fbbf24"] },
  { id: "aurora", label: "Aurora", colors: ["#34d399", "#818cf8", "#c084fc"] },
  { id: "candy", label: "Candy", colors: ["#f472b6", "#c084fc", "#60a5fa"] },
  { id: "mono", label: "Mono", colors: ["#e2e8f0", "#94a3b8", "#64748b"] },
];

const SHAPES: { id: VisualizerShape; label: string }[] = [
  { id: "bars", label: "Bars" },
  { id: "circle", label: "Circle" },
  { id: "wave", label: "Wave" },
  { id: "starburst", label: "Starburst" },
  { id: "blob", label: "Blob" },
];

interface MusicVisualizerProps {
  isPlaying: boolean;
}

export function MusicVisualizer({ isPlaying }: MusicVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const barsRef = useRef<number[]>([]);

  const [shape, setShape] = useState<VisualizerShape>("circle");
  const [themeId, setThemeId] = useState("neon");
  const [showSettings, setShowSettings] = useState(false);

  const theme = COLOR_THEMES.find((t) => t.id === themeId) || COLOR_THEMES[0];

  const getGradientColor = useCallback(
    (ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) => {
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      theme.colors.forEach((c, i) => grad.addColorStop(i / (theme.colors.length - 1), c));
      return grad;
    },
    [theme]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const NUM_BARS = 64;
    if (barsRef.current.length !== NUM_BARS) {
      barsRef.current = Array.from({ length: NUM_BARS }, () => 0);
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, w, h);

      if (isPlaying) {
        timeRef.current += 0.02;
      } else {
        timeRef.current += 0.003;
      }
      const t = timeRef.current;

      // Simulate audio data with smooth noise
      for (let i = 0; i < NUM_BARS; i++) {
        const target = isPlaying
          ? 0.3 +
            0.7 *
              (Math.sin(t * 2.5 + i * 0.4) * 0.5 +
                0.5) *
              (Math.cos(t * 1.8 + i * 0.7) * 0.3 + 0.7) *
              (Math.sin(t * 3.2 + i * 0.2) * 0.2 + 0.8)
          : 0.05 + 0.08 * Math.sin(t * 1.5 + i * 0.3);
        barsRef.current[i] += (target - barsRef.current[i]) * 0.12;
      }

      const bars = barsRef.current;
      const cx = w / 2;
      const cy = h / 2;

      switch (shape) {
        case "bars": {
          const barW = w / NUM_BARS - 2;
          for (let i = 0; i < NUM_BARS; i++) {
            const barH = bars[i] * h * 0.7;
            const x = i * (w / NUM_BARS) + 1;
            const colorIdx = i / NUM_BARS;
            const c1 = theme.colors[Math.floor(colorIdx * (theme.colors.length - 1))];
            const c2 = theme.colors[Math.min(Math.floor(colorIdx * (theme.colors.length - 1)) + 1, theme.colors.length - 1)];
            const grad = ctx.createLinearGradient(x, h, x, h - barH);
            grad.addColorStop(0, c1);
            grad.addColorStop(1, c2);
            ctx.fillStyle = grad;
            ctx.shadowBlur = 12;
            ctx.shadowColor = c1;
            ctx.beginPath();
            ctx.roundRect(x, h - barH, barW, barH, [barW / 2, barW / 2, 0, 0]);
            ctx.fill();
            // Mirror
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            ctx.roundRect(x, h, barW, barH * 0.3, [0, 0, barW / 2, barW / 2]);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          ctx.shadowBlur = 0;
          break;
        }
        case "circle": {
          const radius = Math.min(w, h) * 0.25;
          for (let i = 0; i < NUM_BARS; i++) {
            const angle = (i / NUM_BARS) * Math.PI * 2 - Math.PI / 2;
            const len = bars[i] * radius * 1.2;
            const x1 = cx + Math.cos(angle) * radius;
            const y1 = cy + Math.sin(angle) * radius;
            const x2 = cx + Math.cos(angle) * (radius + len);
            const y2 = cy + Math.sin(angle) * (radius + len);
            const colorIdx = i / NUM_BARS;
            const cIdx = Math.floor(colorIdx * (theme.colors.length - 1));
            ctx.strokeStyle = theme.colors[cIdx];
            ctx.lineWidth = 3;
            ctx.shadowBlur = 8;
            ctx.shadowColor = theme.colors[cIdx];
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
          // Inner glow circle
          const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
          innerGrad.addColorStop(0, theme.colors[0] + "30");
          innerGrad.addColorStop(1, "transparent");
          ctx.fillStyle = innerGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          break;
        }
        case "wave": {
          for (let layer = 2; layer >= 0; layer--) {
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let x = 0; x <= w; x += 2) {
              const i = Math.floor((x / w) * (NUM_BARS - 1));
              const val = bars[i];
              const y =
                cy +
                Math.sin(t * 2 + x * 0.02 + layer * 1.5) * val * h * 0.25 +
                Math.cos(t * 1.5 + x * 0.01 + layer) * val * h * 0.1;
              ctx.lineTo(x, y);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            const grad = ctx.createLinearGradient(0, cy - h * 0.3, 0, h);
            grad.addColorStop(0, theme.colors[layer % theme.colors.length] + "80");
            grad.addColorStop(1, theme.colors[layer % theme.colors.length] + "05");
            ctx.fillStyle = grad;
            ctx.shadowBlur = 20;
            ctx.shadowColor = theme.colors[layer % theme.colors.length];
            ctx.fill();
          }
          ctx.shadowBlur = 0;
          break;
        }
        case "starburst": {
          const numRays = 48;
          const maxR = Math.min(w, h) * 0.42;
          for (let i = 0; i < numRays; i++) {
            const angle = (i / numRays) * Math.PI * 2 + t * 0.3;
            const barIdx = Math.floor((i / numRays) * NUM_BARS);
            const len = bars[barIdx] * maxR;
            const cIdx = i % theme.colors.length;

            ctx.strokeStyle = theme.colors[cIdx];
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 15;
            ctx.shadowColor = theme.colors[cIdx];
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
            ctx.stroke();
          }
          // Center glow
          const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.2);
          cg.addColorStop(0, theme.colors[1] + "60");
          cg.addColorStop(1, "transparent");
          ctx.fillStyle = cg;
          ctx.beginPath();
          ctx.arc(cx, cy, maxR * 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          break;
        }
        case "blob": {
          const points = 128;
          const baseR = Math.min(w, h) * 0.2;
          for (let layer = 2; layer >= 0; layer--) {
            ctx.beginPath();
            for (let i = 0; i <= points; i++) {
              const angle = (i / points) * Math.PI * 2;
              const barIdx = Math.floor((i / points) * NUM_BARS);
              const noise = bars[barIdx] * baseR * 0.8;
              const wobble = Math.sin(angle * 3 + t * 2 + layer) * baseR * 0.15;
              const r = baseR + noise + wobble + layer * 15;
              const x = cx + Math.cos(angle) * r;
              const y = cy + Math.sin(angle) * r;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 2);
            grad.addColorStop(0, theme.colors[layer % theme.colors.length] + "50");
            grad.addColorStop(1, theme.colors[layer % theme.colors.length] + "10");
            ctx.fillStyle = grad;
            ctx.shadowBlur = 25;
            ctx.shadowColor = theme.colors[layer % theme.colors.length];
            ctx.fill();
          }
          ctx.shadowBlur = 0;
          break;
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, shape, theme, getGradientColor]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-background/80 border border-border/30">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: "clamp(240px, 50vw, 400px)" }}
      />

      {/* Settings toggle */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="absolute top-3 right-3 p-2 rounded-xl glass text-muted-foreground hover:text-foreground transition-colors z-20"
      >
        <Settings2 className="w-4 h-4" />
      </button>

      {/* Now playing label */}
      {isPlaying && (
        <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full glass text-[10px] uppercase tracking-widest text-primary font-medium">
          ● Live
        </div>
      )}

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-0 inset-x-0 p-4 glass-heavy rounded-t-2xl space-y-3 z-10"
          >
            {/* Shape picker */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Shapes className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Shape</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {SHAPES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setShape(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      shape === s.id
                        ? "gradient-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Palette className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Colors</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {COLOR_THEMES.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() => setThemeId(ct.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      themeId === ct.id
                        ? "ring-2 ring-primary bg-secondary"
                        : "bg-secondary/60 hover:bg-secondary"
                    }`}
                  >
                    <div className="flex -space-x-1">
                      {ct.colors.map((c, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded-full border border-background"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <span className="text-secondary-foreground">{ct.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
