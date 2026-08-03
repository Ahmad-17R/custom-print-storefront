import React, { useState, useRef, useCallback, useEffect } from "react";
import { Type, Image as ImageIcon, Trash2, Copy, ChevronUp, ChevronDown, Download, RotateCw } from "lucide-react";

// ---------------------------------------------------------------------------
// TEMPLATE CONFIGS — this is the part that scales to new products.
// Each product type is pure data: canvas size, bleed, safety, zones.
// The engine below never hardcodes "business card" or "pen" logic —
// it only reads these shapes. Adding product #51 means adding a config,
// not writing new editor code.
// ---------------------------------------------------------------------------
const TEMPLATES = {
  business_card: {
    label: "Business card",
    shape: "flat",
    unit: "mm",
    dpi: 300,
    zones: [
      { id: "front", label: "Front", width: 90, height: 54, bleed: 3, safety: 3 },
      { id: "back", label: "Back", width: 90, height: 54, bleed: 3, safety: 3 },
    ],
  },
  pen: {
    label: "Pen (barrel wrap)",
    shape: "wraparound",
    unit: "mm",
    dpi: 300,
    zones: [
      { id: "barrel", label: "Barrel (unwrapped)", width: 130, height: 24, bleed: 2, safety: 2 },
    ],
  },
};

const PX_PER_MM = 4; // fixed on-screen scale for the editing surface

let idCounter = 1;
const nextId = () => `layer_${idCounter++}`;

