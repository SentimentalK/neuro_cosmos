import { useState, useEffect } from 'react'

let graphCache = null
let timelineCache = null
let nodeIndexCache = null
const nodeDetailCache = new Map()

export function useGraphData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (graphCache) {
      setData(graphCache)
      setLoading(false)
      return
    }
    fetch('/data/graph.json')
      .then(r => r.json())
      .then(d => {
        graphCache = d
        setData(d)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load graph data:', err)
        setLoading(false)
      })
  }, [])

  return { data, loading }
}

export function useTimelineData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (timelineCache) {
      setData(timelineCache)
      setLoading(false)
      return
    }
    fetch('/data/timeline.json')
      .then(r => r.json())
      .then(d => {
        timelineCache = d
        setData(d)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load timeline data:', err)
        setLoading(false)
      })
  }, [])

  return { data, loading }
}

export function useNodeIndex() {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (nodeIndexCache) {
      setData(nodeIndexCache)
      return
    }
    fetch('/data/node-index.json')
      .then(r => r.json())
      .then(d => {
        nodeIndexCache = d
        setData(d)
      })
      .catch(err => console.error('Failed to load node index:', err))
  }, [])

  return data
}

export async function fetchNodeDetail(id) {
  if (nodeDetailCache.has(id)) return nodeDetailCache.get(id)
  try {
    const res = await fetch(`/data/nodes/${id}.json`)
    const data = await res.json()
    nodeDetailCache.set(id, data)
    return data
  } catch (err) {
    console.error(`Failed to load node detail for ${id}:`, err)
    return null
  }
}
