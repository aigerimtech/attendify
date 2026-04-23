import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getInstructors, toggleUserStatus } from '../../services/adminService.js'

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
                {['Name', 'Email', 'Instructor ID', 'Department', 'Title', 'Contract Start', 'Status', 'Actions'].map(h => (
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

                    {/* Contract Start */}
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--txt-muted)', whiteSpace: 'nowrap' }}>
                      {fmtDate(ins.contract_start_date)}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '13px 16px' }}>
                      {statusBadge(ins.is_active)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '13px 16px' }}>
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
    </>
  )
}
