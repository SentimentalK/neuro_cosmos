export default function Header({ view, onViewChange }) {
  const views = [
    { id: 'universe', label: '神经宇宙' },
    { id: 'timeline', label: '时间生长流' },
    { id: 'domain', label: '领域剖面' },
  ]

  return (
    <header className="header">
      <div className="header-logo">
        KNOWLEDGE<span>_ORGANISM</span>
      </div>
      <nav className="header-nav">
        {views.map(v => (
          <button
            key={v.id}
            className={`nav-btn ${view === v.id ? 'active' : ''}`}
            onClick={() => onViewChange(v.id)}
          >
            {v.label}
          </button>
        ))}
      </nav>
      <div className="header-status">
        <span className="status-dot" />
        系统活跃中
      </div>
    </header>
  )
}
