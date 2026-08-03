import type { ReactNode } from 'react'

type PageShellProps = {
  title: string
  description: string
  children: ReactNode
}

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <section
      style={{
        display: 'grid',
        gap: '1rem',
        padding: '1.5rem',
        borderRadius: '12px',
        background: '#fff',
        boxShadow: '0 6px 20px rgba(15, 23, 42, 0.06)',
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#475569' }}>{description}</p>
      </div>
      <div>{children}</div>
    </section>
  )
}
