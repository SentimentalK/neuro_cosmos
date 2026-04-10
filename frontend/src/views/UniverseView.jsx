import { useRef, useEffect, useCallback, useState } from 'react'
import { useGraphData } from '../lib/useGraphData'
import { createUniverse } from '../lib/d3Universe'
import NodePanel from '../components/NodePanel'

export default function UniverseView({ active, selectedNode, onNodeClick, onClosePanel, onDomainSelect }) {
  const containerRef = useRef(null)
  const universeRef = useRef(null)
  const [canExpand, setCanExpand] = useState(false)
  const { data, loading } = useGraphData()

  useEffect(() => {
    if (!data || !containerRef.current) return

    const universe = createUniverse(containerRef.current, data, {
      onNodeClick: (node) => {
        onNodeClick(node)
      },
    })
    universeRef.current = universe

    return () => universe.destroy()
  }, [data])

  // Update canExpand and camera pan when selected node changes
  useEffect(() => {
    if (selectedNode && universeRef.current) {
      setCanExpand(universeRef.current.hasHiddenChildren(selectedNode.id))
      universeRef.current.focusNode(selectedNode.id)
    } else {
      setCanExpand(false)
      if (universeRef.current) {
        universeRef.current.resetView()
      }
    }
  }, [selectedNode])

  const handleExpand = useCallback(() => {
    if (selectedNode && universeRef.current) {
      universeRef.current.expandNode(selectedNode.id)
      setCanExpand(false)
      onClosePanel()
    }
  }, [selectedNode, onClosePanel])

  return (
    <div className={`view ${active ? 'active' : 'hidden'}`}>
      <div ref={containerRef} className="universe-container" />

      <NodePanel
        node={selectedNode}
        onClose={onClosePanel}
        onExpand={handleExpand}
        canExpand={canExpand}
      />

      <div className="legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#3b82f6' }} />
          体积 = 知识沉淀厚度
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#666', boxShadow: '0 0 8px #fff', border: '1px solid #fff' }} />
          亮度 = 近期活跃度
        </div>
        <div className="legend-item">
          <span className="legend-line" />
          粗细 = 关联强度
        </div>
      </div>
    </div>
  )
}
