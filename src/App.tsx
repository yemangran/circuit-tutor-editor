import CircuitEditor from './features/circuit-editor/components/CircuitEditor'

const pageStyle = {
  minHeight: '100vh',
  padding: 24,
  background:
    'linear-gradient(180deg, #f8fafc 0%, #f8fafc 180px, #f1f5f9 100%)',
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr)',
  gap: 20,
}

const headerStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
}

const titleStyle = {
  margin: 0,
  fontSize: 30,
  lineHeight: 1.1,
  color: '#0f172a',
}

const descriptionStyle = {
  margin: '10px 0 0',
  maxWidth: 760,
  color: '#475569',
  lineHeight: 1.5,
}

const badgeStyle = {
  alignSelf: 'flex-start',
  padding: '8px 12px',
  borderRadius: 999,
  border: '1px solid #cbd5e1',
  background: '#ffffffcc',
  color: '#334155',
  fontSize: 12,
  fontWeight: 600,
  backdropFilter: 'blur(6px)',
}

const workspaceStyle = {
  minHeight: 0,
  border: '1px solid #cbd5e1',
  borderRadius: 24,
  background: '#fffcf5',
  boxShadow: '0 18px 60px rgba(15, 23, 42, 0.08)',
  padding: 20,
}

export default function App() {
  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Circuit Tutor Editor</h1>
          <p style={descriptionStyle}>
            Build teaching circuits visually, connect components on the canvas, and
            export a structured representation for AI reasoning.
          </p>
        </div>
        <div style={badgeStyle}>Structure -&gt; Semantics -&gt; Export</div>
      </header>
      <section style={workspaceStyle}>
        <CircuitEditor />
      </section>
    </main>
  )
}
