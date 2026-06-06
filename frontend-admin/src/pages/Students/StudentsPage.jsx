import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudents, toggleUserStatus, deleteStudent } from '../../services/adminService.js'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}


function statusBadge(active) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px', borderRadius: 99,
      fontSize: 12, fontWeight: 700,
      background: active ? 'var(--green-light)' : 'var(--rose-light)',
      color:      active ? 'var(--green)'       : 'var(--rose)',
      border:     `1px solid ${active ? '#6ee7b7' : '#fecdd3'}`,
    }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

// ── skeleton ──────────────────────────────────────────────────────────────────

const COLS = 8

function SkeletonRow({ shade }) {
  return (
    <tr style={{ background: shade ? '#f8f9ff' : '#fff' }}>
      {Array.from({ length: COLS }).map((_, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{
            height: 14, borderRadius: 6,
            background: 'linear-gradient(90deg,#e0e7ff 25%,#f0f2ff 50%,#e0e7ff 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
            width: i === 0 ? '70%' : i === 1 ? '90%' : '55%',
          }} />
        </td>
      ))}
    </tr>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)
  const [toggling, setToggling]           = useState(null)
  const [toggleTarget, setToggleTarget]   = useState(null)
  const [toggleLoading, setToggleLoading] = useState(false)
  const [deleteTarget, setDeleteTarget]   = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    try {
      const data = await getStudents()
      setStudents(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleToggle(student) {
    setToggleTarget(student)
  }

  async function confirmToggle() {
    if (!toggleTarget) return
    setToggleLoading(true)
    setToggling(toggleTarget.id)
    try {
      await toggleUserStatus(toggleTarget.id, 'student', !toggleTarget.is_active)
      setToggleTarget(null)
      await load()
    } finally {
      setToggleLoading(false)
      setToggling(null)
    }
  }

  function handleDelete(student) {
    setDeleteTarget(student)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteStudent(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } finally {
      setDeleteLoading(false)
    }
  }

  const pending = students.filter(s => s.face_photos_count < 3).length

  const q = search.toLowerCase()
  const filtered = students.filter(s => {
    const name = [s.first_name, s.last_name].filter(Boolean).join(' ').toLowerCase()
    const id   = (s.student_number || '').toLowerCase()
    const email = (s.email || '').toLowerCase()
    return !q || name.includes(q) || id.includes(q) || email.includes(q)
  })

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt)', lineHeight: 1.2 }}>Students</h1>
          {!loading && (
            <p style={{ fontSize: 12, color: 'var(--txt-muted)', marginTop: 4 }}>
              {students.length} accounts&nbsp;·&nbsp;
              <span style={{ color: pending > 0 ? '#ea580c' : 'var(--txt-muted)' }}>
                {pending} pending face setup
              </span>
            </p>
          )}
        </div>

        <button
          onClick={() => navigate('/students/create')}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: '#fff', fontWeight: 700, fontSize: 14,
            boxShadow: '0 2px 8px 0 rgb(5 150 105 / .25)',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          Add Student
        </button>
      </div>

      {/* ── Table card ── */}
      <div style={{
        background: 'var(--card)',
        borderRadius: 14,
        border: '1px solid var(--bdr)',
        boxShadow: 'var(--sh)',
        overflow: 'hidden',
      }}>
        {/* Search bar */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, student ID or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: 34, paddingRight: search ? 32 : 12,
                paddingTop: 8, paddingBottom: 8,
                border: '1.5px solid var(--bdr)', borderRadius: 9,
                fontSize: 13, color: 'var(--txt)', background: '#f8f9ff',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, lineHeight: 1,
              }}>×</button>
            )}
          </div>
          {search && (
            <span style={{ fontSize: 12, color: 'var(--txt-muted)' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr style={{ background: '#eef2ff' }}>
                {['Name', 'Email', 'Student ID', 'Department', 'Enrolled', 'Face Setup', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: 12, fontWeight: 700,
                    color: '#3730a3',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                    borderBottom: '2px solid #c7d2fe',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} shade={i % 2 !== 0} />)
                : filtered.length === 0 ? (
                  <tr><td colSpan={COLS} style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: 'var(--txt-muted)' }}>
                    No students match &ldquo;{search}&rdquo;
                  </td></tr>
                ) : filtered.map((s, i) => (
                  <tr
                    key={s.id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#f8f9ff', borderTop: '1px solid var(--bdr)' }}
                  >
                    {/* Name */}
                    <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 600, color: 'var(--txt)', whiteSpace: 'nowrap' }}>
                      {[s.first_name, s.last_name].filter(Boolean).join(' ') || '—'}
                    </td>

                    {/* Email */}
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--txt-muted)', whiteSpace: 'nowrap' }}>
                      {s.email}
                    </td>

                    {/* Student ID */}
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--pri)' }}>
                        {s.student_number || '—'}
                      </span>
                    </td>

                    {/* Department */}
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--txt)', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600 }}>{s.department || '—'}</span>
                    </td>

                    {/* Enrolled */}
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--txt-muted)', whiteSpace: 'nowrap' }}>
                      {fmtDate(s.enroll_date)}
                    </td>

                    {/* Face Setup */}
                    <td style={{ padding: '13px 16px' }}>
                      {s.face_enrolled
                        ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#059669' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Complete
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#e11d48' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            Pending
                          </span>
                        )
                      }
                    </td>

                    {/* Status */}
                    <td style={{ padding: '13px 16px' }}>
                      {statusBadge(s.is_active)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          disabled={toggling === s.id}
                          onClick={() => handleToggle(s)}
                          style={{
                            border: 'none', background: 'none',
                            fontSize: 13, fontWeight: 600,
                            cursor: toggling === s.id ? 'wait' : 'pointer',
                            color: s.is_active ? '#f59e0b' : 'var(--green)',
                            opacity: toggling === s.id ? 0.5 : 1,
                            padding: '3px 0',
                          }}
                        >
                          {toggling === s.id ? '…' : s.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <span style={{ color: 'var(--bdr)', fontSize: 16 }}>|</span>
                        <button
                          disabled={toggling === s.id}
                          onClick={() => handleDelete(s)}
                          style={{
                            border: 'none', background: 'none',
                            fontSize: 13, fontWeight: 600,
                            cursor: toggling === s.id ? 'wait' : 'pointer',
                            color: '#94a3b8',
                            opacity: toggling === s.id ? 0.5 : 1,
                            padding: '3px 0',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Info note */}
        {!loading && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 18px',
            borderTop: '1px solid var(--bdr)',
            background: 'var(--pri-light)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--pri)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: 12, color: 'var(--pri)', fontWeight: 500 }}>
              Students with pending face setup cannot access the dashboard. On first login they are redirected to register their face before accessing schedule, attendance, or QR check-in.
            </span>
          </div>
        )}
      </div>

      {toggleTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,12,40,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
          onClick={() => !toggleLoading && setToggleTarget(null)}
        >
          <div style={{
            background: '#fff', borderRadius: 16,
            border: '1px solid var(--bdr)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            padding: '28px 28px 24px',
            maxWidth: 420, width: '100%',
          }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: toggleTarget.is_active ? '#fffbeb' : 'var(--green-light)',
              border: `1px solid ${toggleTarget.is_active ? '#fde68a' : '#6ee7b7'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={toggleTarget.is_active ? '#d97706' : '#059669'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {toggleTarget.is_active
                  ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                  : <><polyline points="20 6 9 17 4 12"/></>
                }
              </svg>
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--txt)', marginBottom: 8 }}>
              {toggleTarget.is_active ? 'Deactivate Student Account' : 'Activate Student Account'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--txt-muted)', lineHeight: 1.6, marginBottom: 6 }}>
              {toggleTarget.is_active
                ? 'Are you sure you want to deactivate the account for:'
                : 'Are you sure you want to activate the account for:'}
            </p>
            <div style={{
              background: '#f8f9ff', border: '1px solid var(--bdr)',
              borderRadius: 9, padding: '10px 14px', marginBottom: 8,
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', margin: 0 }}>{[toggleTarget.first_name, toggleTarget.last_name].filter(Boolean).join(' ')}</p>
              <p style={{ fontSize: 12, color: 'var(--txt-muted)', margin: '2px 0 0' }}>{toggleTarget.email} · {toggleTarget.student_number}</p>
            </div>
            <p style={{ fontSize: 13, color: toggleTarget.is_active ? '#d97706' : '#059669', fontWeight: 600, marginBottom: 24 }}>
              {toggleTarget.is_active
                ? 'Deactivated students cannot log in or access the system.'
                : 'This student will regain access to the system.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setToggleTarget(null)}
                disabled={toggleLoading}
                style={{
                  padding: '9px 20px', borderRadius: 9,
                  border: '1.5px solid var(--bdr)',
                  background: '#fff', color: 'var(--txt-muted)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmToggle}
                disabled={toggleLoading}
                style={{
                  padding: '9px 20px', borderRadius: 9, border: 'none',
                  background: toggleLoading
                    ? (toggleTarget.is_active ? '#fde68a' : '#6ee7b7')
                    : (toggleTarget.is_active ? '#d97706' : '#059669'),
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: toggleLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {toggleLoading ? '…' : toggleTarget.is_active ? 'Yes, Deactivate' : 'Yes, Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,12,40,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
          onClick={() => !deleteLoading && setDeleteTarget(null)}
        >
          <div style={{
            background: '#fff', borderRadius: 16,
            border: '1px solid var(--bdr)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            padding: '28px 28px 24px',
            maxWidth: 420, width: '100%',
          }}
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'var(--rose-light)',
              border: '1px solid #fecdd3',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            </div>

            {/* Title */}
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--txt)', marginBottom: 8 }}>
              Delete Student Account
            </h2>

            {/* Body */}
            <p style={{ fontSize: 14, color: 'var(--txt-muted)', lineHeight: 1.6, marginBottom: 6 }}>
              You are about to permanently delete the account for:
            </p>
            <div style={{
              background: '#f8f9ff', border: '1px solid var(--bdr)',
              borderRadius: 9, padding: '10px 14px', marginBottom: 8,
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', margin: 0 }}>{[deleteTarget.first_name, deleteTarget.last_name].filter(Boolean).join(' ')}</p>
              <p style={{ fontSize: 12, color: 'var(--txt-muted)', margin: '2px 0 0' }}>{deleteTarget.email} · {deleteTarget.student_number}</p>
            </div>
            <p style={{ fontSize: 13, color: 'var(--rose)', fontWeight: 600, marginBottom: 24 }}>
              This will delete all attendance records and face data. This action cannot be undone.
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                style={{
                  padding: '9px 20px', borderRadius: 9,
                  border: '1.5px solid var(--bdr)',
                  background: '#fff', color: 'var(--txt-muted)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                style={{
                  padding: '9px 20px', borderRadius: 9, border: 'none',
                  background: deleteLoading ? '#fecdd3' : 'var(--rose)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(244,63,94,0.25)',
                }}
              >
                {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
