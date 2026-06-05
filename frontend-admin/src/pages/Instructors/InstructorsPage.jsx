import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getInstructors, toggleUserStatus, deleteInstructor } from '../../services/adminService.js'

// ── helpers ───────────────────────────────────────────────────────────────────


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

const COLS = 7

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
            width: i === 0 ? '65%' : i === 1 ? '85%' : '50%',
          }} />
        </td>
      ))}
    </tr>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function InstructorsPage() {
  const navigate = useNavigate()
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading]         = useState(true)
  const [toggling, setToggling]       = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await getInstructors()
      setInstructors(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleToggle(instructor) {
    setToggling(instructor.id)
    try {
      await toggleUserStatus(instructor.id, 'instructor', !instructor.is_active)
      await load()
    } finally {
      setToggling(null)
    }
  }

  function handleDelete(instructor) {
    setDeleteTarget(instructor)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteInstructor(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } finally {
      setDeleteLoading(false)
    }
  }

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
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt)', lineHeight: 1.2 }}>Instructors</h1>
          {!loading && (
            <p style={{ fontSize: 12, color: 'var(--txt-muted)', marginTop: 4 }}>
              {instructors.length} accounts
            </p>
          )}
        </div>

        <button
          onClick={() => navigate('/instructors/create')}
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
          Add Instructor
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr style={{ background: '#3730a3' }}>
                {['Name', 'Email', 'Instructor ID', 'Department', 'Title', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: 12, fontWeight: 700,
                    color: '#fff',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} shade={i % 2 !== 0} />)
                : instructors.map((ins, i) => (
                  <tr
                    key={ins.id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#f8f9ff', borderTop: '1px solid var(--bdr)' }}
                  >
                    {/* Name */}
                    <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 600, color: 'var(--txt)', whiteSpace: 'nowrap' }}>
                      {ins.name}
                    </td>

                    {/* Email */}
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--txt-muted)', whiteSpace: 'nowrap' }}>
                      {ins.email}
                    </td>

                    {/* Instructor ID */}
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--pri)' }}>
                        {ins.instructor_id}
                      </span>
                    </td>

                    {/* Department */}
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--txt)', whiteSpace: 'nowrap' }}>
                      {ins.department}
                    </td>

                    {/* Title */}
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--txt-muted)', whiteSpace: 'nowrap' }}>
                      {ins.title}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '13px 16px' }}>
                      {statusBadge(ins.is_active)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          disabled={toggling === ins.id}
                          onClick={() => handleToggle(ins)}
                          style={{
                            border: 'none', background: 'none',
                            fontSize: 13, fontWeight: 600,
                            cursor: toggling === ins.id ? 'wait' : 'pointer',
                            color: ins.is_active ? 'var(--rose)' : 'var(--green)',
                            opacity: toggling === ins.id ? 0.5 : 1,
                            padding: '3px 0',
                          }}
                        >
                          {toggling === ins.id ? '…' : ins.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <span style={{ color: 'var(--bdr)', fontSize: 16 }}>|</span>
                        <button
                          disabled={toggling === ins.id}
                          onClick={() => handleDelete(ins)}
                          style={{
                            border: 'none', background: 'none',
                            fontSize: 13, fontWeight: 600,
                            cursor: toggling === ins.id ? 'wait' : 'pointer',
                            color: '#94a3b8',
                            opacity: toggling === ins.id ? 0.5 : 1,
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
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: 12, color: 'var(--pri)', fontWeight: 500 }}>
              Instructors do not require face setup and cannot use face check-in.
              They manage sessions and view attendance reports through the instructor portal.
            </span>
          </div>
        )}
      </div>

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
              Delete Instructor Account
            </h2>

            {/* Body */}
            <p style={{ fontSize: 14, color: 'var(--txt-muted)', lineHeight: 1.6, marginBottom: 6 }}>
              You are about to permanently delete the account for:
            </p>
            <div style={{
              background: '#f8f9ff', border: '1px solid var(--bdr)',
              borderRadius: 9, padding: '10px 14px', marginBottom: 8,
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', margin: 0 }}>{deleteTarget.name}</p>
              <p style={{ fontSize: 12, color: 'var(--txt-muted)', margin: '2px 0 0' }}>{deleteTarget.email} · {deleteTarget.instructor_id}</p>
            </div>
            <p style={{ fontSize: 13, color: 'var(--rose)', fontWeight: 600, marginBottom: 24 }}>
              This will remove the instructor account permanently. Sessions and attendance records linked to this instructor may be affected. This action cannot be undone.
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
