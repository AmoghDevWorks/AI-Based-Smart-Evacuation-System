import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MarkerType,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  Handle,
  Position,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// ─── Node Colors by type ───────────────────────────────────────────
const TYPE_COLORS = {
  room: { bg: '#3b82f6', border: '#1d4ed8', text: '#fff', label: 'Room' },
  corridor: { bg: '#6b7280', border: '#374151', text: '#fff', label: 'Corridor' },
  exit: { bg: '#22c55e', border: '#15803d', text: '#fff', label: 'Exit' },
}

// ─── Custom Room Node ──────────────────────────────────────────────
const RoomNode = ({ data, selected }) => {
  const colors = TYPE_COLORS[data.type] || TYPE_COLORS.room
  const handleStyle = {
    width: 10, height: 10,
    background: '#fff',
    border: `2px solid ${colors.border}`,
    borderRadius: '50%',
  }
  return (
    <div
      style={{
        background: colors.bg,
        border: `2px solid ${selected ? '#f59e0b' : colors.border}`,
        borderRadius: 8,
        padding: '8px 16px',
        minWidth: 120,
        boxShadow: selected ? '0 0 0 3px rgba(245,158,11,0.4)' : '0 2px 8px rgba(0,0,0,0.2)',
        cursor: 'grab',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <Handle type="source" position={Position.Right} style={handleStyle} />
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
      <div style={{ color: colors.text, fontWeight: 700, fontSize: 13, textAlign: 'center' }}>
        {data.label}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, textAlign: 'center', marginTop: 2 }}>
        {colors.label} · {data.capacity ?? '—'} cap
      </div>
    </div>
  )
}

