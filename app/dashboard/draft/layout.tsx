export default function DraftLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: "100vh", background: "#000", color: "white" }}>
      {children}
    </div>
  );
}
