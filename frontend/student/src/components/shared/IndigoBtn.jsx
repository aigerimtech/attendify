export function IndigoBtn({ children, onClick, style = {} }) {
  return (
    <button type="submit" onClick={onClick} style={{
      width: "100%",
      background: "linear-gradient(135deg,#3730a3,#4f46e5)",
      color: "#fff", border: "none", borderRadius: 14,
      padding: "13px 16px", fontSize: 15, fontWeight: 700,
      cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
      display: "flex", alignItems: "center",
      justifyContent: "center", gap: 8,
      boxShadow: "0 6px 18px rgba(67,56,202,.3)", ...style
    }}>{children}</button>
  );
}

export function GreenBtn({ children, onClick, style = {} }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: "100%",
      background: "linear-gradient(135deg,#047857,#059669)",
      color: "#fff", border: "none", borderRadius: 14,
      padding: "13px 16px", fontSize: 15, fontWeight: 700,
      cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
      display: "flex", alignItems: "center",
      justifyContent: "center", gap: 8,
      boxShadow: "0 6px 18px rgba(5,150,105,.35)", ...style
    }}>{children}</button>
  );
}
