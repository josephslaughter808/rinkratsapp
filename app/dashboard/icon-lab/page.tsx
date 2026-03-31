import FeedBulletinIcon from "@/icons/feed-bulletin";
import FeedMegaphoneIcon from "@/icons/feed-megaphone";
import FeedFlagIcon from "@/icons/feed-flag";

const options = [
  {
    name: "Bulletin",
    note: "Feels like a captain noticeboard for updates, surveys, and posts.",
    Icon: FeedBulletinIcon,
  },
  {
    name: "Megaphone",
    note: "Feels more like announcements and team broadcasts.",
    Icon: FeedMegaphoneIcon,
  },
  {
    name: "Flag",
    note: "Most sports-specific, but it leans a little toward team identity.",
    Icon: FeedFlagIcon,
  },
];

export default function IconLabPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #08111f 0%, #0b1728 100%)",
        padding: "1rem 1rem 7.5rem",
        color: "#e2e8f0",
      }}
    >
      <div
        style={{
          maxWidth: 430,
          margin: "0 auto",
          display: "grid",
          gap: "1rem",
        }}
      >
        <div
          style={{
            borderRadius: 24,
            border: "1px solid rgba(96, 165, 250, 0.2)",
            background: "rgba(7,17,31,0.9)",
            padding: "1.15rem 1rem",
            boxShadow: "0 18px 48px rgba(2,6,23,0.28)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#7dd3fc",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Feed Icon Lab
          </p>
          <h1
            style={{
              margin: "0.6rem 0 0.35rem",
              fontSize: "1.7rem",
              lineHeight: 1.05,
              fontWeight: 800,
            }}
          >
            Compare three feed directions
          </h1>
          <p
            style={{
              margin: 0,
              color: "rgba(226,232,240,0.72)",
              fontSize: "0.95rem",
              lineHeight: 1.45,
            }}
          >
            These are mocked in the same simplified glowing outline style as the bottom nav.
          </p>
        </div>

        {options.map(({ name, note, Icon }) => (
          <section
            key={name}
            style={{
              borderRadius: 24,
              border: "1px solid rgba(96, 165, 250, 0.2)",
              background: "rgba(9,20,36,0.94)",
              padding: "1rem",
              boxShadow: "0 16px 40px rgba(2,6,23,0.22)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.9rem",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  display: "grid",
                  placeItems: "center",
                  color: "#7dd3fc",
                  border: "1px solid rgba(96, 165, 250, 0.34)",
                  background:
                    "radial-gradient(circle at top, rgba(59,130,246,0.16), rgba(7,17,31,0.82) 72%)",
                  boxShadow: "0 0 18px rgba(56,189,248,0.16)",
                }}
              >
                <Icon style={{ width: 24, height: 24 }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.05rem",
                    fontWeight: 700,
                  }}
                >
                  {name}
                </h2>
                <p
                  style={{
                    margin: "0.28rem 0 0",
                    color: "rgba(226,232,240,0.7)",
                    fontSize: "0.9rem",
                    lineHeight: 1.45,
                  }}
                >
                  {note}
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop: "0.95rem",
                borderRadius: 999,
                border: "1px solid rgba(96, 165, 250, 0.42)",
                background:
                  "linear-gradient(180deg, rgba(7,17,31,0.96), rgba(5,11,20,0.94))",
                padding: "0.85rem 1rem",
                boxShadow:
                  "0 0 0 1px rgba(191,219,254,0.06), 0 0 22px rgba(59,130,246,0.18), 0 18px 40px rgba(2,6,23,0.32)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.32rem",
                  color: "#f8fafc",
                  width: 56,
                }}
              >
                <Icon
                  style={{
                    width: 22,
                    height: 22,
                    color: "#93c5fd",
                    filter: "drop-shadow(0 0 8px rgba(96,165,250,0.55))",
                  }}
                />
                <span style={{ fontSize: "0.68rem", lineHeight: 1 }}>Feed</span>
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
