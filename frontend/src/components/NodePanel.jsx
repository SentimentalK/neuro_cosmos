import { useState, useEffect } from 'react'
import { fetchNodeDetail } from '../lib/useGraphData'

export default function NodePanel({ node, onClose, onExpand, canExpand }) {
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    if (!node) { setDetail(null); return }
    fetchNodeDetail(node.id).then(setDetail)
  }, [node?.id])

  if (!node) return null

  const maxSize = 60
  const volumePct = Math.min((node.size / maxSize) * 100, 100)

  return (
    <div className={`node-panel ${node ? 'open' : ''}`}>
      <div className="panel-header">
        <h2 className="panel-title">{node.icon ? `${node.icon} ` : ''}{node.title}</h2>
        <button className="panel-close" onClick={onClose}>✕</button>
      </div>

      <div className="panel-tags">
        <span className="tag tag-kind">{node.kind}</span>
        <span className="tag tag-status">{node.status}</span>
        {node.activity > 0.7 && <span className="tag tag-kind" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', borderColor: 'rgba(16,185,129,0.25)' }}>活跃</span>}
      </div>

      {node.summary && (
        <div className="panel-section">
          <div className="panel-section-title">简介</div>
          <p className="panel-summary">{node.summary}</p>
        </div>
      )}

      <div className="panel-section">
        <div className="panel-section-title">沉淀体积</div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${volumePct}%` }} />
        </div>
      </div>

      {detail && detail.structural_edges.length > 0 && (
        <div className="panel-section">
          <div className="panel-section-title">骨架关系</div>
          <ul className="panel-links">
            {detail.structural_edges.map((e, i) => {
              const other = e.source === node.id ? e.target : e.source
              const dir = e.source === node.id ? '→' : '←'
              return (
                <li key={i}>
                  <span>{dir}</span>
                  <span className="link-target">{other}</span>
                  <span style={{ color: '#6b7280', fontSize: 11 }}>{e.type}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {detail && detail.emergent_edges.length > 0 && (
        <div className="panel-section">
          <div className="panel-section-title">生长关系</div>
          <ul className="panel-links">
            {detail.emergent_edges.map((e, i) => {
              const other = e.source === node.id ? e.target : e.source
              return (
                <li key={i}>
                  <span>⟷</span>
                  <span className="link-target" style={{ color: '#fbbf24' }}>{other}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {detail && detail.entries.length > 0 && (
        <div className="panel-section">
          <div className="panel-section-title">相关记录 ({detail.entries.length})</div>
          <ul className="panel-entries">
            {detail.entries.slice(0, 5).map(e => (
              <li key={e.id}>
                <span className="entry-title">{e.title}</span>
                <span className="entry-date">{e.date}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {detail && detail.notes.length > 0 && (
        <div className="panel-section">
          <div className="panel-section-title">笔记 ({detail.notes.length})</div>
          <ul className="panel-entries">
            {detail.notes.map(n => (
              <li key={n.id}>
                <span className="entry-title">{n.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canExpand && (
        <button className="expand-btn" onClick={onExpand}>
          向外展开子节点
        </button>
      )}
    </div>
  )
}
