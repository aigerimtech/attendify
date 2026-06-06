export function LogoMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="13" fill="#3730a3" />
      <circle cx="24" cy="17" r="7" fill="white" opacity="0.9" />
      <path d="M10 38c0-7.732 6.268-14 14-14s14 6.268 14 14"
        stroke="white" strokeWidth="2.5" strokeLinecap="round"
        fill="none" opacity="0.45" />
      <circle cx="35" cy="35" r="8" fill="#f43f5e" />
      <path d="M31.5 35.2l2.2 2.3 4.3-4.5"
        stroke="white" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LogoMarkDark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="13" fill="#4f46e5" />
      <circle cx="24" cy="17" r="7" fill="white" opacity="0.9" />
      <path d="M10 38c0-7.732 6.268-14 14-14s14 6.268 14 14"
        stroke="white" strokeWidth="2.5" strokeLinecap="round"
        fill="none" opacity="0.45" />
      <circle cx="35" cy="35" r="8" fill="#fb7185" />
      <path d="M31.5 35.2l2.2 2.3 4.3-4.5"
        stroke="white" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
