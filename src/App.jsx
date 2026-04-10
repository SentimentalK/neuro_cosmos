import { useState, useCallback } from 'react'
import Header from './components/Header'
import UniverseView from './views/UniverseView'
import TimelineView from './views/TimelineView'
import DomainView from './views/DomainView'

export default function App() {
  const [view, setView] = useState('universe')
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedDomain, setSelectedDomain] = useState(null)

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node)
  }, [])

  const handleDomainSelect = useCallback((domain) => {
    setSelectedDomain(domain)
    setView('domain')
  }, [])

  return (
    <>
      <Header view={view} onViewChange={setView} />
      <main className="main-content">
        <UniverseView
          active={view === 'universe'}
          selectedNode={selectedNode}
          onNodeClick={handleNodeClick}
          onClosePanel={() => setSelectedNode(null)}
          onDomainSelect={handleDomainSelect}
        />
        <TimelineView active={view === 'timeline'} />
        <DomainView
          active={view === 'domain'}
          selectedDomain={selectedDomain}
          onDomainSelect={setSelectedDomain}
        />
      </main>
    </>
  )
}
