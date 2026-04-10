import { useState, useEffect } from 'react'
import { useNodeIndex } from '../lib/useGraphData'

export default function DomainView({ active, selectedDomain, onDomainSelect }) {
  const nodeIndex = useNodeIndex()
  const [sortBy, setSortBy] = useState('size')

  if (!active) return <div className="view hidden" />

  const domains = nodeIndex?.nodes.filter(n => n.kind === 'domain') || []
  const currentDomain = selectedDomain
    ? nodeIndex?.nodes.find(n => n.id === selectedDomain)
    : domains[0]

  // Get topics that belong to this domain
  const topics = nodeIndex?.nodes
    .filter(n => n.kind !== 'domain' && n.domains?.includes(currentDomain?.id))
    .sort((a, b) => sortBy === 'activity' ? b.activity - a.activity : b.size - a.size) || []

  const maxSize = Math.max(...topics.map(t => t.size), 1)

  return (
    <div className={`view domain-view ${active ? 'active' : 'hidden'}`}>
      <div className="domain-inner">
        {currentDomain && (
          <>
            <div className="domain-header">
              <div
                className="domain-icon"
                style={{
                  background: `rgba(${currentDomain.color}, 0.15)`,
                  borderColor: `rgba(${currentDomain.color}, 0.6)`,
                  boxShadow: `0 0 30px rgba(${currentDomain.color}, 0.2)`,
                }}
              >
                {currentDomain.icon || '📁'}
              </div>
              <div className="domain-info">
                <div className="domain-info-label" style={{ color: `rgb(${currentDomain.color})` }}>Domain Profile</div>
                <h1>{currentDomain.title}</h1>
                <p>{currentDomain.summary}</p>
              </div>
            </div>

            {/* Domain selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {domains.map(d => (
                <button
                  key={d.id}
                  className={`sort-btn ${d.id === currentDomain.id ? 'active' : ''}`}
                  onClick={() => onDomainSelect(d.id)}
                  style={d.id === currentDomain.id ? { borderColor: `rgba(${d.color}, 0.5)`, color: `rgb(${d.color})` } : {}}
                >
                  {d.icon} {d.title}
                </button>
              ))}
            </div>

            <div className="domain-sort-bar">
              <span style={{ fontSize: 12, color: '#6b7280', marginRight: 4 }}>排序：</span>
              <button className={`sort-btn ${sortBy === 'size' ? 'active' : ''}`} onClick={() => setSortBy('size')}>
                沉淀体积
              </button>
              <button className={`sort-btn ${sortBy === 'activity' ? 'active' : ''}`} onClick={() => setSortBy('activity')}>
                近期活跃
              </button>
            </div>

            <div className="domain-grid">
              {groupByParent(topics, currentDomain.id).map(group => (
                <div className="domain-card" key={group.parent}>
                  <h3 className="domain-card-title">
                    <span className="domain-card-dot" style={{ background: `rgb(${currentDomain.color})` }} />
                    {group.parentTitle}
                  </h3>
                  {group.items.map(topic => (
                    <div className="topic-row" key={topic.id}>
                      <span className={`topic-name ${topic.activity > 0.7 ? 'topic-active' : ''}`}>
                        {topic.title}
                        {topic.activity > 0.7 ? ' (活跃)' : ''}
                      </span>
                      <span className="topic-bar">
                        <div
                          className="topic-bar-fill"
                          style={{
                            width: `${(topic.size / maxSize) * 100}%`,
                            background: `rgb(${currentDomain.color})`,
                          }}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              ))}

              {/* Ungrouped topics */}
              {topics.filter(t => !t.parent_display || t.parent_display === currentDomain.id).length > 0 && (() => {
                const ungrouped = topics.filter(t => !t.parent_display || t.parent_display === currentDomain.id)
                if (ungrouped.length === 0) return null
                return (
                  <div className="domain-card">
                    <h3 className="domain-card-title">
                      <span className="domain-card-dot" style={{ background: `rgb(${currentDomain.color})` }} />
                      直属主题
                    </h3>
                    {ungrouped.map(topic => (
                      <div className="topic-row" key={topic.id}>
                        <span className={`topic-name ${topic.activity > 0.7 ? 'topic-active' : ''}`}>
                          {topic.title}
                        </span>
                        <span className="topic-bar">
                          <div
                            className="topic-bar-fill"
                            style={{
                              width: `${(topic.size / maxSize) * 100}%`,
                              background: `rgb(${currentDomain.color})`,
                            }}
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function groupByParent(topics, domainId) {
  const groups = new Map()
  for (const t of topics) {
    const parent = t.parent_display
    if (!parent || parent === domainId) continue
    // Check if parent itself is a topic (not a domain)
    if (!groups.has(parent)) {
      const parentNode = topics.find(n => n.id === parent)
      groups.set(parent, {
        parent,
        parentTitle: parentNode?.title || parent,
        items: [],
      })
    }
    groups.get(parent).items.push(t)
  }
  return [...groups.values()]
}
