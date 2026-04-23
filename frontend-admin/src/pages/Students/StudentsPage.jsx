import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudents, toggleUserStatus } from '../../services/adminService.js'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function faceBadge(n) {
  const configs = {
    3: { bg: 'var(--green-light)', color: 'var(--green)',   border: '#6ee7b7' },
    2: { bg: '#fff7ed',            color: '#ea580c',        border: '#fed7aa' },
    1: { bg: '#fff7ed',            color: '#ea580c',        border: '#fed7aa' },
    0: { bg: 'var(--rose-light)',  color: 'var(--rose)',    border: '#fecdd3' },
  }
  const c = configs[n] ?? configs[0]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 99,
      fontSize: 12, fontWeight: 700,
      background: c.bg, color: c.color,
      border: `1px solid ${c.border}`,
    }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
      {n}/3
    </span>
  )
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
  const [toggling, setToggling] = useState(null) // id being toggled

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

  async function handleToggle(student) {
    setToggling(student.id)
    try {
      await toggleUserStatus(student.id, 'student', !student.is_active)
      await load()
    } finally {
      setToggling(null)
    }
  }

  const pending = students.filter(s => s.face_photos_count < 3).length

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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr style={{ background: '#3730a3' }}>
                {['Name', 'Email', 'Student ID', 'Dept · Duration', 'Enrolled', 'Face', 'Status', 'Actions'].map(h => (
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
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} shade={i % 2 !== 0} />)
                : students.map((s, i) => (
                  <tr
                    key={s.id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#f8f9ff', borderTop: '1px solid var(--bdr)' }}
                  >
                    {/* Name */}
                    <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 600, color: 'var(--txt)', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </td>

                    {/* Email */}
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--txt-muted)', whiteSpace: 'nowrap' }}>
                      {s.email}
                    </td>

                    {/* Student ID */}
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--pri)' }}>
                        {s.student_id}
                      </span>
                    </td>

                    {/* Dept · Duration */}
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--txt)', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600 }}>{s.department}</span>
                      <span style={{ color: 'var(--txt-muted)' }}> · {s.program_duration_years}yr</span>
                    </td>

                    {/* Enrolled */}
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--txt-muted)', whiteSpace: 'nowrap' }}>
                      {fmtDate(s.enroll_date)}
                    </td>

                    {/* Face */}
                    <td style={{ padding: '13px 16px' }}>
                      {faceBadge(s.face_photos_count)}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '13px 16px' }}>
                      {statusBadge(s.is_active)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '13px 16px' }}>
                      <button
                        disabled={toggling === s.id}
                        onClick={() => handleToggle(s)}
                        style={{
                          border: 'none', background: 'none',
                          fontSize: 13, fontWeight: 600, cursor: toggling === s.id ? 'wait' : 'pointer',
                          color: s.is_active ? 'var(--rose)' : 'var(--green)',
                          opacity: toggling === s.id ? 0.5 : 1,
                          padding: '3px 0',
                        }}
                      >
                        {toggling === s.id ? '…' : s.is_active ? 'Deactivate' : 'Activate'}
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
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: 12, color: 'var(--pri)', fontWeight: 500 }}>
              Face column shows the number of registered face photos (3 required for attendance verification).
              Students with 0/3 cannot use face check-in.
            </span>
          </div>
        )}
      </div>
    </>
  )
}
