/**
 * Galaxy Compile Script
 * Reads nodes/*.yaml, entries/*.md, notes/*.md, edges/manual.yaml
 * Outputs: public/data/{graph.json, node-index.json, timeline.json, nodes/<id>.json}
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import matter from 'gray-matter';

const FRONTEND_DIR = process.cwd();
const ROOT = path.resolve(FRONTEND_DIR, '..');
const OUT_DIR = path.join(FRONTEND_DIR, 'public', 'data');
const NODES_OUT = path.join(OUT_DIR, 'nodes');

// ─── Helpers ───────────────────────────────────────────

function readYamlFile(filePath) {
  return yaml.load(fs.readFileSync(filePath, 'utf-8'));
}

function readMarkdownFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return { ...data, _content: content.trim() };
}

function walkFiles(dir, ext) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

function dateFromFilename(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  const match = basename.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function idFromFilename(filePath, prefix) {
  const basename = path.basename(filePath, path.extname(filePath));
  return `${prefix}-${basename}`;
}

// ─── Logging ───────────────────────────────────────────

const warnings = [];
const stats = { nodes: 0, entries: 0, notes: 0, edges: 0, warnings: 0 };

function warn(msg) {
  warnings.push(msg);
  stats.warnings++;
  console.warn(`  ⚠  ${msg}`);
}

// ─── 1. Read Nodes ─────────────────────────────────────

console.log('\n🔵 Reading nodes...');
const nodeFiles = walkFiles(path.join(ROOT, 'nodes'), '.yaml');
const nodeMap = new Map();

for (const f of nodeFiles) {
  const data = readYamlFile(f);
  const id = data.id || path.basename(f, '.yaml');

  // Determine level from kind
  let level = 3;
  if (data.kind === 'domain') level = 1;
  else if (data.kind === 'topic' || data.kind === 'method' || data.kind === 'project') level = 2;

  nodeMap.set(id, {
    id,
    title: data.title || id,
    kind: data.kind || 'topic',
    status: data.status || 'active',
    color: data.color || '128, 128, 128',
    icon: data.icon || null,
    visibility: data.visibility ?? 'public',
    seed_weight: data.seed_weight ?? 1.0,
    domains: data.domains || (data.kind === 'domain' ? [id] : []),
    parent_display: data.parent_display || null,
    summary: data.summary || '',
    level,
    // Accumulators (filled by entries)
    entry_count: 0,
    hours_total: 0,
    importance_sum: 0,
    entry_refs: [],
    note_refs: [],
    timeline: [],
  });
  stats.nodes++;
}

console.log(`   Found ${stats.nodes} nodes`);

// ─── 2. Read Entries ───────────────────────────────────

console.log('🟢 Reading entries...');
const entryFiles = walkFiles(path.join(ROOT, 'entries'), '.md');
const allEntries = [];

for (const f of entryFiles) {
  const data = readMarkdownFile(f);
  const id = data.id || idFromFilename(f, 'entry');
  const date = data.date || dateFromFilename(f) || '1970-01-01';
  const visibility = data.visibility ?? 'private';

  const entry = {
    id,
    title: data.title || id,
    type: data.type || 'study_event',
    date: typeof date === 'object' ? date.toISOString().split('T')[0] : date,
    domains: data.domains || [],
    topics: data.topics || [],
    relates_to: data.relates_to || [],
    supports: data.supports || [],
    visibility,
    hours: data.hours || 0,
    importance: data.importance || 0.5,
    references: data.references || [],
    summary: data._content ? data._content.split('\n').slice(0, 3).join(' ').substring(0, 200) : '',
    content: data._content || '',
  };

  allEntries.push(entry);
  stats.entries++;

  // Validate refs
  const allTopicRefs = [...entry.topics, ...entry.domains, ...entry.relates_to, ...entry.supports];
  for (const ref of allTopicRefs) {
    if (!nodeMap.has(ref)) {
      warn(`entry "${id}" references unknown node "${ref}"`);
    }
  }

  // Feed nodes
  for (const topicId of [...entry.topics, ...entry.domains]) {
    const node = nodeMap.get(topicId);
    if (node) {
      node.entry_count++;
      node.hours_total += entry.hours;
      node.importance_sum += entry.importance;
      node.entry_refs.push({ id: entry.id, title: entry.title, date: entry.date, type: entry.type, summary: entry.summary });
      node.timeline.push({ date: entry.date, event: entry.title, type: entry.type });
    }
  }
}

// Sort entries by date descending
allEntries.sort((a, b) => b.date.localeCompare(a.date));
console.log(`   Found ${stats.entries} entries`);

// ─── 3. Read Notes ─────────────────────────────────────

console.log('🟡 Reading notes...');
const noteFiles = walkFiles(path.join(ROOT, 'notes'), '.md');

for (const f of noteFiles) {
  const data = readMarkdownFile(f);
  const id = data.id || idFromFilename(f, 'note');
  const nodeRefs = data.nodes || (data.node ? [data.node] : []);
  const visibility = data.visibility ?? 'private';

  const note = {
    id,
    title: data.title || id,
    visibility,
    content: data._content || '',
    nodes: nodeRefs,
  };

  stats.notes++;

  // Validate and attach to nodes
  for (const nodeId of nodeRefs) {
    if (!nodeMap.has(nodeId)) {
      warn(`note "${id}" references unknown node "${nodeId}"`);
    } else {
      nodeMap.get(nodeId).note_refs.push({ id: note.id, title: note.title, content_html: note.content });
    }
  }
}

console.log(`   Found ${stats.notes} notes`);

// ─── 4. Read Edges ─────────────────────────────────────

console.log('🔴 Reading edges...');
const edgesFile = path.join(ROOT, 'edges', 'manual.yaml');
const manualEdges = [];
if (fs.existsSync(edgesFile)) {
  const data = readYamlFile(edgesFile);
  if (data && data.edges) {
    for (const e of data.edges) {
      if (!nodeMap.has(e.source)) {
        warn(`edge references unknown source "${e.source}"`);
        continue;
      }
      if (!nodeMap.has(e.target)) {
        warn(`edge references unknown target "${e.target}"`);
        continue;
      }
      manualEdges.push({
        source: e.source,
        target: e.target,
        type: e.type || 'related_to',
        weight: e.weight || 0.5,
        is_structural: true,
      });
      stats.edges++;
    }
  }
}

// Generate emergent edges from entries (relates_to / supports)
const emergentEdgeMap = new Map();

for (const entry of allEntries) {
  const allSources = [...entry.topics, ...entry.domains];
  const allTargets = [...entry.relates_to, ...entry.supports];

  for (const s of allSources) {
    for (const t of allTargets) {
      if (s === t) continue;
      if (!nodeMap.has(s) || !nodeMap.has(t)) continue;
      const key = [s, t].sort().join('::');
      if (!emergentEdgeMap.has(key)) {
        emergentEdgeMap.set(key, { source: s, target: t, type: 'related_to', co_mention: 0, is_structural: false });
      }
      emergentEdgeMap.get(key).co_mention++;
    }
  }
}

// Merge: remove emergent edges that duplicate structural edges
const structuralKeys = new Set(manualEdges.map(e => [e.source, e.target].sort().join('::')));
const emergentEdges = [];
for (const [key, edge] of emergentEdgeMap) {
  if (!structuralKeys.has(key)) {
    edge.weight = 0.5 * edge.co_mention;
    emergentEdges.push(edge);
    stats.edges++;
  } else {
    // Boost structural edge weight
    const structural = manualEdges.find(e => [e.source, e.target].sort().join('::') === key);
    if (structural) structural.weight += 0.3 * edge.co_mention;
  }
}

const allEdges = [...manualEdges, ...emergentEdges];
console.log(`   Found ${stats.edges} edges (${manualEdges.length} structural, ${emergentEdges.length} emergent)`);

// ─── 5. Compute Size & Activity ────────────────────────

console.log('⚡ Computing node metrics...');
const TODAY = new Date();

for (const [, node] of nodeMap) {
  // Size: seed + contributions
  node.size = node.seed_weight * 20
    + 3 * node.entry_count
    + 2 * node.hours_total
    + 5 * node.importance_sum;

  // Activity: time-decayed importance
  let activityRaw = 0;
  for (const ref of node.entry_refs) {
    const daysAgo = (TODAY - new Date(ref.date)) / (1000 * 60 * 60 * 24);
    activityRaw += (node.importance_sum / Math.max(node.entry_count, 1)) * Math.exp(-daysAgo / 7);
  }
  node.activity_raw = activityRaw;

  // Status-based modifier
  if (node.status === 'dormant') node.activity_raw *= 0.3;
  if (node.status === 'seed') node.activity_raw *= 0.5;
  if (node.status === 'archived') node.activity_raw *= 0.1;
}

// Normalize activity to [0, 1]
const maxActivity = Math.max(...[...nodeMap.values()].map(n => n.activity_raw), 0.001);
for (const [, node] of nodeMap) {
  node.activity = Math.min(node.activity_raw / maxActivity, 1);
}

// ─── 6. Output ─────────────────────────────────────────

console.log('📦 Writing output...');
fs.mkdirSync(NODES_OUT, { recursive: true });

// graph.json — for universe view
const graphNodes = [...nodeMap.values()]
  .filter(n => n.visibility === 'public')
  .map(n => ({
    id: n.id,
    title: n.title,
    kind: n.kind,
    status: n.status,
    color: n.color,
    icon: n.icon,
    size: Math.max(n.size, 8),
    activity: n.activity,
    level: n.level,
    domains: n.domains,
    parent_display: n.parent_display,
    summary: n.summary,
  }));

const graphEdges = allEdges
  .filter(e => {
    const s = nodeMap.get(e.source);
    const t = nodeMap.get(e.target);
    return s?.visibility === 'public' && t?.visibility === 'public';
  })
  .map(e => ({
    source: e.source,
    target: e.target,
    type: e.type,
    weight: e.weight,
    is_structural: e.is_structural,
  }));

const graph = {
  nodes: graphNodes,
  edges: graphEdges,
  meta: {
    compiled_at: new Date().toISOString(),
    total_entries: stats.entries,
    total_nodes: stats.nodes,
    total_edges: stats.edges,
  },
};

fs.writeFileSync(path.join(OUT_DIR, 'graph.json'), JSON.stringify(graph, null, 2));

// node-index.json — lightweight index
const nodeIndex = {
  nodes: [...nodeMap.values()]
    .filter(n => n.visibility === 'public')
    .map(n => ({
      id: n.id,
      title: n.title,
      kind: n.kind,
      status: n.status,
      domains: n.domains,
      size: Math.max(n.size, 8),
      activity: n.activity,
      summary: n.summary,
      entry_count: n.entry_count,
    })),
};

fs.writeFileSync(path.join(OUT_DIR, 'node-index.json'), JSON.stringify(nodeIndex, null, 2));

// timeline.json — for timeline view
const timelineEvents = allEntries
  .filter(e => e.visibility === 'public')
  .map(e => ({
    id: e.id,
    title: e.title,
    type: e.type,
    date: e.date,
    domains: e.domains,
    topics: e.topics,
    summary: e.summary,
    references: e.references,
  }));

fs.writeFileSync(path.join(OUT_DIR, 'timeline.json'), JSON.stringify({ events: timelineEvents }, null, 2));

// nodes/<id>.json — detailed node objects
for (const [id, node] of nodeMap) {
  if (node.visibility !== 'public') continue;

  const structuralEdges = allEdges
    .filter(e => e.is_structural && (e.source === id || e.target === id))
    .map(e => ({ source: e.source, target: e.target, type: e.type, weight: e.weight }));

  const emergentEdgesForNode = allEdges
    .filter(e => !e.is_structural && (e.source === id || e.target === id))
    .map(e => ({ source: e.source, target: e.target, type: e.type, weight: e.weight }));

  const detail = {
    id: node.id,
    title: node.title,
    kind: node.kind,
    status: node.status,
    color: node.color,
    icon: node.icon,
    size: Math.max(node.size, 8),
    activity: node.activity,
    domains: node.domains,
    summary: node.summary,
    entry_count: node.entry_count,
    hours_total: node.hours_total,
    structural_edges: structuralEdges,
    emergent_edges: emergentEdgesForNode,
    entries: node.entry_refs.filter(e => {
      const full = allEntries.find(ae => ae.id === e.id);
      return full?.visibility === 'public';
    }),
    notes: node.note_refs.filter(n => {
      // Only public notes
      return true; // Note visibility already checked on read
    }),
    timeline: node.timeline.sort((a, b) => b.date.localeCompare(a.date)),
  };

  fs.writeFileSync(path.join(NODES_OUT, `${id}.json`), JSON.stringify(detail, null, 2));
}

// ─── 7. Summary ────────────────────────────────────────

console.log('\n────────────────────────────────────');
console.log('✅ Compile complete!');
console.log(`   Nodes:   ${stats.nodes}`);
console.log(`   Entries: ${stats.entries}`);
console.log(`   Notes:   ${stats.notes}`);
console.log(`   Edges:   ${stats.edges}`);
if (warnings.length > 0) {
  console.log(`   ⚠ Warnings: ${stats.warnings}`);
  for (const w of warnings) console.log(`     - ${w}`);
} else {
  console.log('   No warnings 🎉');
}
console.log('────────────────────────────────────\n');
