import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Check, ChevronDown, Truck, Shield } from "lucide-react";
import { TEMPLATES } from "../../shared/components/product-editor/templates";
import type { PrintOptionGroup, CanvasShape } from "../../shared/components/product-editor/types";

function getPreviewBorderRadius(canvasShape: CanvasShape, cornerRadius?: number, previewW?: number): string {
  switch (canvasShape) {
    case "circle":
    case "oval":
      return "50%";
    case "rounded":
      return `${((cornerRadius ?? 4) / 90) * (previewW ?? 320)}px`;
    default:
      return "4px";
  }
}

export function FinalStepsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const productKey = params.get("product") ?? "business_card";
  const template = TEMPLATES[productKey] ?? TEMPLATES["business_card"];

  const [quantity, setQuantity] = useState<number>(template.quantities[1] ?? template.quantities[0]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(template.printOptions.map((g) => [g.id, g.defaultChoice]))
  );
  const [added, setAdded] = useState(false);

  // Reset when product changes via URL
  useEffect(() => {
    setQuantity(template.quantities[1] ?? template.quantities[0]);
    setSelectedOptions(Object.fromEntries(template.printOptions.map((g) => [g.id, g.defaultChoice])));
    setAdded(false);
  }, [productKey]);

  const optionsDelta = template.printOptions.reduce((sum, group) => {
    const choiceId = selectedOptions[group.id] ?? group.defaultChoice;
    const choice = group.choices.find((c) => c.id === choiceId);
    return sum + (choice?.priceDelta ?? 0);
  }, 0);

  const totalPrice = template.basePrice + optionsDelta;
  const pricePerUnit = (totalPrice / quantity).toFixed(2);

  const handleAddToCart = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div style={s.page}>

      {/* ── Top bar ── */}
      <header style={s.topBar}>
        <button onClick={() => navigate(-1)} style={s.backBtn}>
          <ArrowLeft size={16} />
          Back to editor
        </button>
        <span style={s.topBarTitle}>{template.label}</span>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#6B7280" }}>
          Almost done — finalise your print specs
        </span>
      </header>

      {/* ── Body ── */}
      <div style={s.body}>

        {/* ── LEFT — product preview ── */}
        <div style={s.previewCol}>
          <div style={s.previewSticky}>

            {/* Zone thumbnails */}
            <div style={s.zoneRow}>
              {template.zones.map((z, i) => {
                const aspect = z.width / z.height;
                const previewW = Math.min(320, 320);
                const previewH = previewW / aspect;
                return (
                  <div key={z.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ position: "relative", width: previewW, height: previewH, background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.10)", borderRadius: getPreviewBorderRadius(template.canvasShape, template.cornerRadius, previewW), overflow: "hidden" }}>
                      {/* Bleed guide */}
                      <div style={{ position: "absolute", inset: 0, border: "1.5px dashed #e2453f", borderRadius: getPreviewBorderRadius(template.canvasShape, template.cornerRadius, previewW), pointerEvents: "none" }} />
                      {/* Safety guide */}
                      <div style={{ position: "absolute", inset: "8%", border: "1.5px dashed #378ADD", pointerEvents: "none", borderRadius: template.canvasShape === "circle" || template.canvasShape === "oval" ? "50%" : "0" }} />
                      {/* Placeholder art */}
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "#D1D5DB" }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 22 }}>🖼</span>
                        </div>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>Your design — {z.label}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>{z.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Spec summary card */}
            <div style={s.specCard}>
              <p style={s.specCardTitle}>Your selection</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <SpecRow label="Product" value={template.label} />
                <SpecRow label="Quantity" value={`${quantity} units`} />
                {template.printOptions.map((g) => {
                  const choiceId = selectedOptions[g.id] ?? g.defaultChoice;
                  const choice = g.choices.find((c) => c.id === choiceId);
                  return <SpecRow key={g.id} label={g.label} value={choice?.label ?? "—"} />;
                })}
              </div>
            </div>

            {/* Trust badges */}
            <div style={s.trustRow}>
              <div style={s.trustChip}><Truck size={13} style={{ color: "#16a34a" }} /> Free delivery over AED 200</div>
              <div style={s.trustChip}><Shield size={13} style={{ color: "#2563EB" }} /> Satisfaction guarantee</div>
            </div>
          </div>
        </div>

        {/* ── RIGHT — options ── */}
        <div style={s.optionsCol}>
          <h1 style={s.heading}>Final Steps</h1>
          <p style={s.subheading}>Choose your print specs below. Prices update as you select.</p>

          {/* Quantity */}
          <OptionSection label="Quantity" required>
            <div style={{ position: "relative" }}>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                style={s.qtySelect}
              >
                {template.quantities.map((q) => (
                  <option key={q} value={q}>{q} units</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#6B7280", pointerEvents: "none" }} />
            </div>
          </OptionSection>

          {/* Print option groups */}
          {template.printOptions.map((group) => (
            <OptionSection key={group.id} label={group.label} required={group.required}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {group.choices.map((choice) => {
                  const isSelected = (selectedOptions[group.id] ?? group.defaultChoice) === choice.id;
                  return (
                    <button
                      key={choice.id}
                      onClick={() => setSelectedOptions((prev) => ({ ...prev, [group.id]: choice.id }))}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        padding: "12px 14px",
                        border: isSelected ? "2px solid #2563EB" : "1.5px solid #E5E7EB",
                        borderRadius: 10,
                        background: isSelected ? "#EFF6FF" : "#fff",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        transition: "border-color 0.12s, background 0.12s",
                      }}
                    >
                      {/* Radio dot */}
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                        border: isSelected ? "5px solid #2563EB" : "1.5px solid #D1D5DB",
                        background: "#fff",
                      }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{choice.label}</span>
                          {choice.tag && (
                            <span style={{ fontSize: 10, background: "#DBEAFE", color: "#1D4ED8", padding: "2px 8px", borderRadius: 20, fontWeight: 700, letterSpacing: "0.04em" }}>
                              {choice.tag}
                            </span>
                          )}
                          {(choice.priceDelta ?? 0) > 0 && (
                            <span style={{ marginLeft: "auto", fontSize: 13, color: "#374151", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                              +AED {choice.priceDelta}
                            </span>
                          )}
                          {(choice.priceDelta === 0 || choice.priceDelta === undefined) && (
                            <span style={{ marginLeft: "auto", fontSize: 12, color: "#9CA3AF" }}>Included</span>
                          )}
                        </div>
                        {choice.description && (
                          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{choice.description}</p>
                        )}
                      </div>

                      {isSelected && (
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Check size={12} color="#fff" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </OptionSection>
          ))}

          {/* ── Price + CTA ── */}
          <div style={s.ctaBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
              <div>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>
                  AED {totalPrice}
                </span>
                <span style={{ fontSize: 13, color: "#9CA3AF", marginLeft: 8 }}>total</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontSize: 13, color: "#374151", fontWeight: 600 }}>AED {pricePerUnit} / unit</span>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>{quantity} units</span>
              </div>
            </div>

            <div style={{ height: 1, background: "#E5E7EB", margin: "12px 0" }} />

            <button
              onClick={handleAddToCart}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                width: "100%", padding: "14px 20px",
                background: added ? "#16a34a" : "#2563EB",
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              {added ? <><Check size={18} /> Added to cart!</> : <><ShoppingCart size={18} /> Add to Cart — AED {totalPrice}</>}
            </button>

            <p style={{ margin: "10px 0 0", fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>
              Free cancellation within 1 hour of ordering · Secure checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function OptionSection({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        {required && <span style={{ color: "#EF4444", fontSize: 13 }}>*</span>}
      </div>
      {children}
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
      <span style={{ color: "#6B7280" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#111827" }}>{value}</span>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#F8F9FB",
    fontFamily: "system-ui,'Segoe UI',sans-serif",
    color: "#111827",
    display: "flex",
    flexDirection: "column",
  },
  topBar: {
    height: 52,
    background: "#fff",
    borderBottom: "1px solid #E2E5EC",
    display: "flex",
    alignItems: "center",
    padding: "0 24px",
    gap: 16,
    flexShrink: 0,
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    color: "#374151",
    fontWeight: 500,
    padding: "4px 0",
  },
  topBarTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
  },
  body: {
    display: "flex",
    flex: 1,
    maxWidth: 1100,
    margin: "0 auto",
    width: "100%",
    padding: "40px 24px",
    gap: 48,
    boxSizing: "border-box",
    alignItems: "flex-start",
  },
  previewCol: {
    width: 340,
    flexShrink: 0,
    position: "sticky",
    top: 72,
  },
  previewSticky: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  zoneRow: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    alignItems: "center",
  },
  specCard: {
    background: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: "14px 16px",
  },
  specCardTitle: {
    margin: "0 0 10px",
    fontSize: 11,
    fontWeight: 700,
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  },
  trustRow: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  trustChip: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: 12,
    color: "#374151",
    background: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    padding: "7px 12px",
  },
  optionsCol: {
    flex: 1,
    minWidth: 0,
  },
  heading: {
    margin: "0 0 6px",
    fontSize: 28,
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.5px",
  },
  subheading: {
    margin: "0 0 32px",
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 1.5,
  },
  qtySelect: {
    width: "100%",
    appearance: "none" as const,
    border: "1.5px solid #E5E7EB",
    borderRadius: 10,
    padding: "11px 40px 11px 14px",
    fontSize: 14,
    color: "#111827",
    background: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 500,
  },
  ctaBox: {
    background: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    position: "sticky",
    bottom: 24,
  },
};
