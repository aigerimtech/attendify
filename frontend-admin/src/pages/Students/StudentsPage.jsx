import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudents, toggleUserStatus, deleteStudent, editUser } from '../../services/adminService.js'

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const COLS = 8

/* ── Edit Modal ──────────────────────────────────────────────────────────── */
function EditModal({ student, onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name:     student.first_name || '',
    last_name:      student.last_name  || '',
    email:          student.email      || '',
    student_number: student.student_number || '',
    department:     student.department || '',
    new_password:   '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async () => {
    setSaving(true); setError('')
    try {
      const payload = {}
      if (form.first_name.trim())     payload.first_name     = form.first_name.trim()
      if (form.last_name.trim())      payload.last_name      = form.last_name.trim()
      if (form.email.trim())          payload.email          = form.email.trim()
      if (form.student_number.trim()) payload.student_number = form.student_number.trim()
      if (form.department.trim())     payload.department     = form.department.trim()
      if (form.new_password.trim())   payload.new_password   = form.new_password.trim()
      const updated = await editUser(student.id, payload)
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save.')
    } finally { setSaving(false) }
  }

  const inputCls = 'w-full px-3 py-2 border border-[#e0e7ff] dark:border-[#2e2c48] rounded-xl text-sm text-[#1e1b4b] dark:text-slate-200 bg-white dark:bg-[#17162a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]'

  return (
    <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(15,12,40,0.45)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}
      onClick={onClose}>
      <div style={{ background:'#fff',borderRadius:16,border:'1px solid #e0e7ff',boxShadow:'0 20px 60px rgba(0,0,0,0.18)',padding:'28px 28px 24px',maxWidth:460,width:'100%' }}
        onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize:17,fontWeight:800,color:'#1e1b4b',marginBottom:20 }}>Edit Student</h2>

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
            <label style={{ fontSize:11,fontWeight:600,color:'#6366f1',display:'block',marginBottom:4 }}>Student Number</label>
            <input name="student_number" value={form.student_number} onChange={handle} className={inputCls} />
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

