// Small inline SVG icons for admin action buttons. Sized to the current font by default
// (width/height = 1em) and inherit colour via `stroke="currentColor"`.
type IconProps = { size?: number | string; style?: React.CSSProperties }
const base = (size: IconProps['size']): React.SVGProps<SVGSVGElement> => ({
  width: size ?? '1em', height: size ?? '1em', viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
})

export function TruckIcon({ size, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ flexShrink: 0, ...style }} aria-hidden>
      <path d="M1 3h13v10H1z" />
      <path d="M14 8h4l3 3v2h-7z" />
      <circle cx="5.5" cy="16.5" r="1.8" />
      <circle cx="17.5" cy="16.5" r="1.8" />
    </svg>
  )
}

export function PrinterIcon({ size, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ flexShrink: 0, ...style }} aria-hidden>
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </svg>
  )
}

export function PencilIcon({ size, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ flexShrink: 0, ...style }} aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  )
}

export function PinIcon({ size, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ flexShrink: 0, ...style }} aria-hidden>
      <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function BulbIcon({ size, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ flexShrink: 0, ...style }} aria-hidden>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.1 14c.8-1 2.1-2 2.4-3.3a6 6 0 1 0-11 0c.3 1.3 1.6 2.3 2.4 3.3.5.7.6 1.3.6 2h4.4c0-.7.1-1.3.6-2z" />
    </svg>
  )
}

export function CheckIcon({ size, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ flexShrink: 0, ...style }} aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function InvoiceIcon({ size, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ flexShrink: 0, ...style }} aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h8" />
      <path d="M8 9h2" />
    </svg>
  )
}
