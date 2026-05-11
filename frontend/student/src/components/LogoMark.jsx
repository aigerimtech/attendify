export function LogoMark({ size = 34 }) {
  const scale = size / 64;
  const br = Math.round(18 * scale);
  return (
    <div style={{
      width: size,
      height: size,
      margin: '0 auto',
      borderRadius: br,
      background: 'linear-gradient(135deg, #3730a3, #4f46e5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 24px rgba(67,56,202,0.30)',
      flexShrink: 0,
    }}>
      <svg
        width={Math.round(size * 0.48)}
        height={Math.round(size * 0.48)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <polyline points="16 11 18 13 22 9" />
      </svg>
    </div>
  );
}

export function LogoMarkDark({ size = 34 }) {
  return <LogoMark size={size} />;
}
