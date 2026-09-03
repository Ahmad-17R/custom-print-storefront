import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Type, Image as ImageIcon, Square, Trash2, Copy,
  ChevronUp, ChevronDown, Download, RotateCw, Undo2, Redo2,
  ZoomIn, ZoomOut, Maximize2, Eye, EyeOff, AlignLeft, AlignCenter,
  AlignRight, Bold, Italic, Underline, FlipHorizontal, FlipVertical,
  Layers, Palette, ShoppingCart,
} from "lucide-react";
import { TEMPLATES } from "./templates";
import type { Layer, TextLayer, ImageLayer, ShapeLayer, DragState, DragMode, GradientConfig } from "./types";

const PX_PER_MM = 4;

const FONTS = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Helvetica Neue", value: "'Helvetica Neue', Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Impact", value: "Impact, fantasy" },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Poppins", value: "Poppins, sans-serif" },
  { label: "Lato", value: "Lato, sans-serif" },
];

const BG_PRESETS = [
  "#ffffff", "#000000", "#1e3a5f", "#2563EB", "#16a34a",
  "#dc2626", "#ea580c", "#ca8a04", "#7c3aed", "#db2777",
  "#f8fafc", "#1e293b", "#f0fdf4", "#fef2f2", "#fefce8",
];

// ── Gradient helpers ──────────────────────────────────────────────────────────


function gradientToCss(g: GradientConfig): string {
  const stops = g.stops.map((s) => `${s.color} ${s.position}%`).join(", ");
  return g.type === "radial"
    ? `radial-gradient(circle at center, ${stops})`
    : `linear-gradient(${g.angle}deg, ${stops})`;
}

function applyGradientToCanvas(
  ctx: CanvasRenderingContext2D,
  g: GradientConfig,
  w: number,
  h: number,
  x = 0,
  y = 0
) {
  let grad: CanvasGradient;
  if (g.type === "radial") {
    const cx = x + w / 2, cy = y + h / 2;
    grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) / 2);
  } else {
    const rad = ((g.angle - 90) * Math.PI) / 180;
    const dx = Math.cos(rad) * w / 2, dy = Math.sin(rad) * h / 2;
    grad = ctx.createLinearGradient(x + w / 2 - dx, y + h / 2 - dy, x + w / 2 + dx, y + h / 2 + dy);
  }
  g.stops.forEach((s) => grad.addColorStop(s.position / 100, s.color));
  return grad;
}

const DEFAULT_GRADIENT: GradientConfig = {
  type: "linear",
  angle: 135,
  stops: [{ color: "#6366f1", position: 0 }, { color: "#ec4899", position: 100 }],
};

// ── GradientEditor sub-component ─────────────────────────────────────────────

