import type { TemplateMap, PrintOptionGroup } from "./types";

// ── Shared option groups ──────────────────────────────────────────────────────

const STOCK_OPTIONS: PrintOptionGroup = {
  id: "stock",
  label: "Paper Stock",
  required: true,
  type: "radio",
  defaultChoice: "matte",
  choices: [
    { id: "matte",      label: "Matte",      description: "Coated & classic, smooth shine-free finish.",       priceDelta: 0  },
    { id: "glossy",     label: "Glossy",     description: "Sleek & shiny with a light-catching front.",        priceDelta: 7  },
    { id: "pearl",      label: "Pearl",      description: "A shimmering stock with a soft glow.",             priceDelta: 55 },
    { id: "soft_touch", label: "Soft Touch", description: "Unique matte finish — textured like fine sand.",    priceDelta: 55 },
    { id: "kraft",      label: "Kraft",      description: "Light brown, 80% post-consumer recycled paper.",   priceDelta: 55 },
  ],
};

const FINISH_OPTIONS: PrintOptionGroup = {
  id: "finish",
  label: "Finish",
  required: false,
  type: "radio",
  defaultChoice: "none",
  choices: [
    { id: "none",           label: "None",           description: "Standard print finish.",                            priceDelta: 0  },
    { id: "foil_accent",    label: "Foil Accent",    description: "Shimmering foil makes your design eye-catching.",   priceDelta: 48 },
    { id: "embossed_gloss", label: "Embossed Gloss", description: "Raised, glossy finish on text and images.",        priceDelta: 48 },
  ],
};

const THICKNESS_OPTIONS: PrintOptionGroup = {
  id: "thickness",
  label: "Paper Thickness",
  required: true,
  type: "radio",
  defaultChoice: "standard",
  choices: [
    { id: "standard",     label: "Standard",     description: "A traditional business card paper.",              priceDelta: 0  },
    { id: "premium",      label: "Premium",      description: "Sturdy, high-quality look and feel.",             priceDelta: 15, tag: "Recommended" },
    { id: "premium_plus", label: "Premium Plus", description: "A noticeably thicker, heavier paper.",            priceDelta: 33 },
  ],
};

// ── Templates ─────────────────────────────────────────────────────────────────

