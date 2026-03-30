export default function AppLoading() {
  return (
    <main className="app-loading-screen">
      <div className="glass-panel app-loading-card">
        <div className="app-loading-mark">
          <div className="app-loading-pulse" />
        </div>
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>Rink Rats</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.45rem" }}>
            Loading league, film, and game-day tools...
          </p>
        </div>
      </div>
    </main>
  );
}