function GradientEditor({ gradient, onChange }: { gradient: GradientConfig; onChange: (g: GradientConfig) => void }) {
  const presetDirections = [
    { label: "→", angle: 90 },
    { label: "↓", angle: 180 },
    { label: "↗", angle: 45 },
    { label: "↘", angle: 135 },
  ];

  const previewStyle: React.CSSProperties = {
    width: "100%",
    height: 32,
    borderRadius: 6,
    background: gradientToCss(gradient),
    marginBottom: 10,
    border: "1px solid #E5E7EB",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Live preview */}
      <div style={previewStyle} />

      {/* Type toggle */}
      <div style={{ display: "flex", gap: 4 }}>
        {(["linear", "radial"] as const).map((t) => (
          <button key={t} onClick={() => onChange({ ...gradient, type: t })}
            style={{ flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 600, border: "1.5px solid #D1D5DB", borderRadius: 6, cursor: "pointer", textTransform: "capitalize",
              background: gradient.type === t ? "#2563EB" : "#fff", color: gradient.type === t ? "#fff" : "#374151" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Direction presets + angle (linear only) */}
      {gradient.type === "linear" && (
        <>
          <div>
            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 5 }}>Direction</div>
            <div style={{ display: "flex", gap: 4 }}>
              {presetDirections.map((p) => (
                <button key={p.angle} onClick={() => onChange({ ...gradient, angle: p.angle })}
                  style={{ flex: 1, padding: "5px 0", fontSize: 14, border: "1.5px solid #D1D5DB", borderRadius: 6, cursor: "pointer",
                    background: gradient.angle === p.angle ? "#EFF6FF" : "#fff",
                    borderColor: gradient.angle === p.angle ? "#2563EB" : "#D1D5DB",
                    color: gradient.angle === p.angle ? "#2563EB" : "#374151" }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 3 }}>Angle — {gradient.angle}°</div>
            <input type="range" min={0} max={360} value={gradient.angle} style={{ width: "100%" }}
              onChange={(e) => onChange({ ...gradient, angle: Number(e.target.value) })} />
          </div>
        </>
      )}

      {/* Color stops */}
      <div>
        <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 6 }}>Colors</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {gradient.stops.map((stop, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="color" value={stop.color}
                style={{ width: 32, height: 28, border: "1.5px solid #D1D5DB", borderRadius: 5, padding: 2, cursor: "pointer", background: "none" }}
                onChange={(e) => {
                  const newStops = gradient.stops.map((s, idx) => idx === i ? { ...s, color: e.target.value } : s);
                  onChange({ ...gradient, stops: newStops });
                }} />
              <span style={{ fontSize: 11, color: "#6B7280", fontFamily: "monospace", minWidth: 52 }}>{stop.color}</span>
              <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: "auto" }}>{i === 0 ? "Start" : "End"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

type ToolTab = "text" | "image" | "shape" | "background" | "layers";

interface ProductEditorProps {
  initialProductType?: string;
}

export default function ProductEditor({ initialProductType = "business_card" }: ProductEditorProps) {
  const [productType, setProductType] = useState(initialProductType);
  const template = TEMPLATES[productType];
  const [activeZoneId, setActiveZoneId] = useState(template.zones[0].id);
  const [layersByZone, setLayersByZone] = useState<Record<string, Layer[]>>({});
  const [bgByZone, setBgByZone] = useState<Record<string, string>>({});
  const [bgGradientByZone, setBgGradientByZone] = useState<Record<string, GradientConfig | null>>({});
  const [bgImageByZone, setBgImageByZone] = useState<Record<string, string | null>>({});
  const [bgModeByZone, setBgModeByZone] = useState<Record<string, "Solid" | "Gradient" | "Image">>({});
  const [bgImageTransformByZone, setBgImageTransformByZone] = useState<Record<string, { scale: number; offsetX: number; offsetY: number }>>({});
  const bgDragState = useRef<{ startX: number; startY: number; origOffX: number; origOffY: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ToolTab>("text");
  const [zoom, setZoom] = useState(1);


  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<DragState | null>(null);
  const idCounter = useRef(1);
  const nextId = () => `layer_${idCounter.current++}`;

  useEffect(() => {
    const t = TEMPLATES[productType];
    setActiveZoneId(t.zones[0].id);
    setSelectedId(null);
  }, [productType]);

  const zone = template.zones.find((z) => z.id === activeZoneId)!;
  const zoneKey = `${productType}:${activeZoneId}`;
  const layers = layersByZone[zoneKey] || [];
  const canvasBg = bgByZone[zoneKey] || "#ffffff";
  const canvasBgGradient = bgGradientByZone[zoneKey] ?? null;
  const canvasBgImage = bgImageByZone[zoneKey] ?? null;
  const canvasBgTransform = bgImageTransformByZone[zoneKey] ?? { scale: 100, offsetX: 50, offsetY: 50 };

  const canvasW = zone.width * PX_PER_MM;
  const canvasH = zone.height * PX_PER_MM;
  const safetyPx = (zone.bleed + zone.safety) * PX_PER_MM;

  const setLayers = (updater: Layer[] | ((cur: Layer[]) => Layer[])) => {
    setLayersByZone((prev) => {
      const current = prev[zoneKey] || [];
      const updated = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [zoneKey]: updated };
    });
  };

  // ── Add layers ────────────────────────────────────────────────────────────

  const addTextLayer = () => {
    const id = nextId();
    const layer: TextLayer = {
      id, type: "text",
      x: canvasW / 2 - 70, y: canvasH / 2 - 16,
      w: 140, h: 32, rotation: 0, z: layers.length,
      opacity: 1, visible: true,
      text: "Your text",
      fontSize: 18, color: "#1a1a1a",
      fontFamily: "Arial, sans-serif",
      fontWeight: "normal", fontStyle: "normal",
      textDecoration: "none", textAlign: "center",
    };
    setLayers((cur) => [...cur, layer]);
    setSelectedId(id);
    setActiveTab("text");
  };

  const addImageLayer = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const id = nextId();
        const maxW = canvasW * 0.5;
        const scale = Math.min(1, maxW / img.width);
        const layer: ImageLayer = {
          id, type: "image",
          x: canvasW / 2 - (img.width * scale) / 2,
          y: canvasH / 2 - (img.height * scale) / 2,
          w: img.width * scale, h: img.height * scale,
          rotation: 0, z: layers.length,
          opacity: 1, visible: true,
          src, flipH: false, flipV: false, objectFit: "contain", borderRadius: 0,
        };
        setLayers((cur) => [...cur, layer]);
        setSelectedId(id);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const addShapeLayer = (kind: "rect" | "circle") => {
    const id = nextId();
    const size = Math.min(canvasW, canvasH) * 0.35;
    const layer: ShapeLayer = {
      id, type: "shape",
      x: canvasW / 2 - size / 2, y: canvasH / 2 - size / 2,
      w: kind === "rect" ? size * 1.6 : size,
      h: size,
      rotation: 0, z: layers.length,
      opacity: 1, visible: true,
      fill: "#2563EB",
      gradient: null,
      borderRadius: kind === "circle" ? 9999 : 0,
    };
    setLayers((cur) => [...cur, layer]);
    setSelectedId(id);
    setActiveTab("shape");
  };

  // ── Mutate layers ─────────────────────────────────────────────────────────

  const updateLayer = (id: string, patch: Partial<Layer>) => {
    setLayers((cur) => cur.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)));
  };

  const removeLayer = (id: string) => {
    setLayers((cur) => cur.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateLayer = (id: string) => {
    const l = layers.find((x) => x.id === id);
    if (!l) return;
    const copy: Layer = { ...l, id: nextId(), x: l.x + 12, y: l.y + 12, z: layers.length };
    setLayers((cur) => [...cur, copy]);
    setSelectedId(copy.id);
  };

  const reorder = (id: string, dir: "up" | "down") => {
    setLayers((cur) => {
      const sorted = [...cur].sort((a, b) => a.z - b.z);
      const idx = sorted.findIndex((l) => l.id === id);
      const swapIdx = dir === "up" ? idx + 1 : idx - 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return cur;
      const tmp = sorted[idx].z;
      sorted[idx].z = sorted[swapIdx].z;
      sorted[swapIdx].z = tmp;
      return sorted;
    });
  };

  // ── Pointer / drag ────────────────────────────────────────────────────────

  const onPointerDownLayer = (e: React.PointerEvent, layer: Layer, mode: DragMode) => {
    e.stopPropagation();
    setSelectedId(layer.id);
    const rect = canvasRef.current!.getBoundingClientRect();
    dragState.current = {
      mode, id: layer.id,
      startX: e.clientX, startY: e.clientY,
      orig: { ...layer },
      rectLeft: rect.left, rectTop: rect.top,
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const onPointerMove = useCallback((e: PointerEvent) => {
    const ds = dragState.current;
    if (!ds) return;
    const dx = (e.clientX - ds.startX) / zoom;
    const dy = (e.clientY - ds.startY) / zoom;
    if (ds.mode === "move") {
      updateLayer(ds.id, { x: ds.orig.x + dx, y: ds.orig.y + dy });
    } else if (ds.mode === "resize") {
      updateLayer(ds.id, { w: Math.max(20, ds.orig.w + dx), h: Math.max(16, ds.orig.h + dy) });
    } else if (ds.mode === "rotate") {
      const cx = ds.rectLeft + (ds.orig.x + ds.orig.w / 2) * zoom;
      const cy = ds.rectTop + (ds.orig.y + ds.orig.h / 2) * zoom;
      const angle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
      updateLayer(ds.id, { rotation: Math.round(angle + 90) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  const onPointerUp = useCallback(() => {
    dragState.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDownBgImage = (e: React.PointerEvent) => {
    e.stopPropagation();
    const t = bgImageTransformByZone[zoneKey] ?? { scale: 100, offsetX: 50, offsetY: 50 };
    bgDragState.current = { startX: e.clientX, startY: e.clientY, origOffX: t.offsetX, origOffY: t.offsetY };
    const onMove = (ev: PointerEvent) => {
      const bd = bgDragState.current;
      if (!bd) return;
      // Convert pixel drag to % offset — smaller canvas → bigger % per px
      const dx = ((ev.clientX - bd.startX) / canvasW) * 100 / zoom;
      const dy = ((ev.clientY - bd.startY) / canvasH) * 100 / zoom;
      setBgImageTransformByZone((p) => {
        const prev = p[zoneKey] ?? { scale: 100, offsetX: 50, offsetY: 50 };
        return { ...p, [zoneKey]: { ...prev, offsetX: Math.max(0, Math.min(100, bd.origOffX - dx)), offsetY: Math.max(0, Math.min(100, bd.origOffY - dy)) } };
      });
    };
    const onUp = () => {
      bgDragState.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const selected = layers.find((l) => l.id === selectedId) || null;

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    const mmToExportPx = template.dpi / 25.4;
    const outW = Math.round(zone.width * mmToExportPx);
    const outH = Math.round(zone.height * mmToExportPx);
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d")!;
    const scale = outW / canvasW;

    // Clip to canvas shape
    ctx.save();
    ctx.beginPath();
    if (template.canvasShape === "circle" || template.canvasShape === "oval") {
      ctx.ellipse(outW / 2, outH / 2, outW / 2, outH / 2, 0, 0, Math.PI * 2);
    } else if (template.canvasShape === "rounded") {
      const r = (template.cornerRadius ?? 4) * (template.dpi / 25.4);
      (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void })
        .roundRect(0, 0, outW, outH, r);
    } else {
      ctx.rect(0, 0, outW, outH);
    }
    ctx.clip();

    // Background
    if (canvasBgImage) {
      await new Promise<void>((res) => {
        const img = new Image();
        img.onload = () => {
          const t = canvasBgTransform;
          // Replicate CSS background-size % + background-position %
          const cssScale = t.scale / 100;
          // background-size: N% means the image width = container width * N/100
          const dw = outW * cssScale;
          const dh = (img.height / img.width) * dw;
          // background-position %: offset = (container - image) * pct/100
          const dx = (outW - dw) * (t.offsetX / 100);
          const dy = (outH - dh) * (t.offsetY / 100);
          ctx.drawImage(img, dx, dy, dw, dh);
          res();
        };
        img.onerror = () => res();
        img.src = canvasBgImage;
      });
    } else {
      ctx.fillStyle = canvasBgGradient
        ? applyGradientToCanvas(ctx, canvasBgGradient, outW, outH)
        : canvasBg;
      ctx.fillRect(0, 0, outW, outH);
    }

    const sorted = [...layers].filter((l) => l.visible).sort((a, b) => a.z - b.z);
    let pending = sorted.filter((l) => l.type === "image").length;

    const drawNonImage = () => {
      sorted.forEach((l) => {
        ctx.save();
        ctx.globalAlpha = l.opacity;
        ctx.translate((l.x + l.w / 2) * scale, (l.y + l.h / 2) * scale);
        ctx.rotate((l.rotation * Math.PI) / 180);

        if (l.type === "shape") {
          ctx.fillStyle = l.gradient
            ? applyGradientToCanvas(ctx, l.gradient, l.w * scale, l.h * scale, -(l.w / 2) * scale, -(l.h / 2) * scale)
            : l.fill;
          const rx = (l.w / 2) * scale;
          const ry = (l.h / 2) * scale;
          const r = Math.min(l.borderRadius * scale, rx, ry);
          ctx.beginPath();
          if ((ctx as CanvasRenderingContext2D & { roundRect?: (...a: unknown[]) => void }).roundRect) {
            (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void })
              .roundRect(-rx, -ry, rx * 2, ry * 2, r);
          } else {
            ctx.rect(-rx, -ry, rx * 2, ry * 2);
          }
          ctx.fill();
        } else if (l.type === "text") {
          const style = `${l.fontStyle} ${l.fontWeight} ${l.fontSize * scale}px ${l.fontFamily}`;
          ctx.font = style;
          ctx.fillStyle = l.color;
          ctx.textAlign = l.textAlign as CanvasTextAlign;
          ctx.textBaseline = "middle";
          if (l.textDecoration === "underline") {
            const metrics = ctx.measureText(l.text);
            const tw = metrics.width;
            const tx = l.textAlign === "center" ? -tw / 2 : l.textAlign === "right" ? -tw : 0;
            ctx.fillRect(tx, l.fontSize * scale * 0.6, tw, Math.max(1, l.fontSize * scale * 0.08));
          }
          const tx = l.textAlign === "center" ? 0 : l.textAlign === "right" ? (l.w / 2) * scale : -(l.w / 2) * scale;
          ctx.fillText(l.text, tx, 0);
        }
        ctx.restore();
      });
    };

    if (pending === 0) { drawNonImage(); ctx.restore(); triggerDownload(canvas); return; }

    const imgLayers = sorted.filter((l) => l.type === "image") as ImageLayer[];
    imgLayers.forEach((l) => {
      const img = new window.Image();
      img.onload = () => {
        ctx.save();
        ctx.globalAlpha = l.opacity;
        ctx.translate((l.x + l.w / 2) * scale, (l.y + l.h / 2) * scale);
        ctx.rotate((l.rotation * Math.PI) / 180);
        ctx.scale(l.flipH ? -1 : 1, l.flipV ? -1 : 1);
        if (l.borderRadius > 0) {
          const rw = (l.w / 2) * scale;
          const rh = (l.h / 2) * scale;
          const rx = Math.min((l.borderRadius / 100) * rw, rw);
          const ry = Math.min((l.borderRadius / 100) * rh, rh);
          ctx.beginPath();
          ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
          if (l.borderRadius >= 50) {
            ctx.clip();
          } else {
            ctx.beginPath();
            (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, radii: number[]) => void })
              .roundRect(-rw, -rh, rw * 2, rh * 2, [Math.min(rx, ry)]);
            ctx.clip();
          }
        }
        ctx.drawImage(img, -(l.w / 2) * scale, -(l.h / 2) * scale, l.w * scale, l.h * scale);
        ctx.restore();
        pending -= 1;
        if (pending === 0) { drawNonImage(); ctx.restore(); triggerDownload(canvas); }
      };
      img.src = l.src;
    });
  };

  const triggerDownload = (canvas: HTMLCanvasElement) => {
    const link = document.createElement("a");
    link.download = `${productType}_${zone.id}_${template.dpi}dpi.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // ── Canvas shape ──────────────────────────────────────────────────────────

  const canvasBorderRadius = (() => {
    switch (template.canvasShape) {
      case "circle":
      case "oval":
        return "50%";
      case "rounded":
        return `${(template.cornerRadius ?? 4) * PX_PER_MM}px`;
      default:
        return "0";
    }
  })();

  // ── Render ────────────────────────────────────────────────────────────────

  const sortedLayers = [...layers].sort((a, b) => a.z - b.z);

  return (
    <div style={s.root}>

      {/* ── TOP BAR ── */}
      <header style={s.topBar}>
        <select value={productType} onChange={(e) => setProductType(e.target.value)} style={s.productSelect}>
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <option key={key} value={key}>{t.label}</option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 3 }}>
          <button disabled style={{ ...s.iconBtn, color: "#C4C9D4" }} title="Undo — coming soon"><Undo2 size={14} /></button>
          <button disabled style={{ ...s.iconBtn, color: "#C4C9D4" }} title="Redo — coming soon"><Redo2 size={14} /></button>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#8C93A0" }}>{zone.width}×{zone.height} mm · {template.dpi} DPI</span>
          <span style={{ fontSize: 12, color: "#8C93A0" }}>From AED {template.basePrice}</span>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={s.body}>

        {/* ── LEFT PANEL ── */}
        <aside style={s.leftPanel}>

          {/* Tab strip */}
          <div style={s.tabStrip}>
            {([
              { id: "text",       icon: <Type size={14} />,       label: "Text" },
              { id: "image",      icon: <ImageIcon size={14} />,  label: "Image" },
              { id: "shape",      icon: <Square size={14} />,     label: "Shape" },
              { id: "background", icon: <Palette size={14} />,    label: "BG" },
              { id: "layers",     icon: <Layers size={14} />,     label: "Layers" },
            ] as { id: ToolTab; icon: React.ReactNode; label: string }[]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...s.tab,
                  color: activeTab === tab.id ? "#2563EB" : "#6B7280",
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  borderBottom: activeTab === tab.id ? "2px solid #2563EB" : "2px solid transparent",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tool area — add actions */}
          <div style={s.toolArea}>

            {activeTab === "text" && (
              <>
                <button onClick={addTextLayer} style={s.primaryBtn}><Type size={14} /> Add text</button>
                <p style={s.hint}>Select a text layer to edit font, style, alignment, and color.</p>
              </>
            )}

            {activeTab === "image" && (
              <>
                <label style={{ ...s.primaryBtn, cursor: "pointer" }}>
                  <ImageIcon size={14} /> Upload image
                  <input type="file" accept="image/*" style={{ display: "none" }}
                    onChange={(e) => e.target.files?.[0] && addImageLayer(e.target.files[0])} />
                </label>
                <p style={s.hint}>PNG, JPG, or SVG. Drag, resize, rotate, flip — or swap the fit mode.</p>
              </>
            )}

            {activeTab === "shape" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => addShapeLayer("rect")} style={s.primaryBtn}><Square size={14} /> Add rectangle</button>
                <button onClick={() => addShapeLayer("circle")} style={{ ...s.primaryBtn, background: "#6B7280" }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #fff", flexShrink: 0 }} />
                  Add circle / oval
                </button>
                <p style={s.hint}>Select a shape to change fill color, corner radius, and opacity.</p>
              </div>
            )}

            {activeTab === "background" && (() => {
              const bgMode = bgModeByZone[zoneKey] ?? "Solid";
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Solid / Gradient / Image toggle */}
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["Solid", "Gradient", "Image"] as const).map((mode) => (
                      <button key={mode}
                        onClick={() => {
                          setBgModeByZone((p) => ({ ...p, [zoneKey]: mode }));
                          if (mode === "Gradient" && !canvasBgGradient)
                            setBgGradientByZone((p) => ({ ...p, [zoneKey]: { ...DEFAULT_GRADIENT } }));
                          if (mode !== "Gradient")
                            setBgGradientByZone((p) => ({ ...p, [zoneKey]: null }));
                          if (mode !== "Image")
                            setBgImageByZone((p) => ({ ...p, [zoneKey]: null }));
                        }}
                        style={{ ...s.toggleBtn, flex: 1, fontSize: 11, background: bgMode === mode ? "#2563EB" : "#fff", color: bgMode === mode ? "#fff" : "#374151" }}>
                        {mode}
                      </button>
                    ))}
                  </div>

                  {bgMode === "Solid" && (
                    <>
                      <label style={s.fieldLabel}>Color</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="color" value={canvasBg}
                          onChange={(e) => setBgByZone((p) => ({ ...p, [zoneKey]: e.target.value }))}
                          style={{ width: 36, height: 28, border: "1px solid #D1D5DB", borderRadius: 4, padding: 2, cursor: "pointer" }} />
                        <span style={{ fontSize: 12, color: "#6B7280", fontFamily: "monospace" }}>{canvasBg}</span>
                      </div>
                      <label style={s.fieldLabel}>Presets</label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5 }}>
                        {BG_PRESETS.map((c) => (
                          <button key={c} onClick={() => setBgByZone((p) => ({ ...p, [zoneKey]: c }))} title={c}
                            style={{ width: "100%", aspectRatio: "1", borderRadius: 5, background: c, border: canvasBg === c ? "2.5px solid #2563EB" : "1.5px solid #D1D5DB", cursor: "pointer" }} />
                        ))}
                      </div>
                      <button onClick={() => setBgByZone((p) => ({ ...p, [zoneKey]: "#ffffff" }))} style={{ ...s.secondaryBtn, marginTop: 2 }}>
                        Reset to white
                      </button>
                    </>
                  )}

                  {bgMode === "Gradient" && canvasBgGradient && (
                    <GradientEditor
                      gradient={canvasBgGradient}
                      onChange={(g) => setBgGradientByZone((p) => ({ ...p, [zoneKey]: g }))}
                    />
                  )}

                  {bgMode === "Image" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {canvasBgImage ? (
                        <>
                          <div style={{ width: "100%", height: 72, borderRadius: 8, overflow: "hidden", border: "1.5px solid #E5E7EB", backgroundImage: `url(${canvasBgImage})`, backgroundSize: `${canvasBgTransform.scale}%`, backgroundPosition: `${canvasBgTransform.offsetX}% ${canvasBgTransform.offsetY}%` }} />

                          <div>
                            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 3 }}>Zoom — {canvasBgTransform.scale}%</div>
                            <input type="range" min={100} max={300} value={canvasBgTransform.scale} style={{ width: "100%" }}
                              onChange={(e) => setBgImageTransformByZone((p) => ({ ...p, [zoneKey]: { ...canvasBgTransform, scale: Number(e.target.value) } }))} />
                          </div>

                          <p style={{ margin: 0, fontSize: 11, color: "#6B7280", lineHeight: 1.4 }}>
                            Drag directly on the card to reposition the image.
                          </p>

                          <button onClick={() => {
                            setBgImageByZone((p) => ({ ...p, [zoneKey]: null }));
                            setBgImageTransformByZone((p) => ({ ...p, [zoneKey]: { scale: 100, offsetX: 50, offsetY: 50 } }));
                          }} style={{ ...s.secondaryBtn }}>
                            Remove image
                          </button>
                        </>
                      ) : (
                        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, border: "2px dashed #D1D5DB", borderRadius: 10, padding: "20px 12px", cursor: "pointer", color: "#6B7280", fontSize: 12, textAlign: "center" }}>
                          <span style={{ fontSize: 24 }}>🖼</span>
                          <span>Click to upload image</span>
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>JPG, PNG, WEBP — fills the background</span>
                          <input type="file" accept="image/*" style={{ display: "none" }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const dataUrl = ev.target?.result as string;
                                setBgImageByZone((p) => ({ ...p, [zoneKey]: dataUrl }));
                                setBgImageTransformByZone((p) => ({ ...p, [zoneKey]: { scale: 100, offsetX: 50, offsetY: 50 } }));
                              };
                              reader.readAsDataURL(file);
                            }} />
                        </label>
                      )}
                      {!canvasBgImage && (
                        <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF", lineHeight: 1.4 }}>
                          Circle &amp; oval cards clip the image to shape automatically.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {activeTab === "layers" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {layers.length === 0 && <p style={s.hint}>No layers yet. Add text, images, or shapes.</p>}
                {[...layers].sort((a, b) => b.z - a.z).map((l) => (
                  <div
                    key={l.id}
                    onClick={() => setSelectedId(l.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "6px 8px", borderRadius: 6, cursor: "pointer",
                      background: selectedId === l.id ? "#EFF6FF" : "transparent",
                      border: selectedId === l.id ? "1px solid #BFDBFE" : "1px solid transparent",
                    }}
                  >
                    <span style={{ color: "#6B7280", flexShrink: 0 }}>
                      {l.type === "text" ? <Type size={12} /> : l.type === "image" ? <ImageIcon size={12} /> : <Square size={12} />}
                    </span>
                    <span style={{ fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#111827" }}>
                      {l.type === "text" ? `"${(l as TextLayer).text}"` : l.type === "image" ? "Image" : "Shape"}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateLayer(l.id, { visible: !l.visible }); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: l.visible ? "#6B7280" : "#D1D5DB", padding: 2 }}
                    >
                      {l.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Properties panel (shown when a layer is selected) ── */}
          {selected && (
            <div style={s.propPanel}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={s.panelLabel}>
                  {selected.type === "text" ? "Text" : selected.type === "image" ? "Image" : "Shape"} layer
                </span>
                <div style={{ display: "flex", gap: 3 }}>
                  <button onClick={() => reorder(selected.id, "up")} style={s.iconBtn} title="Bring forward"><ChevronUp size={13} /></button>
                  <button onClick={() => reorder(selected.id, "down")} style={s.iconBtn} title="Send back"><ChevronDown size={13} /></button>
                  <button onClick={() => duplicateLayer(selected.id)} style={s.iconBtn} title="Duplicate"><Copy size={13} /></button>
                  <button onClick={() => removeLayer(selected.id)} style={{ ...s.iconBtn, color: "#EF4444" }} title="Delete"><Trash2 size={13} /></button>
                </div>
              </div>

              {/* ── TEXT PROPERTIES ── */}
              {selected.type === "text" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  <div>
                    <label style={s.fieldLabel}>Content</label>
                    <textarea value={selected.text} rows={2} style={s.textarea}
                      onChange={(e) => updateLayer(selected.id, { text: e.target.value })} />
                  </div>

                  <div>
                    <label style={s.fieldLabel}>Font family</label>
                    <select value={selected.fontFamily} style={s.select}
                      onChange={(e) => updateLayer(selected.id, { fontFamily: e.target.value })}>
                      {FONTS.map((f) => (
                        <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={s.fieldLabel}>Size — {selected.fontSize}px</label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input type="range" min={8} max={96} value={selected.fontSize} style={{ flex: 1 }}
                        onChange={(e) => updateLayer(selected.id, { fontSize: Number(e.target.value) })} />
                      <input type="number" min={8} max={96} value={selected.fontSize} style={{ ...s.numInput, width: 46 }}
                        onChange={(e) => updateLayer(selected.id, { fontSize: Number(e.target.value) })} />
                    </div>
                  </div>

                  <div>
                    <label style={s.fieldLabel}>Style</label>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button title="Bold"
                        onClick={() => updateLayer(selected.id, { fontWeight: selected.fontWeight === "bold" ? "normal" : "bold" })}
                        style={{ ...s.toggleBtn, background: selected.fontWeight === "bold" ? "#2563EB" : "#fff", color: selected.fontWeight === "bold" ? "#fff" : "#374151" }}>
                        <Bold size={13} />
                      </button>
                      <button title="Italic"
                        onClick={() => updateLayer(selected.id, { fontStyle: selected.fontStyle === "italic" ? "normal" : "italic" })}
                        style={{ ...s.toggleBtn, background: selected.fontStyle === "italic" ? "#2563EB" : "#fff", color: selected.fontStyle === "italic" ? "#fff" : "#374151" }}>
                        <Italic size={13} />
                      </button>
                      <button title="Underline"
                        onClick={() => updateLayer(selected.id, { textDecoration: selected.textDecoration === "underline" ? "none" : "underline" })}
                        style={{ ...s.toggleBtn, background: selected.textDecoration === "underline" ? "#2563EB" : "#fff", color: selected.textDecoration === "underline" ? "#fff" : "#374151" }}>
                        <Underline size={13} />
                      </button>
                      <div style={{ width: 1, background: "#E5E7EB", margin: "0 2px" }} />
                      {(["left", "center", "right"] as const).map((a) => (
                        <button key={a} title={`Align ${a}`}
                          onClick={() => updateLayer(selected.id, { textAlign: a })}
                          style={{ ...s.toggleBtn, background: selected.textAlign === a ? "#2563EB" : "#fff", color: selected.textAlign === a ? "#fff" : "#374151" }}>
                          {a === "left" ? <AlignLeft size={13} /> : a === "center" ? <AlignCenter size={13} /> : <AlignRight size={13} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={s.fieldLabel}>Color</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="color" value={selected.color} style={s.colorInput}
                        onChange={(e) => updateLayer(selected.id, { color: e.target.value })} />
                      <span style={{ fontSize: 12, color: "#6B7280", fontFamily: "monospace" }}>{selected.color}</span>
                    </div>
                  </div>

                  <div>
                    <label style={s.fieldLabel}>Opacity — {Math.round(selected.opacity * 100)}%</label>
                    <input type="range" min={0} max={100} value={Math.round(selected.opacity * 100)} style={{ width: "100%" }}
                      onChange={(e) => updateLayer(selected.id, { opacity: Number(e.target.value) / 100 })} />
                  </div>
                </div>
              )}

              {/* ── IMAGE PROPERTIES ── */}
              {selected.type === "image" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  <div>
                    <label style={s.fieldLabel}>Flip</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => updateLayer(selected.id, { flipH: !selected.flipH })}
                        style={{ ...s.toggleBtn, flex: 1, gap: 5, background: selected.flipH ? "#2563EB" : "#fff", color: selected.flipH ? "#fff" : "#374151" }}>
                        <FlipHorizontal size={13} /> Horizontal
                      </button>
                      <button
                        onClick={() => updateLayer(selected.id, { flipV: !selected.flipV })}
                        style={{ ...s.toggleBtn, flex: 1, gap: 5, background: selected.flipV ? "#2563EB" : "#fff", color: selected.flipV ? "#fff" : "#374151" }}>
                        <FlipVertical size={13} /> Vertical
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={s.fieldLabel}>Fit mode</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {(["contain", "cover"] as const).map((fit) => (
                        <button key={fit}
                          onClick={() => updateLayer(selected.id, { objectFit: fit })}
                          style={{ ...s.toggleBtn, flex: 1, background: selected.objectFit === fit ? "#2563EB" : "#fff", color: selected.objectFit === fit ? "#fff" : "#374151" }}>
                          {fit.charAt(0).toUpperCase() + fit.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={s.fieldLabel}>Corner radius — {selected.borderRadius}%</label>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      {[0, 10, 25, 50].map((v) => (
                        <button key={v} onClick={() => updateLayer(selected.id, { borderRadius: v })}
                          style={{ flex: 1, fontSize: 11, padding: "4px 0", border: "1.5px solid #D1D5DB", borderRadius: 6, cursor: "pointer", background: selected.borderRadius === v ? "#2563EB" : "#fff", color: selected.borderRadius === v ? "#fff" : "#374151",
                            borderColor: selected.borderRadius === v ? "#2563EB" : "#D1D5DB" }}>
                          {v === 0 ? "□" : v === 10 ? "▢" : v === 25 ? "◻" : "○"}
                        </button>
                      ))}
                    </div>
                    <input type="range" min={0} max={50} value={selected.borderRadius} style={{ width: "100%" }}
                      onChange={(e) => updateLayer(selected.id, { borderRadius: Number(e.target.value) })} />
                  </div>

                  <div>
                    <label style={s.fieldLabel}>Opacity — {Math.round(selected.opacity * 100)}%</label>
                    <input type="range" min={0} max={100} value={Math.round(selected.opacity * 100)} style={{ width: "100%" }}
                      onChange={(e) => updateLayer(selected.id, { opacity: Number(e.target.value) / 100 })} />
                  </div>

                  <label style={{ ...s.primaryBtn, cursor: "pointer", marginTop: 2 }}>
                    <ImageIcon size={13} /> Replace image
                    <input type="file" accept="image/*" style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => updateLayer(selected.id, { src: ev.target?.result as string });
                        reader.readAsDataURL(file);
                      }} />
                  </label>
                </div>
              )}

              {/* ── SHAPE PROPERTIES ── */}
              {selected.type === "shape" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {/* Solid / Gradient toggle */}
                  <div>
                    <label style={s.fieldLabel}>Fill</label>
                    <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                      {(["Solid", "Gradient"] as const).map((mode) => (
                        <button key={mode}
                          onClick={() => updateLayer(selected.id, { gradient: mode === "Gradient" ? { ...DEFAULT_GRADIENT } : null })}
                          style={{ ...s.toggleBtn, flex: 1, fontSize: 12, background: (mode === "Gradient") === !!selected.gradient ? "#2563EB" : "#fff", color: (mode === "Gradient") === !!selected.gradient ? "#fff" : "#374151" }}>
                          {mode}
                        </button>
                      ))}
                    </div>

                    {!selected.gradient ? (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <input type="color" value={selected.fill} style={s.colorInput}
                            onChange={(e) => updateLayer(selected.id, { fill: e.target.value })} />
                          <span style={{ fontSize: 12, color: "#6B7280", fontFamily: "monospace" }}>{selected.fill}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
                          {["#1a1a1a","#ffffff","#2563EB","#16a34a","#dc2626","#ca8a04","#7c3aed","#db2777","#0e7490","#9a3412","#374151","#6B7280"].map((c) => (
                            <button key={c} onClick={() => updateLayer(selected.id, { fill: c })}
                              style={{ aspectRatio: "1", borderRadius: 4, background: c, border: selected.fill === c ? "2.5px solid #2563EB" : "1.5px solid #D1D5DB", cursor: "pointer" }} />
                          ))}
                        </div>
                      </>
                    ) : (
                      <GradientEditor
                        gradient={selected.gradient}
                        onChange={(g) => updateLayer(selected.id, { gradient: g })}
                      />
                    )}
                  </div>

                  <div>
                    <label style={s.fieldLabel}>Corner radius — {selected.borderRadius}px</label>
                    <input type="range" min={0} max={200} value={selected.borderRadius} style={{ width: "100%" }}
                      onChange={(e) => updateLayer(selected.id, { borderRadius: Number(e.target.value) })} />
                  </div>

                  <div>
                    <label style={s.fieldLabel}>Opacity — {Math.round(selected.opacity * 100)}%</label>
                    <input type="range" min={0} max={100} value={Math.round(selected.opacity * 100)} style={{ width: "100%" }}
                      onChange={(e) => updateLayer(selected.id, { opacity: Number(e.target.value) / 100 })} />
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── CANVAS AREA ── */}
        <main style={s.canvasArea}>
          <div style={s.guideLegend}>
            <span style={s.guideChip}><span style={{ display: "inline-block", width: 18, height: 0, borderTop: "1.5px dashed #e2453f" }} /> Bleed</span>
            <span style={s.guideChip}><span style={{ display: "inline-block", width: 18, height: 0, borderTop: "1.5px dashed #378ADD" }} /> Safety area</span>
            {template.shape === "wraparound" && <span style={{ ...s.guideChip, color: "#F59E0B" }}>Unwrapped surface</span>}
          </div>

          <div style={s.canvasViewport} onPointerDown={() => setSelectedId(null)}>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.12s ease" }}>
              <div
                ref={canvasRef}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectedId(null);
                  if (canvasBgImage && bgModeByZone[zoneKey] === "Image") onPointerDownBgImage(e);
                }}
                style={{ position: "relative", width: canvasW, height: canvasH, background: canvasBgGradient ? gradientToCss(canvasBgGradient) : canvasBg, backgroundImage: canvasBgImage ? `url(${canvasBgImage})` : undefined, backgroundSize: canvasBgImage ? `${canvasBgTransform.scale}%` : undefined, backgroundPosition: canvasBgImage ? `${canvasBgTransform.offsetX}% ${canvasBgTransform.offsetY}%` : undefined, cursor: canvasBgImage && bgModeByZone[zoneKey] === "Image" ? "grab" : undefined, boxShadow: "0 2px 32px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.06)", borderRadius: canvasBorderRadius, overflow: "hidden" }}
              >
                {/* Guides */}
                <div style={{ position: "absolute", inset: 0, border: "1.5px dashed #e2453f", pointerEvents: "none", zIndex: 20, borderRadius: canvasBorderRadius }} />
                <div style={{ position: "absolute", top: safetyPx, left: safetyPx, right: safetyPx, bottom: safetyPx, border: "1.5px dashed #378ADD", pointerEvents: "none", zIndex: 20, borderRadius: canvasBorderRadius === "50%" ? "50%" : canvasBorderRadius === "0" ? "0" : `calc(${canvasBorderRadius} - ${safetyPx}px)` }} />

                {/* Layers */}
                {sortedLayers.map((l) => {
                  if (!l.visible) return null;

                  let flipTransform = "";
                  if (l.type === "image") {
                    if (l.flipH && l.flipV) flipTransform = "scale(-1,-1)";
                    else if (l.flipH) flipTransform = "scaleX(-1)";
                    else if (l.flipV) flipTransform = "scaleY(-1)";
                  }

                  return (
                    <div
                      key={l.id}
                      onPointerDown={(e) => onPointerDownLayer(e, l, "move")}
                      style={{
                        position: "absolute",
                        left: l.x, top: l.y, width: l.w, height: l.h,
                        transform: `rotate(${l.rotation}deg)`,
                        cursor: "move", userSelect: "none", opacity: l.opacity,
                        outline: selectedId === l.id ? "2px solid #2563EB" : "none",
                        outlineOffset: 1,
                      }}
                    >
                      {l.type === "shape" && (
                        <div style={{ width: "100%", height: "100%", background: l.gradient ? gradientToCss(l.gradient) : l.fill, borderRadius: l.borderRadius }} />
                      )}

                      {l.type === "text" && (
                        <div style={{
                          width: "100%", height: "100%",
                          display: "flex", alignItems: "center",
                          justifyContent: l.textAlign === "left" ? "flex-start" : l.textAlign === "right" ? "flex-end" : "center",
                          fontSize: l.fontSize, color: l.color, fontFamily: l.fontFamily,
                          fontWeight: l.fontWeight, fontStyle: l.fontStyle,
                          textDecoration: l.textDecoration,
                          whiteSpace: "nowrap", padding: "0 4px", boxSizing: "border-box",
                        }}>
                          {l.text}
                        </div>
                      )}

                      {l.type === "image" && (
                        <img
                          src={l.src} alt=""
                          style={{
                            width: "100%", height: "100%",
                            objectFit: l.objectFit,
                            transform: flipTransform,
                            borderRadius: `${l.borderRadius}%`,
                            pointerEvents: "none",
                          }}
                          draggable={false}
                        />
                      )}

                      {selectedId === l.id && (
                        <>
                          <div onPointerDown={(e) => onPointerDownLayer(e, l, "resize")}
                            style={{ position: "absolute", right: -5, bottom: -5, width: 10, height: 10, background: "#2563EB", borderRadius: "50%", cursor: "se-resize", border: "2px solid #fff", zIndex: 25 }} />
                          <div onPointerDown={(e) => onPointerDownLayer(e, l, "rotate")}
                            style={{ position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)", width: 18, height: 18, background: "#2563EB", borderRadius: "50%", cursor: "grab", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff", zIndex: 25 }}>
                            <RotateCw size={10} color="#fff" />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Zoom bar */}
          <div style={s.zoomBar}>
            <button onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))} style={s.zoomBtn}><ZoomOut size={13} /></button>
            <span style={{ fontSize: 12, color: "#374151", fontWeight: 500, minWidth: 38, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} style={s.zoomBtn}><ZoomIn size={13} /></button>
            <button onClick={() => setZoom(1)} style={{ ...s.zoomBtn, marginLeft: 4 }} title="Reset zoom"><Maximize2 size={13} /></button>
          </div>
        </main>

        {/* ── RIGHT RAIL — zone switcher + continue ── */}
        <aside style={s.rightPanel}>
          {/* Zone switcher */}
          {template.zones.length > 1 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "16px 8px", borderBottom: "1px solid #E2E5EC", flexShrink: 0 }}>
              {template.zones.map((z) => {
                const zW = z.width * PX_PER_MM;
                const zH = z.height * PX_PER_MM;
                const scale = 52 / Math.max(zW, zH);
                const thumbW = Math.round(zW * scale);
                const thumbH = Math.round(zH * scale);
                const isActive = activeZoneId === z.id;
                return (
                  <button key={z.id} onClick={() => setActiveZoneId(z.id)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: 6, border: "none", background: "none", cursor: "pointer", borderRadius: 6, outline: isActive ? "2px solid #2563EB" : "2px solid transparent", outlineOffset: 2 }}>
                    <div style={{ width: thumbW, height: thumbH, background: bgByZone[`${productType}:${z.id}`] || "#fff", backgroundImage: bgImageByZone[`${productType}:${z.id}`] ? `url(${bgImageByZone[`${productType}:${z.id}`]})` : undefined, backgroundSize: "cover", backgroundPosition: "center", border: "1px solid #D1D5DB", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }} />
                    <span style={{ fontSize: 10, color: isActive ? "#2563EB" : "#6B7280", fontWeight: isActive ? 600 : 400 }}>{z.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* CTA */}
          <div style={{ padding: "12px 8px", display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => navigate(`/review?product=${productType}`)}
              title="Review your design"
              style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "9px 8px", background: "#2563EB", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}
            >
              <ShoppingCart size={14} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.03em" }}>Next</span>
            </button>
            <button
              onClick={handleExport}
              title="Download print-ready PNG"
              style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "8px 8px", background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 8, cursor: "pointer" }}
            >
              <Download size={13} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>Proof</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Style tokens ─────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", height: "100vh", fontFamily: "system-ui,'Segoe UI',sans-serif", fontSize: 13, color: "#111827", background: "#ECEEF2", overflow: "hidden" },
  topBar: { height: 48, flexShrink: 0, background: "#fff", borderBottom: "1px solid #E2E5EC", display: "flex", alignItems: "center", gap: 10, padding: "0 16px", zIndex: 10 },
  productSelect: { border: "1px solid #D1D5DB", borderRadius: 6, padding: "4px 10px", fontSize: 13, fontWeight: 600, color: "#111827", background: "#fff", cursor: "pointer" },
  exportBtn: { display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#2563EB", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  body: { display: "flex", flex: 1, overflow: "hidden" },
  leftPanel: { width: 264, flexShrink: 0, background: "#fff", borderRight: "1px solid #E2E5EC", display: "flex", flexDirection: "column", overflow: "hidden" },
  tabStrip: { display: "flex", borderBottom: "1px solid #E2E5EC", flexShrink: 0 },
  tab: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "8px 4px", border: "none", background: "none", cursor: "pointer", fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase" },
  toolArea: { padding: 14, display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, borderBottom: "1px solid #E2E5EC" },
  primaryBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", padding: "9px 12px", background: "#2563EB", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", boxSizing: "border-box" },
  secondaryBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "7px 12px", background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer", boxSizing: "border-box" },
  hint: { margin: 0, fontSize: 12, color: "#9CA3AF", lineHeight: 1.55 },
  propPanel: { flex: 1, padding: 14, overflowY: "auto" },
  panelLabel: { fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.07em" },
  fieldLabel: { display: "block", fontSize: 10, fontWeight: 600, color: "#6B7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" },
  textarea: { width: "100%", border: "1px solid #D1D5DB", borderRadius: 6, padding: "6px 8px", fontSize: 13, resize: "none", fontFamily: "inherit", boxSizing: "border-box", color: "#111827" },
  select: { width: "100%", border: "1px solid #D1D5DB", borderRadius: 6, padding: "5px 8px", fontSize: 13, background: "#fff", color: "#111827", cursor: "pointer", boxSizing: "border-box" },
  numInput: { border: "1px solid #D1D5DB", borderRadius: 5, padding: "3px 6px", fontSize: 12, color: "#111827", textAlign: "center" as const },
  colorInput: { width: 32, height: 26, border: "1px solid #D1D5DB", borderRadius: 4, padding: 2, cursor: "pointer" },
  iconBtn: { display: "flex", alignItems: "center", padding: "4px 6px", border: "1px solid #E5E7EB", borderRadius: 5, background: "#fff", cursor: "pointer", color: "#374151" },
  toggleBtn: { display: "flex", alignItems: "center", justifyContent: "center", padding: "5px 7px", border: "1px solid #E5E7EB", borderRadius: 5, cursor: "pointer", fontSize: 12 },
  canvasArea: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  guideLegend: { display: "flex", gap: 14, padding: "7px 16px", flexShrink: 0 },
  guideChip: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#9CA3AF" },
  canvasViewport: { flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 48 },
  zoomBar: { height: 40, flexShrink: 0, background: "#fff", borderTop: "1px solid #E2E5EC", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 16px" },
  zoomBtn: { display: "flex", alignItems: "center", padding: "4px 8px", border: "1px solid #E5E7EB", borderRadius: 5, background: "#fff", cursor: "pointer", color: "#374151" },
  rightPanel: { width: 110, flexShrink: 0, background: "#fff", borderLeft: "1px solid #E2E5EC", display: "flex", flexDirection: "column", overflow: "hidden" },
};
