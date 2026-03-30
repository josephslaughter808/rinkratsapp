export default function DashboardLoading() {
  return (
    <main className="app-loading-screen">
      <div className="glass-panel app-loading-card">
        <div className="app-loading-mark">
          <div className="app-loading-pulse" />
        </div>
        <div>
          <h1 style={{ fontSize: "1.75rem" }}>Preparing The Rink</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.45rem" }}>
            Pulling your team, stats, and this week&apos;s schedule...
          </p>
        </div>
      </div>
    </main>
  );
}