export const TEMPLATES: TemplateMap = {

  // ── Standard business card (square corners) ───────────────────────────────
  business_card: {
    label: "Business Card — Standard",
    shape: "flat",
    canvasShape: "rectangle",
    unit: "mm",
    dpi: 300,
    basePrice: 36,
    quantities: [50, 100, 250, 500, 1000],
    zones: [
      { id: "front", label: "Front", width: 90, height: 54, bleed: 3, safety: 3 },
      { id: "back",  label: "Back",  width: 90, height: 54, bleed: 3, safety: 3 },
    ],
    printOptions: [
      THICKNESS_OPTIONS,
      STOCK_OPTIONS,
      FINISH_OPTIONS,
      {
        id: "corners",
        label: "Corners",
        required: true,
        type: "radio",
        defaultChoice: "standard",
        choices: [
          { id: "standard", label: "Standard", description: "Traditional square corners for a crisp, clean look.", priceDelta: 0  },
          { id: "rounded",  label: "Rounded",  description: "Quarter-inch rounded corners for a modern touch.",   priceDelta: 26 },
        ],
      },
    ],
  },

  // ── Rounded corners ───────────────────────────────────────────────────────
  business_card_rounded: {
    label: "Business Card — Rounded Corners",
    shape: "flat",
    canvasShape: "rounded",
    cornerRadius: 4, // mm
    unit: "mm",
    dpi: 300,
    basePrice: 59,
    quantities: [50, 100, 250, 500, 1000],
    zones: [
      { id: "front", label: "Front", width: 90, height: 54, bleed: 3, safety: 3 },
      { id: "back",  label: "Back",  width: 90, height: 54, bleed: 3, safety: 3 },
    ],
    printOptions: [
      THICKNESS_OPTIONS,
      STOCK_OPTIONS,
      FINISH_OPTIONS,
    ],
  },

  // ── Square ────────────────────────────────────────────────────────────────
  business_card_square: {
    label: "Business Card — Square",
    shape: "flat",
    canvasShape: "rectangle",
    unit: "mm",
    dpi: 300,
    basePrice: 68,
    quantities: [50, 100, 250, 500, 1000],
    zones: [
      { id: "front", label: "Front", width: 64, height: 64, bleed: 3, safety: 3 },
      { id: "back",  label: "Back",  width: 64, height: 64, bleed: 3, safety: 3 },
    ],
    printOptions: [
      THICKNESS_OPTIONS,
      STOCK_OPTIONS,
      FINISH_OPTIONS,
      {
        id: "corners",
        label: "Corners",
        required: true,
        type: "radio",
        defaultChoice: "standard",
        choices: [
          { id: "standard", label: "Standard", description: "Traditional square corners.",    priceDelta: 0  },
          { id: "rounded",  label: "Rounded",  description: "Softly rounded corners.",        priceDelta: 26 },
        ],
      },
    ],
  },

  // ── Circle ────────────────────────────────────────────────────────────────
  business_card_circle: {
    label: "Business Card — Circle",
    shape: "flat",
    canvasShape: "circle",
    unit: "mm",
    dpi: 300,
    basePrice: 99,
    quantities: [50, 100, 250, 500],
    zones: [
      { id: "front", label: "Front", width: 64, height: 64, bleed: 3, safety: 3 },
      { id: "back",  label: "Back",  width: 64, height: 64, bleed: 3, safety: 3 },
    ],
    printOptions: [
      THICKNESS_OPTIONS,
      STOCK_OPTIONS,
      FINISH_OPTIONS,
    ],
  },

  // ── Oval ──────────────────────────────────────────────────────────────────
  business_card_oval: {
    label: "Business Card — Oval",
    shape: "flat",
    canvasShape: "oval",
    unit: "mm",
    dpi: 300,
    basePrice: 99,
    quantities: [50, 100, 250, 500],
    zones: [
      { id: "front", label: "Front", width: 90, height: 54, bleed: 3, safety: 3 },
      { id: "back",  label: "Back",  width: 90, height: 54, bleed: 3, safety: 3 },
    ],
    printOptions: [
      THICKNESS_OPTIONS,
      STOCK_OPTIONS,
      FINISH_OPTIONS,
    ],
  },

  // ── Letterhead (A4) ──────────────────────────────────────────────────────
  letterhead: {
    label: "Letterhead (A4)",
    shape: "flat",
    canvasShape: "rectangle",
    unit: "mm",
    dpi: 300,
    basePrice: 89,
    quantities: [50, 100, 250, 500, 1000],
    zones: [
      { id: "front", label: "Front", width: 210, height: 297, bleed: 3, safety: 5 },
    ],
    printOptions: [
      THICKNESS_OPTIONS,
      STOCK_OPTIONS,
      {
        id: "color_mode",
        label: "Color Mode",
        required: true,
        type: "radio",
        defaultChoice: "full_color",
        choices: [
          { id: "full_color",  label: "Full Color",   description: "Vibrant CMYK print across the full page.",       priceDelta: 0  },
          { id: "single_spot", label: "Single Spot Color", description: "One PMS color — ideal for logo-only headers.", priceDelta: -20 },
        ],
      },
      {
        id: "sides",
        label: "Printing Sides",
        required: true,
        type: "radio",
        defaultChoice: "single",
        choices: [
          { id: "single", label: "Single-sided", description: "Printed on one side only.",   priceDelta: 0  },
          { id: "double", label: "Double-sided", description: "Printed on both sides.",       priceDelta: 35 },
        ],
      },
    ],
  },

  // ── Pen ───────────────────────────────────────────────────────────────────
  pen: {
    label: "Pen (Barrel Wrap)",
    shape: "wraparound",
    canvasShape: "rectangle",
    unit: "mm",
    dpi: 300,
    basePrice: 18,
    quantities: [25, 50, 100, 250, 500],
    zones: [
      { id: "barrel", label: "Barrel (unwrapped)", width: 130, height: 24, bleed: 2, safety: 2 },
    ],
    printOptions: [
      {
        id: "pen_style",
        label: "Pen Style",
        required: true,
        type: "radio",
        defaultChoice: "ballpoint",
        choices: [
          { id: "ballpoint", label: "Ballpoint",  description: "Classic smooth writing. Black ink.",       priceDelta: 0  },
          { id: "gel",       label: "Gel",        description: "Smooth gel ink. Available in black/blue.", priceDelta: 9  },
          { id: "stylus",    label: "Stylus Tip", description: "Ballpoint with capacitive stylus tip.",    priceDelta: 18 },
        ],
      },
      {
        id: "barrel_color",
        label: "Barrel Color",
        required: true,
        type: "radio",
        defaultChoice: "white",
        choices: [
          { id: "white",  label: "White",  description: "Clean white — best for full-color prints.", priceDelta: 0 },
          { id: "black",  label: "Black",  description: "Sleek black barrel.",                       priceDelta: 0 },
          { id: "silver", label: "Silver", description: "Metallic silver barrel.",                   priceDelta: 7 },
        ],
      },
      {
        id: "ink_color",
        label: "Ink Color",
        required: true,
        type: "radio",
        defaultChoice: "black_ink",
        choices: [
          { id: "black_ink", label: "Black", description: "Standard black ink.", priceDelta: 0 },
          { id: "blue_ink",  label: "Blue",  description: "Classic blue ink.",   priceDelta: 0 },
          { id: "red_ink",   label: "Red",   description: "Bold red ink.",       priceDelta: 0 },
        ],
      },
    ],
  },
};
