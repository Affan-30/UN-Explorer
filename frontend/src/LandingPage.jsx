// import { useState } from 'react';
// import Resolutions   from './pages/Resolutions';
// import Similarity    from './pages/Similarity';
// import VotingBlocs   from './pages/VotingBlocs';
// import CountryProfile from './pages/CountryProfile';

// const PAGES = [
//   { id: 'resolutions', label: 'Resolutions'    },
//   { id: 'similarity',  label: 'Similarity'     },
//   { id: 'blocs',       label: 'Voting blocs'   },
//   { id: 'country',     label: 'Country profile'},
// ];

// export default function App() {
//   const [page, setPage] = useState('resolutions');

//   return (
//     <div style={{
//       minHeight: '100vh',
//       background: 'var(--color-background-tertiary, #f5f4f0)',
//       fontFamily: 'Poppins',
//     }}>
//       {/* Top navbar */}
//       <div style={{ fontSize: 34, fontWeight: 500, color: 'var(--color-text-primary)', marginLeft: 26 , fontFamily: 'Bungee Spice'}}>
//           UN Vote Explorer
//         </div>
//       <div style={{
//         background: 'var(--color-background-primary)',
//         borderBottom: '0.5px solid var(--color-border-tertiary)',
//         padding: '0 24px',
//         display: 'flex',
//         alignItems: 'center',
//         height: 52,
//         gap: 8,
//       }}>

//         {PAGES.map(p => (
//           <button
//             key={p.id}
//             onClick={() => setPage(p.id)}
//             style={{
//               fontSize: 13,
//               padding: '5px 12px',
//               borderRadius: 'var(--border-radius-md)',
//               border: '0.5px solid ' + (page === p.id ? 'var(--color-border-secondary)' : 'transparent'),
//               background: page === p.id ? 'var(--color-background-secondary)' : 'transparent',
//               color: page === p.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
//               fontWeight: page === p.id ? 500 : 400,
//               cursor: 'pointer',
//             }}
//           >
//             {p.label}
//           </button>
//         ))}

//         <div style={{ marginLeft: 'auto',marginTop: 7, fontSize: 12, color: 'var(--color-text-secondary)' }}>
//           <img src="/UNDL2.png" alt="" srcset="" style={{height:'50px'}} />
//         </div>
//       </div>

//       {/* Page header */}
//       <div style={{ padding: '10px 24px 0' }}>
//         <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 2 }}>
//           {PAGES.find(p => p.id === page)?.label}
//         </h1>
//         <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 11 }}>
//           {page === 'resolutions'  && 'Search UN General Assembly resolutions and see how every country voted.'}
//           {page === 'similarity'   && 'Discover which countries vote alike — and which are diplomatic rivals.'}
//           {page === 'blocs'        && 'See how regional blocs vote together on different issue areas.'}
//           {page === 'country'      && 'Deep dive into any country\'s full UN voting history and trends.'}
//         </p>
//       </div>

//       {/* Page content */}
//       <div style={{ padding: '0 24px 40px' }}>
//         {page === 'resolutions'  && <Resolutions />}
//         {page === 'similarity'   && <Similarity />}
//         {page === 'blocs'        && <VotingBlocs />}
//         {page === 'country'      && <CountryProfile />}
//       </div>
//     </div>
//   );
// }

import { clamp } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ── Tokens ──────────────────────────────────────────────────────────── */
const C = {
  unBlue: "#009EDB",
  unBlueDk: "#006EA6",
  unBlueLt: "#E6F5FC",
  navy: "#0A2540",
  navyMid: "#0E3460",
  white: "#FFFFFF",
  offWhite: "#F7FBFE",
  gold: "#C9A84C",
  slate: "#4A6FA5",
  slateLt: "#8AAFD4",
  textDark: "#0A2540",
  textMid: "#2D5282",
  textMuted: "#5A7FAB",
  yes: "#1A7F74",
  no: "#C0392B",
  abstain: "#B7791F",
  absent: "#718096",
};

const F = {
  heading: "'Playfair Display','Times New Roman', Georgia, serif",
  body: "'Poppins', 'Helvetica Neue', sans-serif",
  mono: "'Courier New', monospace",
};

