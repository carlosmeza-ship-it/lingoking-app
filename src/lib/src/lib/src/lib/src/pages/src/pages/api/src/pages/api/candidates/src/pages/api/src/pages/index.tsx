import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { Candidate, Stage, getStage, STAGE_LABELS, findDocData } from '@/lib/types'
import { parseEmail, detectStageHints } from '@/lib/emailParser'

const STAGES: Stage[] = ['pending', 'rev', 'transl', 'deficit', 'done']
const STAGE_COLORS: Record<Stage, { bg: string; text: string; border: string }> = {
  pending: { bg: '#F5F4F0', text: '#6B6A65', border: '#C8C6BE' },
  rev:     { bg: '#E8F1FB', text: '#1A5FA0', border: '#88B8EC' },
  transl:  { bg: '#EBF4DE', text: '#3A6C10', border: '#98C55A' },
  deficit: { bg: '#FDF0E0', text: '#844F0C', border: '#F0A030' },
  done:    { bg: '#E2F6EF', text: '#0F6E56', border: '#5DCAA5' },
}

function Badge({ stage }: { stage: Stage }) {
  const c = STAGE_COLORS[stage]
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {STAGE_LABELS[stage]}
    </span>
  )
}

function today() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(2)}`
}

export default function Home() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStage, setActiveStage] = useState<Stage | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modal, setModal] = useState<'detail' | 'edit' | 'email' | 'import' | null>(null)
  const [editData, setEditData] = useState<Partial<Candidate>>({})
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [emailText, setEmailText] = useState('')
  const [emailParsed, setEmailParsed] = useState<{ candidateName: string | null; date: string; summary: string; confidence: string } | null>(null)
  const [emailCandidateId, setEmailCandidateId] = useState('')

  const fetchCandidates = useCallback(async () => {
    const r = await fetch('/api/candidates')
    const data = await r.json()
    setCandidates(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCandidates() }, [fetchCandidates])

  const selected = candidates.find(c => c.id === selectedId) || null
  const filtered = candidates.filter(c => {
    if (activeStage !== 'all' && getStage(c) !== activeStage) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
  const counts = Object.fromEntries(STAGES.map(s => [s, candidates.filter(c => getStage(c) === s).length])) as Record<Stage, number>

  async function saveCandidate() {
    if (!editData.name?.trim()) return alert('El nombre es obligatorio')
    setSaving(true)
    if (isNew) {
      const dd = findDocData(editData.name || '')
      const body: Partial<Candidate> = {
        ...editData,
        rev: editData.rev || 'Pendiente',
        envio: editData.envio || 'No',
        transl: editData.transl || 'Pendiente',
        deficit: editData.deficit || 'Pendiente',
        factura: editData.factura || 'false',
        aktenzeichen: editData.aktenzeichen || (dd?.aktenzeichen) || '',
        deadline: editData.deadline || (dd?.deadline) || '',
        log: dd?.log || [],
      }
      await fetch('/api/candidates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch(`/api/candidates/${editData.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData) })
    }
    await fetchCandidates()
    setSaving(false)
    setModal(null)
  }

  async function deleteCandidate(id: string) {
    if (!confirm('¿Eliminar este candidato?')) return
    await fetch(`/api/candidates/${id}`, { method: 'DELETE' })
    setModal(null)
    setSelectedId(null)
    await fetchCandidates()
  }

  function openDetail(id: string) { setSelectedId(id); setModal('detail') }
  function openEdit(c?: Candidate) {
    setIsNew(!c)
    setEditData(c ? { ...c } : { rev: 'Pendiente', envio: 'No', transl: 'Pendiente', deficit: 'Pendiente', factura: 'false', log: [] })
    setModal('edit')
  }

  function parseEmailText() {
    const result = parseEmail(emailText, candidates)
    setEmailParsed(result)
    if (result.candidateName) {
      const c = candidates.find(x => x.name === result.candidateName)
      if (c) setEmailCandidateId(c.id)
    }
  }

  async function saveEmailEntry() {
    if (!emailCandidateId || !emailParsed) return
    const c = candidates.find(x => x.id === emailCandidateId)
    if (!c) return
    setSaving(true)
    const hints = detectStageHints(emailParsed.summary)
    const newLog = [{ date: emailParsed.date, note: emailParsed.summary, source: 'email' as const }, ...(c.log || [])]
    const updates: Partial<Candidate> = { log: newLog }
    if (hints.suggestRev) updates.rev = hints.suggestRev
    if (hints.suggestEnvio) updates.envio = hints.suggestEnvio
    if (hints.suggestTransl) updates.transl = hints.suggestTransl
    if (hints.suggestDeficit) updates.deficit = hints.suggestDeficit
    await fetch(`/api/candidates/${emailCandidateId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...c, ...updates }) })
    await fetchCandidates()
    setSaving(false)
    setModal(null)
    setEmailText('')
    setEmailParsed(null)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const XLSX = await import('xlsx')
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][]
    const r = await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }) })
    const result = await r.json()
    await fetchCandidates()
    setModal(null)
    alert(`✓ ${result.count} candidatos importados. ${result.withDoc} con historial vinculado automáticamente.`)
  }

  const inputStyle: React.CSSProperties = { width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #D8D7D2', background: '#FAFAF8', color: '#1C1C1A', fontSize: 13, fontFamily: 'inherit', outline: 'none' }
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: '#7A7974', marginBottom: 4, fontWeight: 500 }

  return (
    <>
      <Head>
        <title>Lingoking · Seguimiento</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#F7F6F2', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#1C1C1A' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3 }}>Lingoking</h1>
              <p style={{ fontSize: 13, color: '#7A7974', marginTop: 2 }}>{candidates.length} candidatos · {Object.values(counts).slice(0, 4).reduce((a, b) => a + b, 0)} activos</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setModal('email')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #D8D7D2', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#1C1C1A', fontFamily: 'inherit' }}>
                <i className="ti ti-mail" /> Registrar correo
              </button>
              <button onClick={() => setModal('import')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #D8D7D2', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#1C1C1A', fontFamily: 'inherit' }}>
                <i className="ti ti-upload" /> Importar Excel
              </button>
              <button onClick={() => openEdit()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #2D6A4F', background: '#2D6A4F', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                <i className="ti ti-plus" /> Nuevo candidato
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, marginBottom: '1.25rem' }}>
            {([['all', 'Total', candidates.length, '#1C1C1A'], ['pending', 'Pendiente', counts.pending, '#6B6A65'], ['rev', 'Revisión', counts.rev, '#1A5FA0'], ['transl', 'Traducción', counts.transl, '#3A6C10'], ['deficit', 'Déficit', counts.deficit, '#844F0C'], ['done', 'Cerrado', counts.done, '#0F6E56']] as [string, string, number, string][]).map(([s, l, n, color]) => (
              <div key={s} style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', border: '1px solid #ECEAE4' }}>
                <div style={{ fontSize: 11, color: '#7A7974', marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 22, fontWeight: 600, color }}>{n}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
            {(['all', ...STAGES] as (Stage | 'all')[]).map(s => {
              const active = activeStage === s
              const cnt = s === 'all' ? candidates.length : counts[s]
              const color = s !== 'all' ? STAGE_COLORS[s] : null
              return (
                <button key={s} onClick={() => setActiveStage(s)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: `1px solid ${active && color ? color.border : '#D8D7D2'}`, background: active && color ? color.bg : active ? '#F0EEE8' : '#fff', color: active && color ? color.text : active ? '#1C1C1A' : '#7A7974', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: active ? 600 : 400 }}>
                  <span style={{ fontWeight: 600 }}>{cnt}</span> {s === 'all' ? 'Todos' : STAGE_LABELS[s]}
                </button>
              )
            })}
          </div>

          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9A9893', fontSize: 16, pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar candidato..." style={{ ...inputStyle, paddingLeft: 34 }} />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#7A7974' }}>Cargando candidatos...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#7A7974' }}>
              <i className="ti ti-user-off" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
              {candidates.length === 0 ? 'Importa tu Excel o crea el primer candidato.' : 'No hay candidatos que coincidan.'}
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #ECEAE4', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ECEAE4' }}>
                    {['Candidato', 'Etapa', 'Revisión', 'Envío', 'Déficit', 'Fecha límite', 'Historial', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 500, fontSize: 11, color: '#7A7974', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const stage = getStage(c)
                    const log = c.log || []
                    return (
                      <tr key={c.id} onClick={() => openDetail(c.id)} style={{ borderBottom: '1px solid #F2F1ED', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '10px 12px', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                        <td style={{ padding: '10px 12px' }}><Badge stage={stage} /></td>
                        <td style={{ padding: '10px 12px' }}>
                          {c.rev === 'Revisión Ok' ? <span style={{ color: '#3A6C10', fontSize: 12 }}>✓ Ok</span>
                            : c.rev === 'Revisión con comentarios' ? <span style={{ color: '#1A5FA0', fontSize: 12 }}>Comentarios</span>
                            : <span style={{ color: '#C8C6BE', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {c.envio === 'Recibido' ? <span style={{ color: '#3A6C10', fontSize: 12 }}>✓ Recibido</span> : <span style={{ color: '#C8C6BE', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {c.deficit === 'Defizit Ok' ? <span style={{ color: '#3A6C10', fontSize: 12 }}>✓ Ok</span>
                            : c.deficit === 'Defizit solicitado' ? <span style={{ color: '#844F0C', fontSize: 12 }}>Solicitado</span>
                            : <span style={{ color: '#C8C6BE', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: '#7A7974' }}>{c.deadline || '—'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {log.length > 0
                            ? <span style={{ background: '#EEEDFE', color: '#534AB7', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{log.length} entradas</span>
                            : <span style={{ color: '#C8C6BE', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <button onClick={e => { e.stopPropagation(); openEdit(c) }} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #D8D7D2', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#7A7974', fontFamily: 'inherit' }}>
                            <i className="ti ti-edit" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal === 'detail' && selected && (
        <ModalWrapper onClose={() => setModal(null)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 600 }}>{selected.name}</h2>
              <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge stage={getStage(selected)} />
                {selected.aktenzeichen && <span style={{ fontSize: 11, color: '#7A7974', background: '#F5F4F0', padding: '2px 8px', borderRadius: 20 }}>{selected.aktenzeichen}</span>}
              </div>
            </div>
            <CloseBtn onClose={() => setModal(null)} />
          </div>
          <div style={{ display: 'flex', marginBottom: '1.25rem' }}>
            {[
              { l: 'Revisión', done: selected.rev !== 'Pendiente' },
              { l: 'Envío físico', done: selected.envio === 'Recibido' },
              { l: 'Traducción', done: selected.transl === 'Traducción Terminada' },
              { l: 'Déficit', done: selected.deficit !== 'Pendiente' },
              { l: 'Factura', done: selected.factura === 'true' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                {i < 4 && <div style={{ position: 'absolute', top: 11, left: '50%', width: '100%', height: 1, background: '#ECEAE4', zIndex: 0 }} />}
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${s.done ? '#1D9E75' : '#D8D7D2'}`, background: s.done ? '#1D9E75' : '#fff', margin: '0 auto 5px', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: s.done ? '#fff' : '#9A9893' }}>
                  {s.done ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: 10, color: '#7A7974', lineHeight: 1.3 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1.25rem' }}>
            {[['Fecha límite', selected.deadline || '—'], ['Revisión', selected.rev], ['Envío físico', selected.envio], ['Déficit', selected.deficit]].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 11, color: '#7A7974', marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 13 }}>{v}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7974', marginBottom: 10 }}>Historial de pasos</div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {(selected.log || []).length === 0
                ? <p style={{ fontSize: 13, color: '#9A9893', fontStyle: 'italic' }}>Sin entradas de historial.</p>
                : (selected.log || []).map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #F2F1ED' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7974', whiteSpace: 'nowrap', minWidth: 52 }}>{e.date}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.55 }}>{e.note}</div>
                  </div>
                ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #ECEAE4' }}>
            <button onClick={() => { setModal(null); openEdit(selected) }} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #D8D7D2', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-edit" /> Editar
            </button>
            <button onClick={() => deleteCandidate(selected.id)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #F09595', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#A32D2D', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-trash" /> Eliminar
            </button>
          </div>
        </ModalWrapper>
      )}

      {modal === 'edit' && (
        <ModalWrapper onClose={() => setModal(null)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>{isNew ? 'Nuevo candidato' : 'Editar candidato'}</h2>
            <CloseBtn onClose={() => setModal(null)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Nombre completo *</label>
              <input style={inputStyle} value={editData.name || ''} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Juan Carlos Pérez" />
            </div>
            <div>
              <label style={labelStyle}>Fecha límite</label>
              <input style={inputStyle} value={editData.deadline || ''} onChange={e => setEditData(p => ({ ...p, deadline: e.target.value }))} placeholder="ej: 08.07.26" />
            </div>
            <div>
              <label style={labelStyle}>Aktenzeichen</label>
              <input style={inputStyle} value={editData.aktenzeichen || ''} onChange={e => setEditData(p => ({ ...p, aktenzeichen: e.target.value }))} placeholder="55.3-..." />
            </div>
            <div>
              <label style={labelStyle}>Estado revisión</label>
              <select style={selectStyle} value={editData.rev || 'Pendiente'} onChange={e => setEditData(p => ({ ...p, rev: e.target.value }))}>
                <option value="Pendiente">Pendiente</option>
                <option value="Revisión con comentarios">Con comentarios</option>
                <option value="Revisión Ok">Ok</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Envío físico</label>
              <select style={selectStyle} value={editData.envio || 'No'} onChange={e => setEditData(p => ({ ...p, envio: e.target.value }))}>
                <option value="No">No recibido</option>
                <option value="Recibido">Recibido</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Traducción</label>
              <select style={selectStyle} value={editData.transl || 'Pendiente'} onChange={e => setEditData(p => ({ ...p, transl: e.target.value }))}>
                <option value="Pendiente">Pendiente</option>
                <option value="Traducción en proceso">En proceso</option>
                <option value="Traducción Terminada">Terminada</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Déficit</label>
              <select style={selectStyle} value={editData.deficit || 'Pendiente'} onChange={e => setEditData(p => ({ ...p, deficit: e.target.value }))}>
                <option value="Pendiente">Pendiente</option>
                <option value="Defizit solicitado">Solicitado</option>
                <option value="Defizit Ok">Ok</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Factura emitida</label>
              <select style={selectStyle} value={editData.factura || 'false'} onChange={e => setEditData(p => ({ ...p, factura: e.target.value }))}>
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Agregar nota al historial</label>
            <textarea style={{ ...inputStyle, height: 80, resize: 'vertical', padding: '8px 10px' } as React.CSSProperties}
              placeholder="Escribe una nota rápida sobre este candidato..."
              onChange={e => {
                const note = e.target.value
                setEditData(p => ({
                  ...p,
                  log: note ? [{ date: today(), note, source: 'manual' as const }, ...(p.log || [])] : (p.log || [])
                }))
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={() => setModal(null)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #D8D7D2', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
            <button onClick={saveCandidate} disabled={saving} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#2D6A4F', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Guardando...' : '✓ Guardar'}
            </button>
          </div>
        </ModalWrapper>
      )}

      {modal === 'email' && (
        <ModalWrapper onClose={() => { setModal(null); setEmailText(''); setEmailParsed(null) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Registrar comunicación</h2>
            <CloseBtn onClose={() => { setModal(null); setEmailText(''); setEmailParsed(null) }} />
          </div>
          <p style={{ fontSize: 13, color: '#7A7974', marginBottom: '1rem' }}>Pega el texto del correo. La app identificará el candidato y extraerá lo relevante.</p>
          {!emailParsed ? (
            <>
              <textarea value={emailText} onChange={e => setEmailText(e.target.value)}
                placeholder="Pega aquí el correo completo..."
                style={{ width: '100%', height: 180, resize: 'vertical', borderRadius: 8, border: '1px solid #D8D7D2', background: '#FAFAF8', color: '#1C1C1A', padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' } as React.CSSProperties}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                <button onClick={() => { setModal(null); setEmailText('') }} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #D8D7D2', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button onClick={parseEmailText} disabled={!emailText.trim()} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#2D6A4F', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Analizar correo →
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ background: '#F5F4F0', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7974', marginBottom: 8 }}>
                  RESULTADO DEL ANÁLISIS
                  <span style={{ marginLeft: 8, background: emailParsed.confidence === 'high' ? '#E2F6EF' : emailParsed.confidence === 'medium' ? '#FDF0E0' : '#F5F4F0', color: emailParsed.confidence === 'high' ? '#0F6E56' : emailParsed.confidence === 'medium' ? '#844F0C' : '#6B6A65', padding: '1px 7px', borderRadius: 20, fontSize: 11 }}>
                    Confianza: {emailParsed.confidence === 'high' ? 'alta' : emailParsed.confidence === 'medium' ? 'media' : 'baja'}
                  </span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={labelStyle}>Candidato detectado</label>
                  <select style={selectStyle} value={emailCandidateId} onChange={e => setEmailCandidateId(e.target.value)}>
                    <option value="">— Selecciona manualmente si es incorrecto —</option>
                    {candidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={labelStyle}>Fecha detectada</label>
                  <input style={inputStyle} value={emailParsed.date} onChange={e => setEmailParsed(p => p ? { ...p, date: e.target.value } : p)} />
                </div>
                <div>
                  <label style={labelStyle}>Resumen extraído</label>
                  <textarea value={emailParsed.summary} onChange={e => setEmailParsed(p => p ? { ...p, summary: e.target.value } : p)}
                    style={{ width: '100%', height: 90, resize: 'vertical', borderRadius: 8, border: '1px solid #D8D7D2', background: '#fff', color: '#1C1C1A', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' } as React.CSSProperties}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setEmailParsed(null)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #D8D7D2', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Volver</button>
                <button onClick={saveEmailEntry} disabled={!emailCandidateId || saving} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#2D6A4F', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Guardando...' : '✓ Guardar en historial'}
                </button>
              </div>
            </>
          )}
        </ModalWrapper>
      )}

      {modal === 'import' && (
        <ModalWrapper onClose={() => setModal(null)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Importar desde Excel</h2>
            <CloseBtn onClose={() => setModal(null)} />
          </div>
          <p style={{ fontSize: 13, color: '#7A7974', marginBottom: '1rem' }}>Selecciona tu archivo .xlsx. Los candidatos con Google Doc se vincularán automáticamente.</p>
          <label style={{ display: 'block', border: '2px dashed #D8D7D2', borderRadius: 10, padding: '2rem', textAlign: 'center', cursor: 'pointer' }}>
            <i className="ti ti-file-spreadsheet" style={{ fontSize: 28, display: 'block', marginBottom: 8, color: '#9A9893' }} />
            <span style={{ fontSize: 13, color: '#7A7974' }}>Haz clic para seleccionar tu .xlsx</span>
            <input type="file" accept=".xlsx" style={{ display: 'none' }} onChange={handleImport} />
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={() => setModal(null)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #D8D7D2', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar</button>
          </div>
        </ModalWrapper>
      )}
    </>
  )
}

function ModalWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '1.5rem', width: 'min(580px, 100%)', margin: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        {children}
      </div>
    </div>
  )
}

function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A7974', fontSize: 20, padding: 2, lineHeight: 1 }}>×</button>
  )
}
