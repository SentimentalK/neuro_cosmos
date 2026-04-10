/**
 * D3 Universe Engine
 * Renders the Neuro Cosmos force-directed graph with nebula-style nodes
 * Completely independent from React — communicates via callbacks
 */

import * as d3 from 'd3'

export function createUniverse(container, graphData, { onNodeClick }) {
  const width = container.clientWidth
  const height = container.clientHeight

  // Clear previous
  d3.select(container).selectAll('*').remove()

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  // Zoom
  const zoomBehavior = d3.zoom()
    .scaleExtent([0.1, 5])
    .on('zoom', (e) => {
      g.attr('transform', e.transform)
      starBgGroup.attr('transform',
        `translate(${e.transform.x * 0.2}, ${e.transform.y * 0.2}) scale(${e.transform.k * 0.8})`)
    })

  svg.call(zoomBehavior)

  // Background stars (parallax layer)
  const starBgGroup = svg.append('g').attr('class', 'stars-bg')
  const bgStars = d3.range(300).map(() => ({
    x: (Math.random() - 0.5) * width * 4 + width / 2,
    y: (Math.random() - 0.5) * height * 4 + height / 2,
    r: Math.random() * 1.5,
    opacity: Math.random() * 0.8 + 0.2,
  }))
  starBgGroup.selectAll('circle').data(bgStars).enter().append('circle')
    .attr('cx', d => d.x).attr('cy', d => d.y).attr('r', d => d.r)
    .attr('fill', '#ffffff').attr('opacity', d => d.opacity)

  // Main group
  const g = svg.append('g')



  // Foreground stars
  const starGroup = g.append('g').attr('class', 'stars-fg')
  const fgStars = d3.range(150).map(() => ({
    x: (Math.random() - 0.5) * width * 2,
    y: (Math.random() - 0.5) * height * 2,
    r: Math.random() * 2,
    color: ['#fff', '#93c5fd', '#d8b4fe'][Math.floor(Math.random() * 3)],
  }))
  starGroup.selectAll('circle').data(fgStars).enter().append('circle')
    .attr('cx', d => d.x).attr('cy', d => d.y).attr('r', d => d.r)
    .attr('fill', d => d.color).attr('opacity', 0.6)

  // State
  const allNodes = graphData.nodes.map(d => ({ ...d, expanded: false }))
  const allEdges = graphData.edges.map(d => ({ ...d }))

  // Current visible set (start with level 1 only)
  let currentNodes = allNodes.filter(n => n.level === 1).map(d => ({ ...d }))
  let currentEdges = allEdges.filter(e =>
    currentNodes.find(n => n.id === (typeof e.source === 'string' ? e.source : e.source.id)) &&
    currentNodes.find(n => n.id === (typeof e.target === 'string' ? e.target : e.target.id))
  ).map(d => ({ ...d }))

  const linkGroup = g.append('g').attr('class', 'links')
  const nodeGroup = g.append('g').attr('class', 'nodes')
  const labelGroup = g.append('g').attr('class', 'labels')

  // Simulation
  const simulation = d3.forceSimulation()
    .force('link', d3.forceLink().id(d => d.id).distance(d => d.is_structural ? 90 : 160))
    .force('charge', d3.forceManyBody().strength(-450))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius(d => d.size + 12).iterations(2))

  function updateGraph() {
    // Links
    const link = linkGroup.selectAll('line').data(currentEdges, d => `${d.source.id || d.source}-${d.target.id || d.target}`)
    link.exit().transition().duration(300).attr('stroke-opacity', 0).remove()
    const linkEnter = link.enter().append('line')
      .attr('stroke', d => !d.is_structural ? '#fbbf24' : '#333')
      .attr('stroke-width', d => Math.sqrt(d.weight) * 1.5)
      .attr('stroke-opacity', 0)
      .attr('class', d => !d.is_structural ? 'link-pulse' : '')
    linkEnter.transition().duration(500).attr('stroke-opacity', 0.6)
    const linkMerged = linkEnter.merge(link)

    // Nodes
    const node = nodeGroup.selectAll('g.node').data(currentNodes, d => d.id)
    node.exit().transition().duration(300).style('opacity', 0).remove()

    const nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => {
        const parent = currentNodes.find(n => n.id === d.parent_display)
        return `translate(${parent?.x ?? width / 2}, ${parent?.y ?? height / 2})`
      })
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x; d.fy = d.y
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null; d.fy = null
        })
      )
      .on('click', (event, d) => {
        event.stopPropagation()
        onNodeClick(d)
      })

    // Isolate breathing animation down to an inner graphics group
    const innerNode = nodeEnter.append('g')
      .attr('class', d => d.activity > 0.7 ? 'breathe' : '')
    
    // Outer nebula (Performant concentric circle)
    innerNode.append('circle').attr('class', 'outer1').attr('r', 0)
      .attr('fill', d => `rgba(${d.color}, ${0.05 + d.activity * 0.05})`)
    
    // Mid outer
    innerNode.append('circle').attr('class', 'outer2').attr('r', 0)
      .attr('fill', d => `rgba(${d.color}, ${0.1 + d.activity * 0.1})`)

    // Mid inner
    innerNode.append('circle').attr('class', 'mid').attr('r', 0)
      .attr('fill', d => `rgba(${d.color}, ${0.2 + d.activity * 0.25})`)
    
    // Core
    innerNode.append('circle').attr('class', 'core').attr('r', 0)
      .attr('fill', '#ffffff').attr('opacity', d => 0.6 + d.activity * 0.4)

    // Animate in
    innerNode.selectAll('.outer1').transition().duration(800).attr('r', d => d.size * 2.5)
    innerNode.selectAll('.outer2').transition().duration(800).attr('r', d => d.size * 1.5)
    innerNode.selectAll('.mid').transition().duration(800).attr('r', d => d.size * 0.9)
    innerNode.selectAll('.core').transition().duration(800).attr('r', d => d.size * 0.15)

    const nodeMerged = nodeEnter.merge(node)

    // Labels
    const label = labelGroup.selectAll('text').data(currentNodes, d => d.id)
    label.exit().transition().duration(300).style('opacity', 0).remove()
    const labelEnter = label.enter().append('text')
      .text(d => d.title)
      .attr('font-size', d => d.level === 1 ? '14px' : '11px')
      .attr('font-weight', d => d.level === 1 ? '600' : '400')
      .attr('fill', d => d.activity > 0.7 ? '#fff' : '#9ca3af')
      .attr('dy', d => d.size * 1.2 + 15)
      .attr('text-anchor', 'middle')
      .style('pointer-events', 'none')
      .style('opacity', 0)
    labelEnter.transition().duration(500).style('opacity', 0.8)
    const labelMerged = labelEnter.merge(label)

    // Restart simulation
    simulation.nodes(currentNodes)
    simulation.force('link').links(currentEdges)
    simulation.alpha(1).restart()

    simulation.on('tick', () => {
      linkMerged
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
      nodeMerged.attr('transform', d => `translate(${d.x}, ${d.y})`)
      labelMerged.attr('x', d => d.x).attr('y', d => d.y)
    })
  }

  // Expand a node to show its children
  function expandNode(parentId) {
    const parentNode = currentNodes.find(n => n.id === parentId)
    if (!parentNode || parentNode.expanded) return false

    parentNode.expanded = true

    // Add children
    const children = allNodes.filter(n => n.parent_display === parentId && !currentNodes.find(cn => cn.id === n.id))
    if (children.length === 0) return false

    currentNodes.push(...children.map(c => ({ ...c })))

    // Add edges where both endpoints are now visible
    for (const e of allEdges) {
      const sId = typeof e.source === 'string' ? e.source : e.source.id
      const tId = typeof e.target === 'string' ? e.target : e.target.id
      const alreadyExists = currentEdges.some(ce => {
        const csId = typeof ce.source === 'string' ? ce.source : ce.source.id
        const ctId = typeof ce.target === 'string' ? ce.target : ce.target.id
        return (csId === sId && ctId === tId) || (csId === tId && ctId === sId)
      })
      if (!alreadyExists && currentNodes.find(n => n.id === sId) && currentNodes.find(n => n.id === tId)) {
        currentEdges.push({ ...e })
      }
    }

    // Pulse animation on parent
    d3.selectAll('g.node').filter(d => d.id === parentId).selectAll('.mid')
      .transition().duration(200).attr('r', parentNode.size * 1.2)
      .transition().duration(400).attr('r', parentNode.size * 0.9)

    updateGraph()
    return true
  }

  function hasHiddenChildren(nodeId) {
    return allNodes.some(n => n.parent_display === nodeId && !currentNodes.find(cn => cn.id === n.id))
  }

  // Initial render
  updateGraph()

  function focusNode(nodeId) {
    const node = currentNodes.find(n => n.id === nodeId)
    if (!node) return
    const scale = 1.2
    const tx = width / 4 - node.x * scale
    const ty = height / 2 - node.y * scale
    svg.transition().duration(750)
      .call(zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(scale))
  }

  function resetView() {
    svg.transition().duration(750)
      .call(zoomBehavior.transform, d3.zoomIdentity)
  }

  // Resize handler
  const handleResize = () => {
    const w = container.clientWidth
    const h = container.clientHeight
    svg.attr('width', w).attr('height', h)
    simulation.force('center', d3.forceCenter(w / 2, h / 2))
    simulation.alpha(0.3).restart()
  }
  window.addEventListener('resize', handleResize)

  // Return API
  return {
    expandNode,
    hasHiddenChildren,
    focusNode,
    resetView,
    destroy() {
      window.removeEventListener('resize', handleResize)
      simulation.stop()
      d3.select(container).selectAll('*').remove()
    },
  }
}