/* ── Google Fonts loader ─────────────────────────────────────────────── */
function useFonts() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);
}

/* ── useInView hook (intersection observer) ─────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── Animated counter ────────────────────────────────────────────────── */
function Counter({ target, suffix = "", duration = 1800 }) {
  const [val, setVal] = useState(0);
  const [ref, visible] = useInView(0.4);
  useEffect(() => {
    if (!visible) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, target, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ── UN Globe SVG ────────────────────────────────────────────────────── */
function UnGlobe({ size = 52, color = C.white }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="46" stroke={color} strokeWidth="3.5" />
      <ellipse cx="50" cy="50" rx="26" ry="46" stroke={color} strokeWidth="2.5" />
      <ellipse cx="50" cy="50" rx="46" ry="18" stroke={color} strokeWidth="2.5" />
      <line x1="4" y1="50" x2="96" y2="50" stroke={color} strokeWidth="2.5" />
      <line x1="50" y1="4" x2="50" y2="96" stroke={color} strokeWidth="2.5" />
      <ellipse cx="50" cy="50" rx="16" ry="46" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

/* ── Feature card data ───────────────────────────────────────────────── */
const FEATURES = [
  {
    id: "resolutions",
    icon: "📋",
    label: "Resolutions",
    tag: "1946 – 2025",
    title: "Complete Resolution Database",
    desc: "Full archive of UN General Assembly resolutions with word-based search. Every vote broken down by Yes, No, Abstain, and Absent — across all 193 member states.",
    bullets: [
      "Full-text keyword search across all sessions",
      "Total vote counts: Yes / No / Abstain / Absent",
      "Filter by year, topic & resolution number",
      "Instant result highlighting",
    ],
    accent: C.unBlue,
    mockup: "resolutions",
  },
  {
    id: "similarity",
    icon: "🤝",
    label: "Similarity",
    tag: "Diplomatic Intelligence",
    title: "Country Similarity Scores",
    desc: "Quantify how aligned any two countries are. Our algorithm compares their full voting histories and returns a closeness percentage — plus the 10 strongest allies of any selected nation.",
    bullets: [
      "Pairwise similarity score for any 2 countries",
      "Top 10 closest allies with closeness %",
      "Heatmap across all country pairs",
      "Trend over time for bilateral alignment",
    ],
    accent: C.slate,
    mockup: "similarity",
  },
  {
    id: "blocs",
    icon: "🌍",
    label: "Voting Blocs",
    tag: "5 Regional Groups",
    title: "Regional Bloc Analysis",
    desc: "See how Africa, Americas, Asia-Pacific, Europe, and the Middle East vote as blocs. Aggregate voting data by region with topic filters for focused geopolitical insights.",
    bullets: [
      "Africa · Americas · Asia-Pacific · Europe · Middle East",
      "Bloc cohesion score per topic area",
      "Topic filters: human rights, climate, security…",
      "Compare blocs head-to-head on any resolution",
    ],
    accent: C.yes,
    mockup: "blocs",
  },
  {
    id: "country",
    icon: "🗂",
    label: "Country Profile",
    tag: "Deep Dive",
    title: "Country Profile Dashboard",
    desc: "An intelligence brief for every member state. Yes-vote trend over 10 years, GDP growth, import/export charts, basic country info, and a full resolution-by-resolution voting record.",
    bullets: [
      "Yes-vote % bar chart over latest 10 years",
      "GDP growth line chart & trade data",
      "Import / export trend visualisations",
      "Full resolution list with country's specific vote",
    ],
    accent: C.gold,
    mockup: "country",
  },
];

/* ── Mock visuals per feature ────────────────────────────────────────── */
function MockResolutions() {
  const rows = [
    { id: "A/RES/79/123", title: "Nuclear disarmament", yes: 182, no: 4, abs: 7, topic: "arms" },
    { id: "A/RES/79/98", title: "Right to development", yes: 145, no: 3, abs: 45, topic: "rights" },
    { id: "A/RES/79/55", title: "Climate action pledge", yes: 171, no: 5, abs: 17, topic: "climate" },
  ];
  const topicColor = { arms: C.no, rights: "#9d174d", climate: C.yes };
  return (
    <div style={{ fontFamily: F.body, fontSize: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, background: C.white, border: `1px solid #d0e8f7`, borderRadius: 6, padding: "6px 10px", fontSize: 11, color: C.textMuted }}>
          🔍  Search resolutions…
        </div>
        <div style={{ background: C.unBlue, color: C.white, borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600 }}>Search</div>
      </div>
      <table style={{ flex: 1, width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid #d0e8f7` }}>
            {["Resolution", "Topic", "Yes", "No", "Abs"].map(h => (
              <th key={h} style={{ padding: "5px 0", textAlign: "left", fontSize: 10, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: `0.5px solid #e8f3fa` }}>
              <td style={{ padding: "6px 0", fontFamily: F.mono, fontSize: 10, color: C.textMuted, whiteSpace: "nowrap" }}>{r.id}</td>
              <td style={{ padding: "6px 0" }}>
                <span style={{ background: `${topicColor[r.topic]}22`, color: topicColor[r.topic], fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 10 }}>
                  {r.title.split(" ")[0]}
                </span>
              </td>
              {[r.yes, r.no, r.abs].map((v, j) => (
                <td key={j} style={{ padding: "6px 8px", fontFamily: F.mono, fontSize: 11, fontWeight: 600, color: [C.yes, C.no, C.abstain][j] }}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MockSimilarity() {
  const allies = [
    { name: "Germany", pct: 94 },
    { name: "France", pct: 91 },
    { name: "Sweden", pct: 89 },
    { name: "Canada", pct: 87 },
    { name: "Australia", pct: 83 },
  ];
  return (
    <div style={{ fontFamily: F.body, fontSize: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <div style={{ flex: 1, background: `${C.slate}18`, borderRadius: 6, padding: "6px 10px", fontSize: 11, color: C.textMid, fontWeight: 600 }}>🇺🇸  <br />United States</div>
        <div style={{ fontSize: 10, color: C.textMuted }}>vs</div>
        <div style={{ flex: 1, background: `${C.slate}18`, borderRadius: 6, padding: "6px 10px", fontSize: 11, color: C.textMid, fontWeight: 600 }}>🇬🇧  <br />United Kingdom</div>
        <div style={{ background: C.yes, color: C.white, borderRadius: 6, padding: "6px 10px", fontSize: 11, fontWeight: 700 }}>88%</div>
      </div>
      <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Top 5 Closest Allies of USA</div>
      {allies.map((a, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <div style={{ width: 90, fontSize: 11, color: C.textDark, fontWeight: 500 }}>{a.name}</div>
          <div style={{ flex: 1, background: "#e6f5fc", borderRadius: 3, height: 6, overflow: "hidden" }}>
            <div style={{ width: `${a.pct}%`, height: "100%", background: C.unBlue, borderRadius: 3 }} />
          </div>
          <div style={{ width: 32, textAlign: "right", fontSize: 11, fontWeight: 700, color: C.unBlueDk, fontFamily: F.mono }}>{a.pct}%</div>
        </div>
      ))}
    </div>
  );
}

function MockBlocs() {
  const blocs = [
    { name: "Europe", yes: 78, no: 8, abs: 14, color: "#3730a3" },
    { name: "Africa", yes: 85, no: 5, abs: 10, color: C.yes },
    { name: "Asia-Pacific", yes: 70, no: 12, abs: 18, color: C.unBlue },
    { name: "Americas", yes: 65, no: 18, abs: 17, color: C.gold },
    { name: "Middle East", yes: 60, no: 22, abs: 18, color: C.no },
  ];
  return (
    <div style={{ fontFamily: F.body, fontSize: 12 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {["Human Rights", "Climate", "Security", "Trade"].map(t => (
          <div key={t} style={{ background: t === "Human Rights" ? C.unBlue : "#e6f5fc", color: t === "Human Rights" ? C.white : C.unBlueDk, fontSize: 10, padding: "3px 8px", borderRadius: 12, fontWeight: 600, cursor: "pointer" }}>{t}</div>
        ))}
      </div>
      {blocs.map((b, i) => (
        <div key={i} style={{ marginBottom: 7 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.textDark }}>{b.name}</span>
            <span style={{ fontSize: 10, color: C.textMuted, fontFamily: F.mono }}>Yes {b.yes}% · No {b.no}% · Abs {b.abs}%</span>
          </div>
          <div style={{ display: "flex", height: 7, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${b.yes}%`, background: C.yes }} />
            <div style={{ width: `${b.no}%`, background: C.no }} />
            <div style={{ width: `${b.abs}%`, background: C.abstain }} />
            <div style={{ flex: 1, background: "#e2e8f0" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MockCountry() {
  const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const vals = [72, 68, 74, 71, 76, 73, 79, 77, 82, 80];
  const maxV = Math.max(...vals);
  return (
    <div style={{ fontFamily: F.body, fontSize: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${C.unBlue}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "rgb(26, 127, 116)" }}>🇮🇳</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textDark }}>India</div>
          <div style={{ fontSize: 10, color: C.textMuted }}>GDP Growth: 6.8% · Pop: 1.4B</div>
        </div>
        <div style={{ marginLeft: "auto", background: `${C.yes}18`, color: C.yes, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>Yes 79%</div>
      </div>
      <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Yes-vote % — 10 year trend</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 50, marginBottom: 2 }}>
        {vals.map((v, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ width: "100%", background: i === vals.length - 1 ? C.unBlue : `${C.unBlue}66`, borderRadius: "2px 2px 0 0", height: `${(v / maxV) * 44}px` }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {years.filter((_, i) => i % 3 === 0).map(y => (
          <span key={y} style={{ fontSize: 9, color: C.textMuted, fontFamily: F.mono }}>{y}</span>
        ))}
      </div>
    </div>
  );
}

const MOCKUPS = { resolutions: MockResolutions, similarity: MockSimilarity, blocs: MockBlocs, country: MockCountry };

/* ── Feature Card ────────────────────────────────────────────────────── */
function FeatureCard({ feature, index, onNavigate }) {
  const [ref, visible] = useInView(0.12);
  const [hovered, setHovered] = useState(false);
  const Mock = MOCKUPS[feature.mockup];
  const delay = index * 120;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.white,
        border: `1px solid ${hovered ? feature.accent : "#d0e8f7"}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: hovered ? `0 12px 40px ${feature.accent}22` : "0 2px 16px rgba(0,100,160,0.08)",
        transition: "all 380ms cubic-bezier(0.4,0,0.2,1)",
        transform: visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.97)",
        opacity: visible ? 1 : 0,
        transitionDelay: `${delay}ms`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Mock preview pane */}
      <div style={{
        background: `linear-gradient(135deg, ${C.offWhite} 0%, ${C.unBlueLt} 100%)`,
        padding: 18,
        borderBottom: `1px solid #d0e8f7`,
        minHeight: 170,
      }}>
        <Mock />
      </div>

      {/* Card body */}
      <div style={{ padding: "20px 22px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ background: `${feature.accent}18`, color: feature.accent, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F.body }}>
            {feature.tag}
          </span>
        </div>
        <h3 style={{ fontFamily: F.heading, fontSize: 18, fontWeight: 700, color: C.textDark, marginBottom: 8, lineHeight: 1.3 }}>
          {feature.title}
        </h3>
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.textMid, lineHeight: 1.6, marginBottom: 14, flex: 1 }}>
          {feature.desc}
        </p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", marginBottom: 18 }}>
          {feature.bullets.map((b, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 5 }}>
              <span style={{ color: feature.accent, fontSize: 12, marginTop: 2, flexShrink: 0 }}>✓</span>
              <span style={{ fontFamily: F.body, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{b}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={() => onNavigate(feature.id)}
          style={{
            fontFamily: F.body,
            fontSize: 13,
            fontWeight: 600,
            color: feature.accent,
            background: `${feature.accent}0D`,
            border: `1px solid ${feature.accent}40`,
            borderRadius: 8,
            padding: "8px 14px",
            cursor: "pointer",
            textAlign: "center",
            transition: "all 180ms ease",
            letterSpacing: "0.01em",
          }}
        >
          Explore {feature.label} →
        </button>
      </div>
    </div>
  );
}

/* ── Stats strip ─────────────────────────────────────────────────────── */
const STATS = [
  { label: "Resolutions", value: 5694, suffix: "+" },
  { label: "Member States", value: 191, suffix: "" },
  { label: "Votes Recorded", value: 450000, suffix: "+" },
  { label: "Years Covered", value: 75, suffix: "+" },
];


/* ── Main Landing Page ───────────────────────────────────────────────── */
export default function LandingPage({ onNavigate }) {
  useFonts();
  const [ref, visible] = useInView(0.12);
  const [heroVisible, setHeroVisible] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [backendReady, setBackendReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  window.addEventListener("resize", handleResize);

  return () => window.removeEventListener("resize", handleResize);
}, []);

  useEffect(() => {
    const wakeServer = async () => {
      try {
        // Replace with your backend health endpoint
        const res = await fetch(
          "https://un-explorer-1.onrender.com/api/resolutions"
        );

        if (res.ok || res != null) {
          setBackendReady(true);
        }
      } catch (err) {
        console.error("Backend sleeping...", err);
      } finally {
        setLoading(false);
      }
    };

    wakeServer();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    const onScroll = () => setHeaderScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => { clearTimeout(t); window.removeEventListener("scroll", onScroll); };
  }, []);

  const goToDashboard = (page) => {
    if (typeof onNavigate === "function") onNavigate(page || "resolutions");
  };

  return (
    <div style={{ background: C.offWhite, fontFamily: F.body, overflowX: "hidden" }}>

      {/* ── Navbar ── */}
      {/* const isMobile = window.innerWidth <= 768; */}

<header
  style={{
    position: "sticky",
    top: 0,
    zIndex: 200,
    background: headerScrolled ? "rgba(10,37,64,0.97)" : C.navy,
    borderBottom: `2px solid ${C.gold}`,
    boxShadow: headerScrolled
      ? "0 4px 24px rgba(0,0,0,0.35)"
      : "0 2px 12px rgba(0,100,160,0.25)",
    backdropFilter: "blur(12px)",
    transition: "all 260ms ease",
    padding: isMobile ? "10px 16px" : "0 32px",
    minHeight: isMobile ? "auto" : 60,

    display: "flex",
    flexDirection: isMobile ? "row" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: isMobile ? 12 : 0,
  }}
>
  {/* Left Section */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: isMobile ? "100%" : "auto",
      justifyContent: isMobile ? "center" : "flex-start",
    }}
  >
    <img
      src="/un.png"
      alt=""
      width={isMobile ? 38 : 50}
      style={{ flexShrink: 0 }}
    />

    <div>
      <div
        style={{
          fontFamily: F.heading,
          fontSize: "clamp(14px, 4vw, 20px)",
          fontWeight: 700,
          color: C.white,
          letterSpacing: "0.01em",
          lineHeight: 1.1,
          textAlign: isMobile ? "center" : "left",
        }}
      >
        UN Vote Explorer
      </div>

      <div
        style={{
          fontFamily: F.body,
          fontSize: "clamp(7px, 2vw, 10px)",
          color: C.gold,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          textAlign: isMobile ? "center" : "left",
          marginTop: 4,
        }}
      >
        General Assembly · Voting Records
      </div>
    </div>
  </div>

  {/* Right Section */}
  <nav
    style={{
      display: "flex",
      flexDirection: isMobile ? "row" : "",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: 8,
      width: isMobile ? "100%" : "auto",
    }}
  >
    <button
      onClick={() => navigate("/dashboard")}
      disabled={!backendReady}
      style={{
        fontFamily: F.body,
        fontSize: isMobile ? 11 : 12,
        fontWeight: 600,
        color: C.navy,
        background: C.white,
        border: "none",
        borderRadius: 8,
        padding: isMobile ? "6px 12px" : "7px 16px",
        marginLeft: isMobile ? 0 : 8,
        cursor: backendReady ? "pointer" : "not-allowed",
        opacity: backendReady ? 1 : 0.5,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        transition: "all 160ms ease",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = C.unBlueLt)
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = C.white)
      }
    >
      {loading
        ? "Waking server..."
        : backendReady
        ? "Dashboard →"
        : "Server Unavailable"}
    </button>
  </nav>
</header>

      {/* ── Hero ── */}
      {/*  abc*/}
      <section
        style={{
          background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyMid} 55%, #0a4a7c 100%)`,
          // background: '#0a4a7c',
          padding: "50px 32px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.1,
            backgroundImage: `linear-gradient(${C.unBlue} 1px, transparent 1px), linear-gradient(90deg, ${C.unBlue} 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.unBlue}22 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {/* MAIN FLEX CONTAINER */}
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 40,
            flexWrap: "wrap",
            position: "relative",
          }}
        >
          {/* ───────── LEFT SIDE ───────── */}
          <div style={{ flex: 1, minWidth: "300px", textAlign: "left" }}>
            <h1
              style={{
                fontFamily: "Playfair Display",
                fontSize: "clamp(3rem, 1rem + 5vw, 5rem)",
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
                margin: 0,
                color: "#ffffff",
                transform: heroVisible ? "translateY(0)" : "translateY(30px)",
                opacity: heroVisible ? 1 : 0,
                transition: "all 600ms ease 180ms",
              }}
            >
              Decode Every <br />
              <span
                style={{
                  color: "#2d8fd5",
                  fontStyle: "italic",
                }}
              >
                resolution
              </span>
              <br />
              Understand Every Alliance.
            </h1>

            <p
              style={{
                fontFamily: F.body,
                fontSize: 16,
                color: "rgba(255,255,255,0.72)",
                lineHeight: 1.7,
                maxWidth: 520,
                marginTop: 20,
                transform: heroVisible ? "translateY(0)" : "translateY(20px)",
                opacity: heroVisible ? 1 : 0,
                transition: "all 600ms ease 280ms",
              }}
            >
              The most comprehensive tool for analysing UN General Assembly voting
              patterns — resolutions, country alliances, regional blocs, and deep
              country profiles all in one place.
            </p>
          </div>

          {/* ───────── RIGHT SIDE ───────── */}
          <div
            style={{
              flex: 1,
              minWidth: "260px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
            }}
          >
            {/* UN emblem */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 170,
                height: 170,
                borderRadius: "50%",
                background: `rgba(0,158,219,0.15)`,
                border: `2px solid ${C.gold}`,
                transform: heroVisible
                  ? "scale(1) rotate(0deg)"
                  : "scale(0.5) rotate(-20deg)",
                opacity: heroVisible ? 1 : 0,
                transition: "all 700ms cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              <img src="/un.png" alt="UN logo" style={{ width: 140 }} />
            </div>

            {/* Golden tag */}
            <div
              style={{
                background: `${C.gold}22`,
                border: `1px solid ${C.gold}55`,
                borderRadius: 20,
                padding: "5px 16px",
                fontSize: 15,
                fontWeight: 600,
                color: C.gold,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                fontFamily: F.body,
                transform: heroVisible ? "translateY(0)" : "translateY(20px)",
                opacity: heroVisible ? 1 : 0,
                transition: "all 550ms ease 100ms",
                textAlign: "center",
              }}
            >
              United Nations General Assembly ·  1946 – 2025
            </div>

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                justifyContent: "center",
                transform: heroVisible ? "translateY(0)" : "translateY(20px)",
                opacity: heroVisible ? 1 : 0,
                transition: "all 600ms ease 280ms",
              }}
            >
              <button
                onClick={() => navigate("/dashboard")}
                style={{
                  fontFamily: F.body,
                  fontSize: 15,
                  fontWeight: 700,
                  background: C.unBlue,
                  color: C.white,
                  border: "none",
                  borderRadius: 10,
                  padding: "13px 26px",
                  cursor: "pointer",
                  boxShadow: `0 6px 24px ${C.unBlue}55`,
                  cursor: backendReady ? "pointer" : "not-allowed",
                  opacity: backendReady ? 1 : 0.5,
                }}
              >
                Open Dashboard →
              </button>

              <button
                onClick={() =>
                  document
                    .getElementById("features-section")
                    .scrollIntoView({ behavior: "smooth" })
                }
                style={{
                  fontFamily: F.body,
                  fontSize: 14,
                  fontWeight: 500,
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.85)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: 10,
                  padding: "13px 22px",
                  cursor: "pointer",
                }}
              >
                Explore Features
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* abc */}

      {/* ── Stats strip ── */}
      <section style={{
        background: C.white,
        borderBottom: `1px solid #d0e8f7`,
        padding: "32px 32px",
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 0,
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              textAlign: "center",
              padding: "0 16px",
              borderRight: i < STATS.length - 1 ? `1px solid #d0e8f7` : "none",
            }}>
              <div style={{ fontFamily: F.heading, fontSize: 36, fontWeight: 700, color: C.navy, lineHeight: 1 }}>
                <Counter target={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontFamily: F.body, fontSize: 12, color: C.textMuted, marginTop: 5, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Vote legend strip ── */}
      <section style={{ background: C.unBlueLt, borderBottom: `1px solid #b8dff5`, padding: "14px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 24, alignItems: "center", flexWrap: "nowrap", justifyContent: "center" }}>
          <span style={{ fontFamily: F.body, fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Vote types:</span>
          {[
            { label: "Yes", color: C.yes },
            { label: "No", color: C.no },
            { label: "Abstain", color: C.abstain },
            { label: "Absent", color: C.absent },
          ].map(v => (
            <div key={v.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: v.color }} />
              <span style={{ fontFamily: F.body, fontSize: 12, color: C.textMid, fontWeight: 500 }}>{v.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features-section" style={{ padding:isMobile ?"20px 22px" : "72px 32px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.unBlue, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>
            Four Powerful Tools
          </div>
          <h2 style={{ fontFamily: F.heading, fontSize:isMobile ? 25 : "clamp(26px, 3.5vw, 40px)", fontWeight: 700, color: C.textDark, marginBottom: 14, lineHeight: 1.2 }}>
            Everything you need to understand<br />UN diplomacy
          </h2>
          <p style={{ fontFamily: F.body, fontSize: 15, color: C.textMid, maxWidth: 540, margin: "0 auto", lineHeight: 1.7 }}>
            From raw resolution archives to bilateral similarity scores — built for researchers, journalists, and diplomacy enthusiasts alike.
          </p>
        </div>

        <div style={{
          display: "grid",
          // gridColumn: "span 4",
          gridTemplateColumns:isMobile ? "repeat(1, minmax(300px, 1fr))" : "repeat(4, minmax(260px, 1fr))",
          gap: 24,
        }}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.id} feature={f} index={i} />
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ background: C.navy, padding: "72px 32px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>How it works</div>
          <h2 style={{ fontFamily: F.heading, fontSize: 34, fontWeight: 700, color: C.white, marginBottom: 14 }}>Built on official UN records</h2>
          <p style={{ fontFamily: F.body, fontSize: 14, color: "rgba(255,255,255,0.65)", maxWidth: 520, margin: "0 auto 52px", lineHeight: 1.7 }}>
            Data sourced directly from the UN Digital Library. Every vote cast in the General Assembly from 2006 to 2025, structured and ready to explore.
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}>
            {[
              { step: "01", title: "Search & Filter", desc: "Find any resolution by keyword, year, topic, or resolution number in milliseconds." },
              { step: "02", title: "Analyse Alignment", desc: "Run similarity scores between countries or entire regional blocs on any issue area." },
              { step: "03", title: "Build Profiles", desc: "Explore a country's full diplomatic footprint — votes, trends, economic indicators." },
            ].map((s, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 12, padding:isMobile? "10px" : "24px 20px", textAlign: "left",
                transition: "transform 300ms ease",
              }} onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-10px)";
                e.currentTarget.style.boxShadow = "1px 2px 10px rgb(225, 225, 225)";
              }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "";
                }}>
                <div style={{ fontFamily: F.mono, fontSize: 26, fontWeight: 700, color: C.unBlue, marginBottom: 10, opacity: 0.8 }}>{s.step}</div>
                <div style={{ fontFamily: F.heading, fontSize:isMobile? 15 : 20, fontWeight: 700, color: C.white, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontFamily: F.body, fontSize:isMobile? 10 : 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "80px 32px", textAlign: "center", background: C.unBlueLt, borderTop: `2px solid #b8dff5` }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <img src="/un.png" alt="" width={120} />
            {/* <UnGlobe size={56} color={C.unBlue} /> */}
          </div>
          <h2 style={{ fontFamily: F.heading, fontSize: 34, fontWeight: 700, color: C.textDark, marginBottom: 14, lineHeight: 1.2 }}>
            Ready to explore UN diplomacy?
          </h2>
          <p style={{ fontFamily: F.body, fontSize: 15, color: C.textMid, marginBottom: 32, lineHeight: 1.7 }}>
            75+ years of voting data. 191 countries. One dashboard.
          </p>
          <button
            onClick={() => {
              if (backendReady) {
                navigate("/dashboard");
              }
            }}
            style={{
              fontFamily: F.body, fontSize: 16, fontWeight: 700,
              background: C.navy, color: C.white,
              border: "none", borderRadius: 12, padding: "15px 40px",
              cursor: "pointer", letterSpacing: "0.02em",
              boxShadow: `0 8px 28px ${C.navy}44`,
              transition: "all 220ms ease",
              cursor: backendReady ? "pointer" : "not-allowed",
              opacity: backendReady ? 1 : 0.5,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.navyMid; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 14px 36px ${C.navy}55`; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 8px 28px ${C.navy}44`; }}
          >
            Open the Dashboard →
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: C.navy, borderTop: `2px solid ${C.gold}`, padding: "40px 32px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns:isMobile? "repeat(3, 1fr)": "2fr 1fr 1fr 1fr", gap: 32, marginBottom: 32 }}>
            {/* Brand */}
            <div style={{
              ...(isMobile &&
              {display: "flex",flexDirection: "row", gap: "15px", gridColumn: "1 / -1"}),
            }}>
              <div style={{ display: "flex", alignItems: "center",flexDirection: "row", gap: 10, marginBottom: 12 }}>
                <img src="/un.png" alt="" width={55} />
                {/* <UnGlobe size={28} color={C.white} /> */}
                <div style={{ fontFamily: F.heading, fontSize: isMobile? 13 : 19, fontWeight: 700, color: C.white }}>UN Vote Explorer</div>
              </div>
              <p style={{ fontFamily: F.body, fontSize:isMobile? 10 : 12, color: "rgba(255,255,255,0.50)", lineHeight: 1.7, maxWidth: 240 }}>
                An independent analytical tool built on data from the United Nations Digital Library. Not affiliated with the United Nations.
              </p>
            </div>
            {/* Tools */}
            <div>
              <div style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Tools</div>
              {FEATURES.map(f => (
                <div key={f.id} onClick={() => goToDashboard(f.id)} style={{ fontFamily: F.body, fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 7, cursor: "pointer", transition: "color 150ms" }}
                  onMouseEnter={e => e.target.style.color = C.white}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.55)"}
                >
                  {f.label}
                </div>
              ))}
            </div>
            {/* Regions */}
            <div>
              <div style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Regions</div>
              {["Africa", "Americas", "Asia-Pacific", "Europe", "Middle East"].map(r => (
                <div key={r} style={{ fontFamily: F.body, fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 7 }}>{r}</div>
              ))}
            </div>
            {/* Data */}
            <div>
              <div style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Data</div>
              {["UN Digital Library", "World Bank API", "Resolution Archive", "Voting Records"].map(d => (
                <div key={d} style={{ fontFamily: F.body, fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 7 }}>{d}</div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontFamily: F.body, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              © 2025 UN Vote Explorer ·  {isMobile && <br />}  All rights reserved ·  {isMobile && <br />} Data can be incorrect due to computational error.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}