export default function StudentsPage() {
  const navigate = useNavigate()
  const [students,      setStudents]      = useState([])
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
    getStudents()
      .then(setStudents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleToggle(student) { setToggleTarget(student) }

  async function confirmToggle() {
    if (!toggleTarget) return
    setToggleLoading(true)
    setToggling(toggleTarget.id)
    try {
      await toggleUserStatus(toggleTarget.id, 'student', !toggleTarget.is_active)
      setStudents(list => list.map(s => s.id === toggleTarget.id ? { ...s, is_active: !s.is_active } : s))
      setToggleTarget(null)
    } catch (e) { setError(e.message) }
    finally { setToggleLoading(false); setToggling(null) }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteStudent(deleteTarget.id)
      setStudents(list => list.filter(s => s.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (e) { setError(e.message) }
    finally { setDeleting(false) }
  }

  function handleSaved(updated) {
    setStudents(list => list.map(s => s.id === updated.id ? { ...s, ...updated } : s))
  }

  const q = search.toLowerCase()
  const filtered = students.filter(s => {
    const name  = [s.first_name, s.last_name].filter(Boolean).join(' ').toLowerCase()
    const id    = (s.student_number || '').toLowerCase()
    const email = (s.email || '').toLowerCase()
    return !q || name.includes(q) || id.includes(q) || email.includes(q)
  })

  const thStyle = { padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6366f1', textTransform:'uppercase', letterSpacing:'0.08em', borderBottom:'1.5px solid #e0e7ff', whiteSpace:'nowrap' }
  const tdStyle = { padding:'12px 14px', fontSize:13, color:'#1e1b4b', borderBottom:'1px solid #f0f2ff', verticalAlign:'middle' }

  return (
    <div style={{ padding:'32px 28px', fontFamily:'Inter,sans-serif', minHeight:'100vh', background:'#f8f9ff' }}>
      {editTarget && (
        <EditModal student={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} />
      )}

      {/* Toggle confirm */}
      {toggleTarget && (
        <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(15,12,40,0.45)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}
          onClick={() => !toggleLoading && setToggleTarget(null)}>
          <div style={{ background:'#fff',borderRadius:16,border:'1px solid #e0e7ff',boxShadow:'0 20px 60px rgba(0,0,0,0.18)',padding:'28px 28px 24px',maxWidth:420,width:'100%' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize:17,fontWeight:800,color:'#1e1b4b',marginBottom:8 }}>
              {toggleTarget.is_active ? 'Deactivate Student Account' : 'Activate Student Account'}
            </h2>
            <div style={{ background:'#f8f9ff',border:'1px solid #e0e7ff',borderRadius:9,padding:'10px 14px',marginBottom:16 }}>
              <p style={{ fontSize:14,fontWeight:700,color:'#1e1b4b',margin:0 }}>{[toggleTarget.first_name,toggleTarget.last_name].filter(Boolean).join(' ')}</p>
              <p style={{ fontSize:12,color:'#94a3b8',margin:'2px 0 0' }}>{toggleTarget.email} · {toggleTarget.student_number}</p>
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
            <h2 style={{ fontSize:17,fontWeight:800,color:'#1e1b4b',marginBottom:8 }}>Delete Student</h2>
            <div style={{ background:'#fff1f2',border:'1px solid #fecdd3',borderRadius:9,padding:'10px 14px',marginBottom:16 }}>
              <p style={{ fontSize:14,fontWeight:700,color:'#1e1b4b',margin:0 }}>{[deleteTarget.first_name,deleteTarget.last_name].filter(Boolean).join(' ')}</p>
              <p style={{ fontSize:12,color:'#94a3b8',margin:'2px 0 0' }}>{deleteTarget.email} · {deleteTarget.student_number}</p>
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
          <h1 style={{ fontSize:24,fontWeight:800,color:'#1e1b4b',margin:0 }}>Students</h1>
          <p style={{ fontSize:13,color:'#94a3b8',marginTop:4 }}>{students.length} registered students</p>
        </div>
        <button onClick={() => navigate('/students/create')}
          style={{ padding:'10px 20px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#4f46e5,#7c3aed)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer' }}>
          + New Student
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
            <input type="text" placeholder="Search by name, student ID or email…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width:'100%',paddingLeft:34,paddingRight:search?32:12,paddingTop:8,paddingBottom:8,border:'1.5px solid #e0e7ff',borderRadius:9,fontSize:13,color:'#1e1b4b',background:'#f8f9ff',outline:'none',boxSizing:'border-box' }} />
            {search && <button onClick={() => setSearch('')} style={{ position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',border:'none',background:'none',cursor:'pointer',color:'#94a3b8',fontSize:16,lineHeight:1 }}>×</button>}
          </div>
          {search && <span style={{ fontSize:12,color:'#94a3b8' }}>{filtered.length} result{filtered.length!==1?'s':''}</span>}
        </div>

        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Name','Email','Student ID','Department','Enrolled','Face Setup','Status','Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={COLS} style={{ ...tdStyle,textAlign:'center',color:'#94a3b8',padding:'40px 16px' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={COLS} style={{ ...tdStyle,textAlign:'center',color:'#94a3b8',padding:'40px 16px' }}>
                  {search ? `No students match "${search}"` : 'No students found'}
                </td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id} style={{ background: i%2===0 ? '#fff' : '#fafbff' }}>
                  <td style={tdStyle}>
                    <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <div style={{ width:34,height:34,borderRadius:10,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:700,flexShrink:0 }}>
                        {[s.first_name,s.last_name].filter(Boolean).map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?'}
                      </div>
                      <div>
                        <div style={{ fontWeight:600,color:'#1e1b4b' }}>{[s.first_name,s.last_name].filter(Boolean).join(' ')||'—'}</div>
                        <div style={{ fontSize:11,color:'#94a3b8' }}>Since {fmtDate(s.created_at)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>{s.email}</td>
                  <td style={tdStyle}><span style={{ fontFamily:'monospace',fontWeight:600 }}>{s.student_number||'—'}</span></td>
                  <td style={tdStyle}><span style={{ fontWeight:600 }}>{s.department||'—'}</span></td>
                  <td style={tdStyle}>
                    <span style={{ padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:'#f0f2ff',color:'#4f46e5' }}>CS101, CS201</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,
                      background: s.face_enrolled ? '#ecfdf5' : '#fff1f2',
                      color: s.face_enrolled ? '#059669' : '#f43f5e' }}>
                      {s.face_enrolled ? 'Complete' : 'Pending'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,
                      background: s.is_active ? '#ecfdf5' : '#fff1f2',
                      color: s.is_active ? '#059669' : '#f59e0b' }}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                      <button onClick={() => setEditTarget(s)}
                        style={{ padding:'5px 12px',borderRadius:8,border:'1.5px solid #4f46e5',background:'#f0f2ff',color:'#4f46e5',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                        Edit
                      </button>
                      <button onClick={() => handleToggle(s)} disabled={toggling===s.id}
                        style={{ padding:'5px 12px',borderRadius:8,border:`1.5px solid ${s.is_active?'#f59e0b':'#059669'}`,background:s.is_active?'#fffbeb':'#ecfdf5',color:s.is_active?'#d97706':'#059669',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                        {s.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => setDeleteTarget(s)}
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