// ─── Custom Edge with weight label ────────────────────────────────
const WeightedEdge = ({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, selected, markerEnd, style,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  const nw = data?.normalized_weight ?? 0
  const strokeWidth = 2 + nw * 4
  const color = selected ? '#f59e0b' : '#6366f1'

  return (
    <>
      {/* Wide transparent stroke for easier click selection */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={20} />
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ ...style, stroke: color, strokeWidth }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
            background: selected ? '#f59e0b' : '#1e1b4b',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 600,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
          className="nodrag nopan"
        >
          w:{data?.weight ?? '—'} | n:{nw.toFixed(2)}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const nodeTypes = { room: RoomNode }
const edgeTypes = { weighted: WeightedEdge }

// ─── Compute normalized weights ────────────────────────────────────
function normalizeEdges(edges) {
  const weights = edges.map(e => e.data?.weight ?? 0)
  const maxW = Math.max(...weights, 1)
  return edges.map(e => ({
    ...e,
    data: { ...e.data, normalized_weight: (e.data?.weight ?? 0) / maxW },
  }))
}

let nodeIdCounter = 10
let edgeIdCounter = 10

// ─── Inner component (needs ReactFlowProvider context) ────────────
function BuildingLayoutInner() {
  const mode = useSelector((state) => state.theme.mode)
  const user = useSelector((state) => state.user.user)
  const isDark = mode === 'dark'
  const { setCenter } = useReactFlow()

  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const initialNodes = []
  const initialEdgesRaw = []

  const buildEdge = (raw) => ({
    ...raw,
    type: 'weighted',
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
  })

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    normalizeEdges(initialEdgesRaw.map(buildEdge))
  )
  const [selected, setSelected] = useState(null) // { type: 'node'|'edge', id }
  const [panel, setPanel] = useState(null)        // current edit data
  const [addMode, setAddMode] = useState(null)    // 'node' | 'edge'
  const [edgeSource, setEdgeSource] = useState(null)

  // ── Fetch Layout on Mount ──
  useEffect(() => {
    const fetchLayout = async () => {
      if (!user) return
      setIsLoading(true)
      try {
        const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
        const res = await fetch(`${API_URL}/api/layouts/${user.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.nodes && data.nodes.length > 0) {
            setNodes(data.nodes)
            setEdges(data.edges.map(buildEdge))
            
            // Re-calculate node id counters to prevent duplicate IDs on new rooms
            const maxId = Math.max(...data.nodes.map(n => parseInt(n.id.replace(/\D/g, '')) || 0), 0)
            nodeIdCounter = maxId > 10 ? maxId : 10
          }
        }
      } catch (e) {
        console.error("Failed to load layout", e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLayout()
  }, [user, setNodes, setEdges]) // buildEdge depends only on static MarkerType

  // ── Derive node/edge by selected id ──
  const selectedNode = selected?.type === 'node' ? nodes.find(n => n.id === selected.id) : null
  const selectedEdge = selected?.type === 'edge' ? edges.find(e => e.id === selected.id) : null

  useEffect(() => {
    if (selectedNode) setPanel({ ...selectedNode.data })
    else if (selectedEdge) setPanel({ ...selectedEdge.data })
    else setPanel(null)
  }, [selected, nodes, edges])

  // ── Connections ──
  const onConnect = useCallback((params) => {
    const weight = 5
    const newEdge = buildEdge({ id: `e${params.source}-${params.target}-${Date.now()}`, ...params, data: { weight } })
    setEdges(eds => normalizeEdges(addEdge(newEdge, eds)))
  }, [setEdges])

  // ── Node click ──
  const onNodeClick = useCallback((_, node) => {
    if (addMode === 'edge') {
      if (!edgeSource) {
        setEdgeSource(node.id)
      } else if (edgeSource !== node.id) {
        const newEdge = buildEdge({
          id: `e${edgeSource}-${node.id}-${Date.now()}`,
          source: edgeSource,
          target: node.id,
          data: { weight: 5 },
        })
        setEdges(eds => normalizeEdges([...eds, newEdge]))
        setEdgeSource(null)
        setAddMode(null)
      }
      return
    }
    setSelected({ type: 'node', id: node.id })
  }, [addMode, edgeSource, setEdges])

  // ── Edge click ──
  const onEdgeClick = useCallback((_, edge) => {
    setSelected({ type: 'edge', id: edge.id })
  }, [])

  // ── Pane click ──
  const onPaneClick = useCallback((evt) => {
    if (addMode === 'node') {
      const bounds = evt.currentTarget.getBoundingClientRect()
      const x = evt.clientX - bounds.left
      const y = evt.clientY - bounds.top
      const id = `n${++nodeIdCounter}`
      setNodes(nds => [...nds, {
        id, type: 'room',
        position: { x, y },
        data: { label: `Room ${id}`, type: 'room', area: 50, capacity: 20 },
      }])
      setAddMode(null)
      return
    }
    setSelected(null)
    setEdgeSource(null)
  }, [addMode, setNodes])

  // ── Delete selected ──
  const deleteSelected = useCallback(() => {
    if (!selected) return
    if (selected.type === 'node') {
      setNodes(nds => nds.filter(n => n.id !== selected.id))
      setEdges(eds => normalizeEdges(eds.filter(e => e.source !== selected.id && e.target !== selected.id)))
    } else {
      setEdges(eds => normalizeEdges(eds.filter(e => e.id !== selected.id)))
    }
    setSelected(null)
  }, [selected, setNodes, setEdges])

  // ── Keyboard: Delete key removes selected node or edge ──
  useEffect(() => {
    const handler = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        // Don't fire if user is typing in an input/textarea
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return
        deleteSelected()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [deleteSelected, selected])

  // ── Save node panel changes ──
  const saveNode = () => {
    setNodes(nds => nds.map(n => n.id === selected.id ? { ...n, data: { ...panel } } : n))
  }

  // ── Save edge panel changes ──
  const saveEdge = () => {
    setEdges(eds => normalizeEdges(eds.map(e => e.id === selected.id
      ? { ...e, data: { ...panel, weight: Number(panel.weight) } } : e
    )))
  }

  // ── Save full layout to backend ──
  const handleSaveLayout = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
      const res = await fetch(`${API_URL}/api/layouts/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges })
      })
      if (!res.ok) throw new Error('Failed to save layout')
      alert('Layout saved successfully!')
    } catch (e) {
      console.error(e)
      alert('Error saving layout')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Highlight from dropdown ──
  const highlightNode = (id) => {
    setSelected({ type: 'node', id })
    const n = nodes.find(nd => nd.id === id)
    if (n) setCenter(n.position.x + 60, n.position.y + 30, { zoom: 1.2, duration: 500 })
  }

  const highlightEdge = (id) => setSelected({ type: 'edge', id })

  // ── Styles ──
  const bg = isDark ? '#0f172a' : '#f8fafc'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const border = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm outline-none transition ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'}`
  const labelCls = `block text-xs font-semibold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`
  const btnPrimary = `px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`
  const btnDanger = `px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isDark ? 'bg-red-800 hover:bg-red-700 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-300'}`
  const btnSecondary = (active) => `px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${active ? 'bg-amber-500 border-amber-400 text-white' : isDark ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`

  return (
    <div style={{ display: 'flex', height: '100%', background: bg, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── LEFT SIDEBAR ─────────────────────────────── */}
      <div style={{ width: 220, background: cardBg, borderRight: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 14px 12px', borderBottom: `1px solid ${border}` }}>
          <div style={{ color: textPrimary, fontWeight: 700, fontSize: 15 }}>Building Layout</div>
          <div style={{ color: textSecondary, fontSize: 11, marginTop: 2 }}>Smart Evacuation Editor</div>
        </div>

        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
          {/* Room Dropdown */}
          <div>
            <label style={{ color: textSecondary, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Select Room</label>
            <select className={inputCls} value={selected?.type === 'node' ? selected.id : ''} onChange={e => highlightNode(e.target.value)}>
              <option value="">— Choose Room —</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.data.label}</option>)}
            </select>
          </div>

          {/* Edge Dropdown */}
          <div>
            <label style={{ color: textSecondary, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Select Path</label>
            <select className={inputCls} value={selected?.type === 'edge' ? selected.id : ''} onChange={e => highlightEdge(e.target.value)}>
              <option value="">— Choose Path —</option>
              {edges.map(e => {
                const src = nodes.find(n => n.id === e.source)?.data.label ?? e.source
                const tgt = nodes.find(n => n.id === e.target)?.data.label ?? e.target
                return <option key={e.id} value={e.id}>{src} → {tgt}</option>
              })}
            </select>
          </div>

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${border}`, margin: '4px 0' }} />

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button 
              className={btnPrimary} 
              onClick={handleSaveLayout}
              disabled={isSaving}
              style={{ marginBottom: 8, background: isSaving ? '#94a3b8' : undefined }}
            >
              {isSaving ? '⏳ Saving...' : '💾 Save Layout'}
            </button>
            <button className={btnSecondary(addMode === 'node')} onClick={() => { setAddMode(addMode === 'node' ? null : 'node'); setEdgeSource(null) }}>
              {addMode === 'node' ? '📍 Click canvas...' : '+ Add Room'}
            </button>
            <button className={btnSecondary(addMode === 'edge')} onClick={() => { setAddMode(addMode === 'edge' ? null : 'edge'); setEdgeSource(null) }}>
              {addMode === 'edge' ? (edgeSource ? '→ Click target...' : '→ Click source...') : '+ Add Path'}
            </button>
            <button className={btnDanger} onClick={deleteSelected} disabled={!selected}>
              🗑 Delete Selected
            </button>
          </div>

          {/* Legend */}
          <div style={{ borderTop: `1px solid ${border}`, paddingTop: 12, marginTop: 'auto' }}>
            <div style={{ color: textSecondary, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Legend</div>
            {Object.entries(TYPE_COLORS).map(([type, c]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: c.bg, flexShrink: 0 }} />
                <span style={{ color: textSecondary, fontSize: 11 }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CANVAS ──────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative' }}>
        {addMode && (
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            zIndex: 10, background: '#f59e0b', color: '#000', padding: '6px 16px',
            borderRadius: 999, fontSize: 12, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            {addMode === 'node' ? '📍 Click anywhere on the canvas to place a room' : edgeSource ? `→ Now click the target room` : '→ Click the source room to start a path'}
          </div>
        )}

        {!isLoading && nodes.length === 0 && !addMode && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 5, color: textSecondary, textAlign: 'center', pointerEvents: 'none'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: textPrimary, marginBottom: 8 }}>No Layout Found</h3>
            <p style={{ fontSize: 14 }}>You haven't created a building layout yet.</p>
            <p style={{ fontSize: 14, marginTop: 4 }}>Click <b>+ Add Room</b> in the sidebar to get started!</p>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          defaultEdgeOptions={{ type: 'weighted', markerEnd: { type: MarkerType.ArrowClosed } }}
          style={{ background: bg }}
        >
          <Background color={isDark ? '#1e293b' : '#e2e8f0'} gap={20} />
          <Controls style={{ background: cardBg, border: `1px solid ${border}` }} />
        </ReactFlow>
      </div>

      {/* ── RIGHT PROPERTIES PANEL ───────────────────── */}
      <div style={{ width: 260, background: cardBg, borderLeft: `1px solid ${border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 14px 12px', borderBottom: `1px solid ${border}` }}>
          <div style={{ color: textPrimary, fontWeight: 700, fontSize: 14 }}>
            {selectedNode ? '🏠 Room Properties' : selectedEdge ? '🔗 Path Properties' : 'Properties'}
          </div>
          <div style={{ color: textSecondary, fontSize: 11, marginTop: 2 }}>
            {selectedNode ? selectedNode.data.label : selectedEdge ? `ID: ${selectedEdge.id}` : 'Click a node or edge'}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {!selected && (
            <div style={{ color: textSecondary, fontSize: 13, textAlign: 'center', marginTop: 40 }}>
              Select a room or path on the canvas to edit its properties.
            </div>
          )}

          {/* NODE PANEL */}
          {selectedNode && panel && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className={labelCls} style={{ color: textSecondary }}>Name</label>
                <input className={inputCls} value={panel.label ?? ''} onChange={e => setPanel(p => ({ ...p, label: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls} style={{ color: textSecondary }}>Type</label>
                <select className={inputCls} value={panel.type ?? 'room'} onChange={e => setPanel(p => ({ ...p, type: e.target.value }))}>
                  <option value="room">Room</option>
                  <option value="corridor">Corridor</option>
                  <option value="exit">Exit</option>
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ color: textSecondary }}>Area (m²)</label>
                <input className={inputCls} type="number" value={panel.area ?? ''} onChange={e => setPanel(p => ({ ...p, area: Number(e.target.value) }))} />
              </div>
              <div>
                <label className={labelCls} style={{ color: textSecondary }}>Capacity</label>
                <input className={inputCls} type="number" value={panel.capacity ?? ''} onChange={e => setPanel(p => ({ ...p, capacity: Number(e.target.value) }))} />
              </div>

              {/* Type badge preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: isDark ? '#0f172a' : '#f1f5f9' }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: TYPE_COLORS[panel.type]?.bg ?? '#3b82f6', flexShrink: 0 }} />
                <span style={{ color: textSecondary, fontSize: 12 }}>{TYPE_COLORS[panel.type]?.label ?? 'Room'}</span>
              </div>

              <button className={btnPrimary} onClick={saveNode}>Save Changes</button>
            </div>
          )}

          {/* EDGE PANEL */}
          {selectedEdge && panel && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className={labelCls} style={{ color: textSecondary }}>From</label>
                <input className={inputCls} value={nodes.find(n => n.id === selectedEdge.source)?.data.label ?? selectedEdge.source} disabled style={{ opacity: 0.6 }} />
              </div>
              <div>
                <label className={labelCls} style={{ color: textSecondary }}>To</label>
                <input className={inputCls} value={nodes.find(n => n.id === selectedEdge.target)?.data.label ?? selectedEdge.target} disabled style={{ opacity: 0.6 }} />
              </div>
              <div>
                <label className={labelCls} style={{ color: textSecondary }}>Weight</label>
                <input className={inputCls} type="number" min={1} value={panel.weight ?? 1} onChange={e => setPanel(p => ({ ...p, weight: Number(e.target.value) }))} />
              </div>
              <div>
                <label className={labelCls} style={{ color: textSecondary }}>Normalized Weight (auto)</label>
                <div style={{ padding: '8px 12px', borderRadius: 8, background: isDark ? '#0f172a' : '#f1f5f9', fontSize: 13, color: textPrimary, fontWeight: 600 }}>
                  {(panel.normalized_weight ?? 0).toFixed(4)}
                </div>
              </div>

              {/* Normalized weight bar */}
              <div>
                <div style={{ height: 8, borderRadius: 999, background: isDark ? '#1e293b' : '#e2e8f0', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(panel.normalized_weight ?? 0) * 100}%`, background: '#6366f1', borderRadius: 999, transition: 'width 0.3s' }} />
                </div>
                <div style={{ color: textSecondary, fontSize: 10, marginTop: 4, textAlign: 'right' }}>
                  {((panel.normalized_weight ?? 0) * 100).toFixed(1)}% of max weight
                </div>
              </div>

              <button className={btnPrimary} onClick={saveEdge}>Save Changes</button>
              <button className={btnDanger} onClick={deleteSelected} style={{ marginTop: 4 }}>
                🗑 Delete This Path
              </button>
            </div>
          )}
        </div>

        {/* Stats footer */}
        <div style={{ padding: '12px 14px', borderTop: `1px solid ${border}`, display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ color: textPrimary, fontWeight: 700, fontSize: 18 }}>{nodes.length}</div>
            <div style={{ color: textSecondary, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rooms</div>
          </div>
          <div style={{ width: 1, background: border }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ color: textPrimary, fontWeight: 700, fontSize: 18 }}>{edges.length}</div>
            <div style={{ color: textSecondary, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Paths</div>
          </div>
          <div style={{ width: 1, background: border }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ color: textPrimary, fontWeight: 700, fontSize: 18 }}>{nodes.filter(n => n.data.type === 'exit').length}</div>
            <div style={{ color: textSecondary, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Exits</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Exported page (wraps with ReactFlowProvider) ─────────────────
const BuildingLayout = () => (
  <ReactFlowProvider>
    <BuildingLayoutInner />
  </ReactFlowProvider>
)

export default BuildingLayout
