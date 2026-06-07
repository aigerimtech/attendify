import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getInstructors, toggleUserStatus, deleteInstructor, editUser } from '../../services/adminService.js'

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const COLS = 7

/* ── Edit Modal ──────────────────────────────────────────────────────────── */
function EditModal({ instructor, onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name:   instructor.first_name || '',
    last_name:    instructor.last_name  || '',
    email:        instructor.email      || '',
    department:   instructor.department || '',
    title:        instructor.title      || '',
    new_password: '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async () => {
    setSaving(true); setError('')
    try {
      const payload = {}
      if (form.first_name.trim())   payload.first_name   = form.first_name.trim()
      if (form.last_name.trim())    payload.last_name    = form.last_name.trim()
      if (form.email.trim())        payload.email        = form.email.trim()
      if (form.department.trim())   payload.department   = form.department.trim()
      if (form.title.trim())        payload.title        = form.title.trim()
      if (form.new_password.trim()) payload.new_password = form.new_password.trim()
      const updated = await editUser(instructor.id, payload)
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save.')
    } finally { setSaving(false) }
  }

  const inputCls = 'w-full px-3 py-2 border border-[#e0e7ff] rounded-xl text-sm text-[#1e1b4b] bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]'

  return (
    <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(15,12,40,0.45)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}
      onClick={onClose}>
      <div style={{ background:'#fff',borderRadius:16,border:'1px solid #e0e7ff',boxShadow:'0 20px 60px rgba(0,0,0,0.18)',padding:'28px 28px 24px',maxWidth:460,width:'100%' }}
        onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize:17,fontWeight:800,color:'#1e1b4b',marginBottom:20 }}>Edit Instructor</h2>

        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
          <div>
            <label style={{ fontSize:11,fontWeight:600,color:'#6366f1',display:'block',marginBottom:4 }}>First Name</label>
            <input name="first_name" value={form.first_name} onChange={handle} className={inputCls} />
          </div>
          <div>
            <label style={{ fontSize:11,fontWeight:600,color:'#6366f1',display:'block',marginBottom:4 }}>Last Name</label>
            <input name="last_name" value={form.last_name} onChange={handle} className={inputCls} />
          </div>
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11,fontWeight:600,color:'#6366f1',display:'block',marginBottom:4 }}>Email</label>
          <input name="email" type="email" value={form.email} onChange={handle} className={inputCls} />
        </div>

        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
          <div>
            <label style={{ fontSize:11,fontWeight:600,color:'#6366f1',display:'block',marginBottom:4 }}>Title</label>
            <input name="title" value={form.title} onChange={handle} placeholder="e.g. Dr." className={inputCls} />
          </div>
          <div>
            <label style={{ fontSize:11,fontWeight:600,color:'#6366f1',display:'block',marginBottom:4 }}>Department</label>
            <input name="department" value={form.department} onChange={handle} className={inputCls} />
          </div>
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:11,fontWeight:600,color:'#6366f1',display:'block',marginBottom:4 }}>New Password <span style={{ fontWeight:400,color:'#94a3b8' }}>(leave blank to keep)</span></label>
          <input name="new_password" type="password" value={form.new_password} onChange={handle} placeholder="••••••••" className={inputCls} />
        </div>

        {error && <p style={{ fontSize:13,color:'#f43f5e',marginBottom:12 }}>{error}</p>}

        <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
          <button onClick={onClose} disabled={saving}
            style={{ padding:'9px 20px',borderRadius:9,border:'1.5px solid #e0e7ff',background:'#fff',color:'#6366f1',fontSize:14,fontWeight:600,cursor:'pointer' }}>
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            style={{ padding:'9px 20px',borderRadius:9,border:'none',background:'#4f46e5',color:'#fff',fontSize:14,fontWeight:700,cursor:saving?'not-allowed':'pointer',opacity:saving?0.7:1 }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InstructorsPage() {
  const navigate = useNavigate()
  const [instructors,   setInstructors]   = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [toggling,      setToggling]      = useState(null)
  const [toggleTarget,  setToggleTarget]  = useState(null)
  const [toggleLoading, setToggleLoading] = useState(false)
  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [deleting,      setDeleting]      = useState(false)
  const [editTarget,    setEditTarget]    = useState(null)
  const [search,        setSearch]        = useState('')

  useEffect(() => {
    getInstructors()
      .then(setInstructors)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleToggle(ins) { setToggleTarget(ins) }

  async function confirmToggle() {
    if (!toggleTarget) return
    setToggleLoading(true)
    setToggling(toggleTarget.id)
    try {
      await toggleUserStatus(toggleTarget.id, 'instructor', !toggleTarget.is_active)
      setInstructors(list => list.map(i => i.id === toggleTarget.id ? { ...i, is_active: !i.is_active } : i))
      setToggleTarget(null)
    } catch (e) { setError(e.message) }
    finally { setToggleLoading(false); setToggling(null) }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteInstructor(deleteTarget.id)
      setInstructors(list => list.filter(i => i.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (e) { setError(e.message) }
    finally { setDeleting(false) }
  }

  function handleSaved(updated) {
    setInstructors(list => list.map(i => i.id === updated.id ? { ...i, ...updated } : i))
  }

  const q = search.toLowerCase()
  const filtered = instructors.filter(ins => {
    const name  = [ins.first_name, ins.last_name].filter(Boolean).join(' ').toLowerCase()
    const email = (ins.email || '').toLowerCase()
    const dept  = (ins.department || '').toLowerCase()
    return !q || name.includes(q) || email.includes(q) || dept.includes(q)
  })

  const thStyle = { padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6366f1', textTransform:'uppercase', letterSpacing:'0.08em', borderBottom:'1.5px solid #e0e7ff', whiteSpace:'nowrap' }
  const tdStyle = { padding:'12px 14px', fontSize:13, color:'#1e1b4b', borderBottom:'1px solid #f0f2ff', verticalAlign:'middle' }

  return (
    <div style={{ padding:'32px 28px', fontFamily:'Inter,sans-serif', minHeight:'100vh', background:'#f8f9ff' }}>
      {editTarget && (
        <EditModal instructor={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} />
      )}

      {/* Toggle confirm */}
      {toggleTarget && (
        <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(15,12,40,0.45)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}
          onClick={() => !toggleLoading && setToggleTarget(null)}>
          <div style={{ background:'#fff',borderRadius:16,border:'1px solid #e0e7ff',boxShadow:'0 20px 60px rgba(0,0,0,0.18)',padding:'28px 28px 24px',maxWidth:420,width:'100%' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize:17,fontWeight:800,color:'#1e1b4b',marginBottom:8 }}>
              {toggleTarget.is_active ? 'Deactivate Instructor' : 'Activate Instructor'}
            </h2>
            <div style={{ background:'#f8f9ff',border:'1px solid #e0e7ff',borderRadius:9,padding:'10px 14px',marginBottom:16 }}>
              <p style={{ fontSize:14,fontWeight:700,color:'#1e1b4b',margin:0 }}>{[toggleTarget.first_name,toggleTarget.last_name].filter(Boolean).join(' ')}</p>
              <p style={{ fontSize:12,color:'#94a3b8',margin:'2px 0 0' }}>{toggleTarget.email}</p>
            </div>
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
              <button onClick={() => setToggleTarget(null)} disabled={toggleLoading}
                style={{ padding:'9px 20px',borderRadius:9,border:'1.5px solid #e0e7ff',background:'#fff',color:'#94a3b8',fontSize:14,fontWeight:600,cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={confirmToggle} disabled={toggleLoading}
                style={{ padding:'9px 20px',borderRadius:9,border:'none',background:toggleTarget.is_active?'#d97706':'#059669',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer' }}>
                {toggleLoading ? '…' : toggleTarget.is_active ? 'Yes, Deactivate' : 'Yes, Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(15,12,40,0.45)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}
          onClick={() => !deleting && setDeleteTarget(null)}>
          <div style={{ background:'#fff',borderRadius:16,border:'1px solid #e0e7ff',boxShadow:'0 20px 60px rgba(0,0,0,0.18)',padding:'28px 28px 24px',maxWidth:420,width:'100%' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize:17,fontWeight:800,color:'#1e1b4b',marginBottom:8 }}>Delete Instructor</h2>
            <div style={{ background:'#fff1f2',border:'1px solid #fecdd3',borderRadius:9,padding:'10px 14px',marginBottom:16 }}>
              <p style={{ fontSize:14,fontWeight:700,color:'#1e1b4b',margin:0 }}>{[deleteTarget.first_name,deleteTarget.last_name].filter(Boolean).join(' ')}</p>
              <p style={{ fontSize:12,color:'#94a3b8',margin:'2px 0 0' }}>{deleteTarget.email}</p>
            </div>
            <p style={{ fontSize:13,color:'#f43f5e',fontWeight:600,marginBottom:24 }}>This action cannot be undone.</p>
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                style={{ padding:'9px 20px',borderRadius:9,border:'1.5px solid #e0e7ff',background:'#fff',color:'#94a3b8',fontSize:14,fontWeight:600,cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                style={{ padding:'9px 20px',borderRadius:9,border:'none',background:'#ef4444',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer' }}>
                {deleting ? '…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24,fontWeight:800,color:'#1e1b4b',margin:0 }}>Instructors</h1>
          <p style={{ fontSize:13,color:'#94a3b8',marginTop:4 }}>{instructors.length} registered instructors</p>
        </div>
        <button onClick={() => navigate('/instructors/create')}
          style={{ padding:'10px 20px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#4f46e5,#7c3aed)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer' }}>
          + New Instructor
        </button>
      </div>

      {error && <div style={{ padding:'12px 16px',background:'#fff1f2',border:'1px solid #fecdd3',borderRadius:10,color:'#f43f5e',fontSize:13,marginBottom:16 }}>{error}</div>}

      <div style={{ background:'#fff',borderRadius:16,border:'1px solid #e0e7ff',boxShadow:'0 4px 24px rgba(99,102,241,0.06)',overflow:'hidden' }}>
        {/* Search */}
        <div style={{ padding:'14px 18px',borderBottom:'1px solid #f0f2ff',display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ position:'relative',flex:1,maxWidth:360 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search by name, department or email…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width:'100%',paddingLeft:34,paddingRight:search?32:12,paddingTop:8,paddingBottom:8,border:'1.5px solid #e0e7ff',borderRadius:9,fontSize:13,color:'#1e1b4b',background:'#f8f9ff',outline:'none',boxSizing:'border-box' }} />
            {search && <button onClick={() => setSearch('')} style={{ position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',border:'none',background:'none',cursor:'pointer',color:'#94a3b8',fontSize:16,lineHeight:1 }}>×</button>}
          </div>
          {search && <span style={{ fontSize:12,color:'#94a3b8' }}>{filtered.length} result{filtered.length!==1?'s':''}</span>}
        </div>

        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Name','Email','Title','Department','Status','Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={COLS} style={{ ...tdStyle,textAlign:'center',color:'#94a3b8',padding:'40px 16px' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={COLS} style={{ ...tdStyle,textAlign:'center',color:'#94a3b8',padding:'40px 16px' }}>
                  {search ? `No instructors match "${search}"` : 'No instructors found'}
                </td></tr>
              ) : filtered.map((ins, i) => (
                <tr key={ins.id} style={{ background: i%2===0 ? '#fff' : '#fafbff' }}>
                  <td style={tdStyle}>
                    <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <div style={{ width:34,height:34,borderRadius:10,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:700,flexShrink:0 }}>
                        {[ins.first_name,ins.last_name].filter(Boolean).map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?'}
                      </div>
                      <div>
                        <div style={{ fontWeight:600,color:'#1e1b4b' }}>{[ins.first_name,ins.last_name].filter(Boolean).join(' ')||'—'}</div>
                        <div style={{ fontSize:11,color:'#94a3b8' }}>Since {fmtDate(ins.created_at)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>{ins.email}</td>
                  <td style={tdStyle}>{ins.title||'—'}</td>
                  <td style={tdStyle}>{ins.department||'—'}</td>
                  <td style={tdStyle}>
                    <span style={{ padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,
                      background: ins.is_active ? '#ecfdf5' : '#fff1f2',
                      color: ins.is_active ? '#059669' : '#f59e0b' }}>
                      {ins.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                      <button onClick={() => setEditTarget(ins)}
                        style={{ padding:'5px 12px',borderRadius:8,border:'1.5px solid #4f46e5',background:'#f0f2ff',color:'#4f46e5',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                        Edit
                      </button>
                      <button onClick={() => handleToggle(ins)} disabled={toggling===ins.id}
                        style={{ padding:'5px 12px',borderRadius:8,border:`1.5px solid ${ins.is_active?'#f59e0b':'#059669'}`,background:ins.is_active?'#fffbeb':'#ecfdf5',color:ins.is_active?'#d97706':'#059669',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                        {ins.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => setDeleteTarget(ins)}
                        style={{ padding:'5px 12px',borderRadius:8,border:'1.5px solid #fecdd3',background:'#fff1f2',color:'#f43f5e',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}