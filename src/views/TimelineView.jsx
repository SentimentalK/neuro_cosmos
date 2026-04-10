import { useTimelineData } from '../lib/useGraphData'

const TYPE_COLORS = {
  study_event: '#3b82f6',
  concept_note: '#a855f7',
  reflection: '#f97316',
  project_log: '#ec4899',
  ai_chat: '#10b981',
}

const TYPE_LABELS = {
  study_event: 'Study Event',
  concept_note: 'Concept Note',
  reflection: 'Reflection',
  project_log: 'Project Log',
  ai_chat: 'AI Chat',
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays <= 7) return `${diffDays}天前`
  return dateStr
}

export default function TimelineView({ active }) {
  const { data, loading } = useTimelineData()

  if (!active) return <div className="view hidden" />

  return (
    <div className={`view timeline-view ${active ? 'active' : 'hidden'}`}>
      <div className="timeline-inner">
        <h2 className="timeline-title">认知发育史 / 时间脉冲</h2>
        {loading && <p style={{ color: '#6b7280' }}>Loading...</p>}
        {data && (
          <div className="timeline-track">
            {data.events.map(event => (
              <div className="timeline-event" key={event.id}>
                <div
                  className={`timeline-dot ${event.type}`}
                  style={{ background: TYPE_COLORS[event.type] || '#666' }}
                />
                <div className="timeline-meta">
                  {formatDate(event.date)} · <span className="timeline-type" style={{ color: TYPE_COLORS[event.type] }}>
                    {TYPE_LABELS[event.type] || event.type}
                  </span>
                </div>
                <div className="timeline-card">
                  <h3>{event.title}</h3>
                  {event.summary && <p>{event.summary}</p>}
                  <div className="timeline-card-tags">
                    {event.topics.map(t => (
                      <span className="timeline-tag" key={t}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
