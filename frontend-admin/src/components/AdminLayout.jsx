import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const NAV = [
  {
    to: '/students',
    label: 'Students',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    to: '/instructors',
    label: 'Instructors',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
  },
]

export default function AdminLayout() {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_name')
    navigate('/login')
  }

  const adminName = localStorage.getItem('admin_name') ?? 'Admin'
  const initial = adminName.charAt(0).toUpperCase()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 'var(--sidebar-w)',
        minHeight: '100vh',
        background: 'var(--card)',
        borderRight: '1px solid var(--bdr)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        boxShadow: 'var(--sh-md)',
      }}>

        {/* Brand */}
        <div style={{
          height: 'var(--header-h)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 20px',
          borderBottom: '1px solid var(--bdr)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--pri)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <polyline points="16 11 18 13 22 9"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--txt)', lineHeight: 1.1 }}>Attendify</div>
            <div style={{ fontSize: 11, color: 'var(--txt-muted)', fontWeight: 500 }}>Admin Panel</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: 'var(--txt-muted)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '0 8px', marginBottom: 6,
          }}>
            Management
          </div>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8,
                fontWeight: 600, fontSize: 14,
                color: isActive ? 'var(--pri)' : 'var(--txt-muted)',
                background: isActive ? 'var(--pri-light)' : 'transparent',
                transition: 'all 0.15s',
              })}
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--bdr)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, border: 'none',
              background: 'transparent', color: 'var(--rose)',
              fontWeight: 600, fontSize: 14, transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--rose-light)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ marginLeft: 'var(--sidebar-w)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Top header */}
        <header style={{
          height: 'var(--header-h)',
          background: 'var(--card)',
          borderBottom: '1px solid var(--bdr)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 28px',
          position: 'sticky', top: 0, zIndex: 50,
          boxShadow: 'var(--sh)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--pri-light)',
              border: '2px solid var(--pri-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13, color: 'var(--pri)',
            }}>
              {initial}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--txt)' }}>{adminName}</div>
              <div style={{ fontSize: 11, color: 'var(--txt-muted)' }}>Administrator</div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
