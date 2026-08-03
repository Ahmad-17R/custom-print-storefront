// Core types for the config-driven product customization canvas engine.

export type ProductShape = "flat" | "wraparound";
export type CanvasShape = "rectangle" | "rounded" | "circle" | "oval";

export interface GradientStop {
  color: string;
  position: number; // 0–100
}

export interface GradientConfig {
  type: "linear" | "radial";
  angle: number; // degrees, used for linear
  stops: GradientStop[]; // always exactly 2 for now
}

// ── Print option types ────────────────────────────────────────────────────────

export interface PrintOptionChoice {
  id: string;
  label: string;
  description?: string;
  priceDelta?: number;  // added to base price; 0 or omitted = included
  tag?: string;         // e.g. "Recommended"
}

export interface PrintOptionGroup {
  id: string;
  label: string;
  required: boolean;
  type: "radio" | "select"; // radio = visual card list, select = dropdown
  defaultChoice: string;    // choice id
  choices: PrintOptionChoice[];
}

// ── Template types ────────────────────────────────────────────────────────────

export interface TemplateZone {
  id: string;
  label: string;
  width: number;  // mm
  height: number; // mm
  bleed: number;  // mm
  safety: number; // mm, inward from bleed edge
}

export interface ProductTemplate {
  label: string;
  shape: ProductShape;
  canvasShape: CanvasShape;   // how the editing surface is clipped
  cornerRadius?: number;      // mm, only used when canvasShape = "rounded"
  unit: "mm";
  dpi: number;
  zones: TemplateZone[];
  basePrice: number;          // AED, base price for the minimum quantity
  quantities: number[];       // available order quantities
  printOptions: PrintOptionGroup[];
}

export type TemplateMap = Record<string, ProductTemplate>;

// ── Layer types ───────────────────────────────────────────────────────────────

export type LayerType = "text" | "image" | "shape";

interface BaseLayer {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  z: number;
  opacity: number; // 0–1
  visible: boolean;
}

export interface TextLayer extends BaseLayer {
  type: "text";
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline";
  textAlign: "left" | "center" | "right";
}

export interface ImageLayer extends BaseLayer {
  type: "image";
  src: string;
  flipH: boolean;
  flipV: boolean;
  objectFit: "contain" | "cover";
  borderRadius: number; // 0–50, where 50 = full circle
}

export interface ShapeLayer extends BaseLayer {
  type: "shape";
  fill: string;
  gradient: GradientConfig | null;
  borderRadius: number;
}

export type Layer = TextLayer | ImageLayer | ShapeLayer;

export type DragMode = "move" | "resize" | "rotate";

export interface DragState {
  mode: DragMode;
  id: string;
  startX: number;
  startY: number;
  orig: Layer;
  rectLeft: number;
  rectTop: number;
}