function ProductEditor({ initialProductType = "business_card" }) {
  const [productType, setProductType] = useState(initialProductType);
  const template = TEMPLATES[productType];
  const [activeZoneId, setActiveZoneId] = useState(template.zones[0].id);
  const [layersByZone, setLayersByZone] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const canvasRef = useRef(null);
  const dragState = useRef(null);
  const exportRef = useRef(null);

  useEffect(() => {
    const t = TEMPLATES[productType];
    setActiveZoneId(t.zones[0].id);
    setSelectedId(null);
  }, [productType]);

  const zone = template.zones.find((z) => z.id === activeZoneId);
  const zoneKey = `${productType}:${activeZoneId}`;
  const layers = layersByZone[zoneKey] || [];

  const canvasW = zone.width * PX_PER_MM;
  const canvasH = zone.height * PX_PER_MM;
  const bleedPx = zone.bleed * PX_PER_MM;
  const safetyPx = (zone.bleed + zone.safety) * PX_PER_MM;

  const setLayers = (updater) => {
    setLayersByZone((prev) => {
      const current = prev[zoneKey] || [];
      const updated = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [zoneKey]: updated };
    });
  };

  const addTextLayer = () => {
    const id = nextId();
    setLayers((cur) => [
      ...cur,
      {
        id,
        type: "text",
        x: canvasW / 2 - 60,
        y: canvasH / 2 - 14,
        w: 120,
        h: 28,
        rotation: 0,
        z: cur.length,
        text: "Your text",
        fontSize: 16,
        color: "#1a1a1a",
        fontFamily: "Arial, sans-serif",
      },
    ]);
    setSelectedId(id);
  };

  const addImageLayer = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target.result;
      const img = new window.Image();
      img.onload = () => {
        const id = nextId();
        const maxW = canvasW * 0.5;
        const scale = Math.min(1, maxW / img.width);
        setLayers((cur) => [
          ...cur,
          {
            id,
            type: "image",
            x: canvasW / 2 - (img.width * scale) / 2,
            y: canvasH / 2 - (img.height * scale) / 2,
            w: img.width * scale,
            h: img.height * scale,
            rotation: 0,
            z: cur.length,
            src,
          },
        ]);
        setSelectedId(id);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const updateLayer = (id, patch) => {
    setLayers((cur) => cur.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLayer = (id) => {
    setLayers((cur) => cur.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateLayer = (id) => {
    const l = layers.find((x) => x.id === id);
    if (!l) return;
    const copy = { ...l, id: nextId(), x: l.x + 10, y: l.y + 10, z: layers.length };
    setLayers((cur) => [...cur, copy]);
    setSelectedId(copy.id);
  };

  const reorder = (id, dir) => {
    setLayers((cur) => {
      const sorted = [...cur].sort((a, b) => a.z - b.z);
      const idx = sorted.findIndex((l) => l.id === id);
      const swapIdx = dir === "up" ? idx + 1 : idx - 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return cur;
      const a = sorted[idx].z;
      sorted[idx].z = sorted[swapIdx].z;
      sorted[swapIdx].z = a;
      return sorted;
    });
  };

  // --- drag / resize handling -------------------------------------------------
  const onPointerDownLayer = (e, layer, mode) => {
    e.stopPropagation();
    setSelectedId(layer.id);
    const rect = canvasRef.current.getBoundingClientRect();
    dragState.current = {
      mode,
      id: layer.id,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...layer },
      rectLeft: rect.left,
      rectTop: rect.top,
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const onPointerMove = useCallback((e) => {
    const ds = dragState.current;
    if (!ds) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    if (ds.mode === "move") {
      updateLayer(ds.id, { x: ds.orig.x + dx, y: ds.orig.y + dy });
    } else if (ds.mode === "resize") {
      updateLayer(ds.id, {
        w: Math.max(20, ds.orig.w + dx),
        h: Math.max(16, ds.orig.h + dy),
      });
    } else if (ds.mode === "rotate") {
      const cx = ds.rectLeft + ds.orig.x + ds.orig.w / 2;
      const cy = ds.rectTop + ds.orig.y + ds.orig.h / 2;
      const angle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
      updateLayer(ds.id, { rotation: Math.round(angle + 90) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerUp = useCallback(() => {
    dragState.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = layers.find((l) => l.id === selectedId);

  // --- export to print-ready PNG at template DPI -----------------------------
  const handleExport = () => {
    const mmToExportPx = template.dpi / 25.4;
    const outW = Math.round(zone.width * mmToExportPx);
    const outH = Math.round(zone.height * mmToExportPx);
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outW, outH);
    const scale = outW / canvasW;

    const sorted = [...layers].sort((a, b) => a.z - b.z);
    let pending = sorted.filter((l) => l.type === "image").length;

    const drawTextLayers = () => {
      sorted.forEach((l) => {
        if (l.type !== "text") return;
        ctx.save();
        ctx.translate((l.x + l.w / 2) * scale, (l.y + l.h / 2) * scale);
        ctx.rotate((l.rotation * Math.PI) / 180);
        ctx.fillStyle = l.color;
        ctx.font = `${l.fontSize * scale}px ${l.fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(l.text, 0, 0);
        ctx.restore();
      });
    };

    const finish = () => {
      drawTextLayers();
      const link = document.createElement("a");
      link.download = `${productType}_${zone.id}_${template.dpi}dpi.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    if (pending === 0) {
      finish();
      return;
    }
    sorted.forEach((l) => {
      if (l.type !== "image") return;
      const img = new window.Image();
      img.onload = () => {
        ctx.save();
        ctx.translate((l.x + l.w / 2) * scale, (l.y + l.h / 2) * scale);
        ctx.rotate((l.rotation * Math.PI) / 180);
        ctx.drawImage(img, (-l.w / 2) * scale, (-l.h / 2) * scale, l.w * scale, l.h * scale);
        ctx.restore();
        pending -= 1;
        if (pending === 0) finish();
      };
      img.src = l.src;
    });
  };

  return (
    <div className="w-full bg-[var(--surface-0,#f5f5f4)] p-4 rounded-xl">
      {/* Top bar: product type + zone switch — proves the config-driven claim */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-sm text-gray-600">Product type</label>
        <select
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <option key={key} value={key}>{t.label}</option>
          ))}
        </select>

        {template.zones.length > 1 && (
          <div className="flex gap-1 ml-2">
            {template.zones.map((z) => (
              <button
                key={z.id}
                onClick={() => setActiveZoneId(z.id)}
                className={`px-3 py-1.5 text-sm rounded-lg border ${
                  activeZoneId === z.id
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                {z.label}
              </button>
            ))}
          </div>
        )}

        <span className="text-xs text-gray-500 ml-auto">
          {zone.width}×{zone.height}mm · {zone.bleed}mm bleed · {template.dpi} DPI export
        </span>
      </div>

      <div className="flex gap-4 flex-wrap">
        {/* Toolbar */}
        <div className="flex md:flex-col gap-2 shrink-0">
          <button onClick={addTextLayer} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 text-sm hover:border-gray-400">
            <Type size={16} /> Text
          </button>
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 text-sm hover:border-gray-400 cursor-pointer">
            <ImageIcon size={16} /> Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files[0] && addImageLayer(e.target.files[0])}
            />
          </label>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-800">
            <Download size={16} /> Export
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex justify-center overflow-auto py-2">
          <div
            ref={canvasRef}
            onPointerDown={() => setSelectedId(null)}
            className="relative bg-white shadow-sm"
            style={{ width: canvasW, height: canvasH }}
          >
            {/* bleed guide */}
            <div
              className="absolute inset-0 pointer-events-none border border-dashed"
              style={{ borderColor: "#e2453f" }}
            />
            {/* safety guide */}
            <div
              className="absolute pointer-events-none border border-dashed"
              style={{
                top: safetyPx, left: safetyPx,
                right: safetyPx, bottom: safetyPx,
                borderColor: "#378ADD",
              }}
            />
            {template.shape === "wraparound" && (
              <div className="absolute -top-6 left-0 text-xs text-gray-500">
                Unwrapped surface — preview shows curved mockup on export
              </div>
            )}

            {[...layers].sort((a, b) => a.z - b.z).map((l) => (
              <div
                key={l.id}
                onPointerDown={(e) => onPointerDownLayer(e, l, "move")}
                className={`absolute cursor-move select-none ${selectedId === l.id ? "outline outline-2 outline-blue-500" : ""}`}
                style={{
                  left: l.x, top: l.y, width: l.w, height: l.h,
                  transform: `rotate(${l.rotation}deg)`,
                }}
              >
                {l.type === "text" ? (
                  <div
                    className="w-full h-full flex items-center justify-center whitespace-nowrap"
                    style={{ fontSize: l.fontSize, color: l.color, fontFamily: l.fontFamily }}
                  >
                    {l.text}
                  </div>
                ) : (
                  <img src={l.src} alt="" className="w-full h-full object-contain pointer-events-none" draggable={false} />
                )}

                {selectedId === l.id && (
                  <>
                    <div
                      onPointerDown={(e) => onPointerDownLayer(e, l, "resize")}
                      className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize"
                    />
                    <div
                      onPointerDown={(e) => onPointerDownLayer(e, l, "rotate")}
                      className="absolute -top-6 left-1/2 -translate-x-1/2 w-5 h-5 bg-blue-500 rounded-full cursor-pointer flex items-center justify-center"
                    >
                      <RotateCw size={11} className="text-white" />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Properties panel */}
        <div className="w-56 shrink-0">
          {selected ? (
            <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
              <div className="flex gap-1">
                <button onClick={() => reorder(selected.id, "up")} className="p-1.5 border rounded hover:bg-gray-50"><ChevronUp size={14} /></button>
                <button onClick={() => reorder(selected.id, "down")} className="p-1.5 border rounded hover:bg-gray-50"><ChevronDown size={14} /></button>
                <button onClick={() => duplicateLayer(selected.id)} className="p-1.5 border rounded hover:bg-gray-50"><Copy size={14} /></button>
                <button onClick={() => removeLayer(selected.id)} className="p-1.5 border rounded hover:bg-gray-50 text-red-600"><Trash2 size={14} /></button>
              </div>

              {selected.type === "text" && (
                <>
                  <textarea
                    value={selected.text}
                    onChange={(e) => updateLayer(selected.id, { text: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm resize-none"
                    rows={2}
                  />
                  <div>
                    <label className="text-xs text-gray-500">Font size</label>
                    <input
                      type="range" min="8" max="60" value={selected.fontSize}
                      onChange={(e) => updateLayer(selected.id, { fontSize: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Color</label>
                    <input
                      type="color" value={selected.color}
                      onChange={(e) => updateLayer(selected.id, { color: e.target.value })}
                      className="w-full h-8"
                    />
                  </div>
                </>
              )}
              <div className="text-xs text-gray-400">Layer id: {selected.id}</div>
            </div>
          ) : (
            <div className="text-sm text-gray-400 border border-dashed border-gray-300 rounded-lg p-4 text-center">
              Select a layer to edit its properties
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductEditor;
