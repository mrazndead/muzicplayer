import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, Palette, Shapes } from "lucide-react";

type VisualizerShape = "bars" | "circle" | "wave" | "starburst" | "blob" | "dna" | "galaxy" | "matrix" | "rings" | "terrain" | "helix" | "fireworks" | "radar" | "diamonds" | "spectrum";

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
  { id: "cyberpunk", label: "Cyberpunk", colors: ["#00fff5", "#ff00e5", "#ffff00"] },
  { id: "lavender", label: "Lavender", colors: ["#c4b5fd", "#a78bfa", "#7c3aed"] },
  { id: "midnight", label: "Midnight", colors: ["#1e3a5f", "#3b82f6", "#93c5fd"] },
  { id: "tropical", label: "Tropical", colors: ["#f472b6", "#34d399", "#fbbf24"] },
];

const SHAPES: { id: VisualizerShape; label: string }[] = [
  { id: "bars", label: "Bars" },
  { id: "circle", label: "Circle" },
  { id: "wave", label: "Wave" },
  { id: "starburst", label: "Starburst" },
  { id: "blob", label: "Blob" },
  { id: "dna", label: "DNA" },
  { id: "galaxy", label: "Galaxy" },
  { id: "matrix", label: "Matrix" },
  { id: "rings", label: "Rings" },
  { id: "terrain", label: "Terrain" },
  { id: "helix", label: "Helix" },
  { id: "fireworks", label: "Fireworks" },
  { id: "radar", label: "Radar" },
  { id: "diamonds", label: "Diamonds" },
  { id: "spectrum", label: "Spectrum" },
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
        case "dna": {
          const amplitude = Math.min(w, h) * 0.15;
          for (let strand = 0; strand < 2; strand++) {
            ctx.beginPath();
            for (let x = 0; x <= w; x += 2) {
              const i = Math.floor((x / w) * (NUM_BARS - 1));
              const phase = strand * Math.PI;
              const y = cy + Math.sin(t * 2 + x * 0.03 + phase) * (amplitude + bars[i] * amplitude * 0.8);
              if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = theme.colors[strand % theme.colors.length];
            ctx.lineWidth = 3;
            ctx.shadowBlur = 12;
            ctx.shadowColor = theme.colors[strand % theme.colors.length];
            ctx.stroke();
          }
          for (let x = 0; x < w; x += 20) {
            const i = Math.floor((x / w) * (NUM_BARS - 1));
            if (bars[i] > 0.3) {
              const y1 = cy + Math.sin(t * 2 + x * 0.03) * (amplitude + bars[i] * amplitude * 0.8);
              const y2 = cy + Math.sin(t * 2 + x * 0.03 + Math.PI) * (amplitude + bars[i] * amplitude * 0.8);
              ctx.strokeStyle = theme.colors[2 % theme.colors.length] + "60";
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(x, y1);
              ctx.lineTo(x, y2);
              ctx.stroke();
            }
          }
          ctx.shadowBlur = 0;
          break;
        }
        case "galaxy": {
          const arms = 4;
          const maxRG = Math.min(w, h) * 0.4;
          for (let arm = 0; arm < arms; arm++) {
            const baseAngle = (arm / arms) * Math.PI * 2 + t * 0.2;
            for (let i = 0; i < 60; i++) {
              const ratio = i / 60;
              const barIdx = Math.floor(ratio * (NUM_BARS - 1));
              const spiral = ratio * Math.PI * 2.5;
              const r = ratio * maxRG * (0.5 + bars[barIdx] * 0.5);
              const angle = baseAngle + spiral;
              const px = cx + Math.cos(angle) * r;
              const py = cy + Math.sin(angle) * r;
              const size = (1 - ratio) * 4 * (0.5 + bars[barIdx]);
              const a = Math.floor((1 - ratio * 0.5) * 255).toString(16).padStart(2, "0");
              ctx.fillStyle = theme.colors[arm % theme.colors.length] + a;
              ctx.shadowBlur = 6;
              ctx.shadowColor = theme.colors[arm % theme.colors.length];
              ctx.beginPath();
              ctx.arc(px, py, size, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRG * 0.15);
          gg.addColorStop(0, theme.colors[0] + "80");
          gg.addColorStop(1, "transparent");
          ctx.fillStyle = gg;
          ctx.beginPath();
          ctx.arc(cx, cy, maxRG * 0.15, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          break;
        }
        case "matrix": {
          const cols = 32;
          const colW = w / cols;
          for (let c = 0; c < cols; c++) {
            const barIdx = Math.floor((c / cols) * (NUM_BARS - 1));
            const mh = bars[barIdx] * h * 0.8;
            const numDots = Math.floor(mh / 12);
            for (let d = 0; d < numDots; d++) {
              const mx = c * colW + colW / 2;
              const my = h - d * 12;
              const alpha = (1 - d / numDots) * bars[barIdx];
              const a = Math.floor(alpha * 200 + 55).toString(16).padStart(2, "0");
              ctx.fillStyle = theme.colors[0] + a;
              ctx.shadowBlur = 4;
              ctx.shadowColor = theme.colors[0];
              ctx.fillRect(mx - 3, my - 3, 6, 6);
            }
            if (numDots > 0) {
              ctx.fillStyle = theme.colors[1];
              ctx.shadowBlur = 15;
              ctx.shadowColor = theme.colors[1];
              ctx.beginPath();
              ctx.arc(c * colW + colW / 2, h - numDots * 12, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.shadowBlur = 0;
          break;
        }
        case "rings": {
          const numRings = 6;
          const maxRadius = Math.min(w, h) * 0.4;
          for (let r = 0; r < numRings; r++) {
            const barIdx = Math.floor((r / numRings) * NUM_BARS);
            const rr = ((r + 1) / numRings) * maxRadius * (0.6 + bars[barIdx] * 0.4);
            const cIdx = r % theme.colors.length;
            const a = Math.floor((1 - (r / numRings) * 0.5) * 200).toString(16).padStart(2, "0");
            ctx.strokeStyle = theme.colors[cIdx] + a;
            ctx.lineWidth = 2 + bars[barIdx] * 3;
            ctx.shadowBlur = 10 + bars[barIdx] * 15;
            ctx.shadowColor = theme.colors[cIdx];
            ctx.beginPath();
            ctx.arc(cx, cy, rr, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
          break;
        }
        case "terrain": {
          const layers = 5;
          for (let l = layers - 1; l >= 0; l--) {
            ctx.beginPath();
            const baseY = h * 0.4 + l * h * 0.1;
            ctx.moveTo(0, h);
            for (let x = 0; x <= w; x += 3) {
              const i = Math.floor((x / w) * (NUM_BARS - 1));
              const mountain = bars[i] * h * 0.3 * (1 - l * 0.15);
              const y = baseY - mountain + Math.sin(x * 0.01 + t + l * 2) * 15;
              ctx.lineTo(x, y);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            const cIdx = l % theme.colors.length;
            const a = Math.floor((1 - l * 0.15) * 180).toString(16).padStart(2, "0");
            const tg = ctx.createLinearGradient(0, baseY - h * 0.3, 0, h);
            tg.addColorStop(0, theme.colors[cIdx] + a);
            tg.addColorStop(1, theme.colors[cIdx] + "10");
            ctx.fillStyle = tg;
            ctx.shadowBlur = 8;
            ctx.shadowColor = theme.colors[cIdx];
            ctx.fill();
          }
          ctx.shadowBlur = 0;
          break;
        }
        case "helix": {
          const helixR = Math.min(w, h) * 0.18;
          const strands = 3;
          for (let s = 0; s < strands; s++) {
            ctx.beginPath();
            for (let x = 0; x <= w; x += 2) {
              const i = Math.floor((x / w) * (NUM_BARS - 1));
              const phase = (s / strands) * Math.PI * 2;
              const depth = Math.sin(t * 2 + x * 0.025 + phase);
              const y = cy + depth * (helixR + bars[i] * helixR * 0.8);
              if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            const cIdx = s % theme.colors.length;
            ctx.strokeStyle = theme.colors[cIdx];
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 15;
            ctx.shadowColor = theme.colors[cIdx];
            ctx.stroke();
          }
          // Connection dots
          for (let x = 0; x < w; x += 25) {
            const i = Math.floor((x / w) * (NUM_BARS - 1));
            if (bars[i] > 0.35) {
              for (let s = 0; s < strands; s++) {
                const phase = (s / strands) * Math.PI * 2;
                const depth = Math.sin(t * 2 + x * 0.025 + phase);
                const y = cy + depth * (helixR + bars[i] * helixR * 0.8);
                ctx.fillStyle = theme.colors[s % theme.colors.length];
                ctx.beginPath();
                ctx.arc(x, y, 2.5 * bars[i], 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
          ctx.shadowBlur = 0;
          break;
        }
        case "fireworks": {
          const numBursts = 8;
          for (let b = 0; b < numBursts; b++) {
            const barIdx = Math.floor((b / numBursts) * NUM_BARS);
            const val = bars[barIdx];
            const bx = (b + 0.5) / numBursts * w;
            const by = h * 0.3 + Math.sin(t * 0.5 + b * 1.7) * h * 0.15;
            const rays = 16;
            const maxLen = val * Math.min(w, h) * 0.18;
            for (let r = 0; r < rays; r++) {
              const angle = (r / rays) * Math.PI * 2 + t * 0.5 + b;
              const len = maxLen * (0.5 + 0.5 * Math.sin(t * 3 + r + b));
              const cIdx = (b + r) % theme.colors.length;
              const alpha = val * 0.8;
              const a = Math.floor(alpha * 255).toString(16).padStart(2, "0");
              ctx.strokeStyle = theme.colors[cIdx] + a;
              ctx.lineWidth = 2;
              ctx.shadowBlur = 8;
              ctx.shadowColor = theme.colors[cIdx];
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(bx, by);
              ctx.lineTo(bx + Math.cos(angle) * len, by + Math.sin(angle) * len);
              ctx.stroke();
              // Sparkle at tip
              if (val > 0.4) {
                ctx.fillStyle = theme.colors[cIdx];
                ctx.beginPath();
                ctx.arc(bx + Math.cos(angle) * len, by + Math.sin(angle) * len, 1.5, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
          ctx.shadowBlur = 0;
          break;
        }
        case "radar": {
          const radarR = Math.min(w, h) * 0.38;
          // Grid rings
          for (let r = 1; r <= 4; r++) {
            ctx.strokeStyle = theme.colors[0] + "20";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, (r / 4) * radarR, 0, Math.PI * 2);
            ctx.stroke();
          }
          // Sweep line
          const sweepAngle = t * 1.5;
          ctx.strokeStyle = theme.colors[0] + "80";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(sweepAngle) * radarR, cy + Math.sin(sweepAngle) * radarR);
          ctx.stroke();
          // Sweep fade trail
          const sweepGrad = ctx.createConicGradient(sweepAngle - Math.PI * 0.3, cx, cy);
          sweepGrad.addColorStop(0, "transparent");
          sweepGrad.addColorStop(0.15, theme.colors[0] + "25");
          sweepGrad.addColorStop(0.16, "transparent");
          ctx.fillStyle = sweepGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, radarR, 0, Math.PI * 2);
          ctx.fill();
          // Data blips
          for (let i = 0; i < NUM_BARS; i++) {
            const angle = (i / NUM_BARS) * Math.PI * 2;
            const dist = bars[i] * radarR * 0.9;
            const px = cx + Math.cos(angle) * dist;
            const py = cy + Math.sin(angle) * dist;
            const size = 2 + bars[i] * 4;
            const cIdx = i % theme.colors.length;
            ctx.fillStyle = theme.colors[cIdx];
            ctx.shadowBlur = 10;
            ctx.shadowColor = theme.colors[cIdx];
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
          break;
        }
        case "diamonds": {
          const cols = 12;
          const rows = 8;
          const dw = w / cols;
          const dh = h / rows;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const barIdx = Math.floor(((r * cols + c) / (rows * cols)) * (NUM_BARS - 1));
              const val = bars[barIdx];
              const dx = c * dw + dw / 2;
              const dy = r * dh + dh / 2;
              const size = (dw * 0.3 + val * dw * 0.35);
              const cIdx = (r + c) % theme.colors.length;
              const alpha = 0.2 + val * 0.7;
              const a = Math.floor(alpha * 255).toString(16).padStart(2, "0");
              ctx.fillStyle = theme.colors[cIdx] + a;
              ctx.shadowBlur = val * 12;
              ctx.shadowColor = theme.colors[cIdx];
              ctx.save();
              ctx.translate(dx, dy);
              ctx.rotate(Math.PI / 4 + Math.sin(t + r + c) * 0.1);
              ctx.fillRect(-size / 2, -size / 2, size, size);
              ctx.restore();
            }
          }
          ctx.shadowBlur = 0;
          break;
        }
        case "spectrum": {
          // Mirrored spectrum analyzer
          const barW2 = w / NUM_BARS;
          for (let i = 0; i < NUM_BARS; i++) {
            const barH = bars[i] * h * 0.4;
            const x = i * barW2;
            const cIdx = Math.floor((i / NUM_BARS) * (theme.colors.length - 1));
            const c1 = theme.colors[cIdx];
            const c2 = theme.colors[Math.min(cIdx + 1, theme.colors.length - 1)];
            // Top half
            const grad1 = ctx.createLinearGradient(x, cy, x, cy - barH);
            grad1.addColorStop(0, c1 + "40");
            grad1.addColorStop(1, c2);
            ctx.fillStyle = grad1;
            ctx.shadowBlur = 6;
            ctx.shadowColor = c1;
            ctx.fillRect(x + 1, cy - barH, barW2 - 2, barH);
            // Bottom half (mirror)
            const grad2 = ctx.createLinearGradient(x, cy, x, cy + barH);
            grad2.addColorStop(0, c1 + "40");
            grad2.addColorStop(1, c2);
            ctx.fillStyle = grad2;
            ctx.fillRect(x + 1, cy, barW2 - 2, barH);
          }
          // Center line
          ctx.strokeStyle = theme.colors[0] + "60";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, cy);
          ctx.lineTo(w, cy);
          ctx.stroke();
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

      {/* Settings panel - full overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 p-4 bg-background/90 backdrop-blur-xl rounded-3xl z-10 flex flex-col gap-4 overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-widest">Visualizer Settings</span>
              <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <Settings2 className="w-4 h-4" />
              </button>
            </div>

            {/* Shape picker */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Shapes className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Shape</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {SHAPES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setShape(s.id)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
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
              <div className="grid grid-cols-4 gap-1.5">
                {COLOR_THEMES.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() => setThemeId(ct.id)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
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
