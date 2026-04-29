import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

const PAGE_TITLES = {
  '/students':            'Students',
  '/students/create':     'Add New Student',
  '/instructors':         'Instructors',
  '/instructors/create':  'Add New Instructor',
}

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
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const sidebarW = collapsed ? 64 : 220
  const pageTitle = PAGE_TITLES[pathname] ?? 'Dashboard'

  function handleLogout() {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_name')
    navigate('/login')
  }

  const adminName = localStorage.getItem('admin_name') ?? 'Admin'
  const initial = adminName.charAt(0).toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarW,
        height: '100vh',
        background: 'var(--card)',
        borderRight: '1px solid var(--bdr)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        zIndex: 100,
        boxShadow: 'var(--sh-md)',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}>

        {/* Brand */}
        <div style={{
          height: 'var(--header-h)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: collapsed ? '0 14px' : '0 18px',
          borderBottom: '1px solid var(--bdr)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--pri)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <polyline points="16 11 18 13 22 9"/>
            </svg>
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--txt)', lineHeight: 1.1 }}>Attendify</div>
              <div style={{ fontSize: 11, color: 'var(--txt-muted)', fontWeight: 500, marginTop: 1 }}>Admin Panel</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1,
          padding: collapsed ? '16px 8px' : '16px 12px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {!collapsed && (
            <div style={{
              fontSize: 10, fontWeight: 700, color: 'var(--txt-muted)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '0 8px 6px', marginBottom: 0,
            }}>
              Management
            </div>
          )}
          {collapsed && <div style={{ height: 6 }} />}

          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? 0 : 10,
                padding: collapsed ? '9px 0' : '9px 12px',
                borderRadius: 8,
                fontWeight: 600, fontSize: 14,
                color: isActive ? 'var(--pri)' : 'var(--txt-muted)',
                background: isActive ? 'var(--pri-light)' : 'transparent',
                transition: 'all 0.15s',
              })}
            >
              {icon}
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* Toggle button */}
        <div style={{ padding: collapsed ? '8px 8px' : '8px 12px', flexShrink: 0 }}>
          <button
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? 'Expand sidebar' : undefined}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 8,
              padding: '6px',
              borderRadius: 8,
              border: '1px solid var(--bdr)',
              background: 'transparent',
              color: 'var(--txt-muted)',
              cursor: 'pointer',
              transition: 'color 0.15s',
              fontFamily: 'var(--font)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--pri)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-muted)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {collapsed
                ? <polyline points="9 18 15 12 9 6"/>
                : <polyline points="15 18 9 12 15 6"/>
              }
            </svg>
            {!collapsed && (
              <span style={{ fontSize: 12, fontWeight: 500 }}>Collapse</span>
            )}
          </button>
        </div>

        {/* Logout */}
        <div style={{ padding: collapsed ? '8px 8px 16px' : '8px 12px 16px', borderTop: '1px solid var(--bdr)', flexShrink: 0 }}>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Log out' : undefined}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : 10,
              padding: '9px 12px',
              borderRadius: 8, border: 'none',
              background: 'transparent', color: 'var(--rose)',
              fontWeight: 600, fontSize: 14,
              transition: 'background 0.15s',
              cursor: 'pointer',
              fontFamily: 'var(--font)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--rose-light)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {!collapsed && 'Log out'}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>

        {/* Top header */}
        <header style={{
          height: 60,
          background: 'var(--card)',
          borderBottom: '1px solid var(--bdr)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky', top: 0, zIndex: 50,
          flexShrink: 0,
          boxShadow: 'var(--sh)',
        }}>
          {/* Left — dynamic page title */}
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt)' }}>
            {pageTitle}
          </span>

          {/* Right — admin info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4338ca, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13, color: '#fff',
              flexShrink: 0,
            }}>
              {initial}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', lineHeight: 1.2 }}>{adminName}</div>
              <div style={{ fontSize: 12, color: 'var(--txt-muted)' }}>Administrator</div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
