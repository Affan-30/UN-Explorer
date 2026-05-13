import { useState, useEffect } from 'react';
import Resolutions   from './Resolutions';
import Similarity    from './Similarity';
import VotingBlocs   from './VotingBlocs';
import CountryProfile from './CountryProfile';

const PAGES = [
  { id: 'resolutions', label: 'Resolutions'    },
  { id: 'similarity',  label: 'Similarity'     },
  { id: 'blocs',       label: 'Voting blocs'   },
  { id: 'country',     label: 'Country profile'},
];

export default function dashboard() {
  const [page, setPage] = useState('resolutions');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
  
    window.addEventListener("resize", handleResize);
  
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
  style={{
    minHeight: "100vh",
    background: "var(--color-background-tertiary, #f5f4f0)",
    fontFamily: "Poppins",
  }}
>
  {/* Logo */}
  <div
    style={{
      fontSize: isMobile ? 24 : 34,
      fontWeight: 500,
      color: "var(--color-text-primary)",
      marginLeft: isMobile ? 0 : 26,
      paddingTop: isMobile ? 12 : 0,
      textAlign: isMobile ? "center" : "left",
      fontFamily: "Bungee Spice",
    }}
  >
    UN Vote Explorer
  </div>

  {/* Navbar */}
  <div
    style={{
      background: "var(--color-background-primary)",
      borderBottom: "0.5px solid var(--color-border-tertiary)",
      padding: isMobile ? "10px 12px" : "0 24px",

      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: "center",

      minHeight: isMobile ? "auto" : 52,
      gap: isMobile ? 12 : 8,
    }}
  >
    {/* Nav Buttons */}
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 8,
        width: isMobile ? "100%" : "auto",
      }}
    >
      {PAGES.map((p) => (
        <button
          key={p.id}
          onClick={() => setPage(p.id)}
          style={{
            fontSize: isMobile ? 11 : 13,
            padding: isMobile ? "5px 10px" : "5px 12px",
            borderRadius: "var(--border-radius-md)",
            border:
              "0.5px solid " +
              (page === p.id
                ? "var(--color-border-secondary)"
                : "transparent"),

            background:
              page === p.id
                ? "var(--color-background-secondary)"
                : "transparent",

            color:
              page === p.id
                ? "var(--color-text-primary)"
                : "var(--color-text-secondary)",

            fontWeight: page === p.id ? 500 : 400,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {p.label}
        </button>
      ))}
    </div>

    {/* Logo Image */}
    <div
      style={{
        marginLeft: isMobile ? 0 : "auto",
        marginTop: isMobile ? 0 : 7,
        fontSize: 12,
        color: "var(--color-text-secondary)",
      }}
    >
      <img
        src="/UNDL2.png"
        alt=""
        style={{
          height: isMobile ? "38px" : "50px",
        }}
      />
    </div>
  </div>

  {/* Page Header */}
  <div
    style={{
      padding: isMobile ? "10px 14px 0" : "10px 24px 0",
      textAlign: isMobile ? "center" : "left",
    }}
  >
    <h1
      style={{
        fontSize: isMobile ? 17 : 20,
        fontWeight: 500,
        color: "var(--color-text-primary)",
        marginBottom: 2,
      }}
    >
      {PAGES.find((p) => p.id === page)?.label}
    </h1>

    <p
      style={{
        fontSize: isMobile ? 12 : 13,
        color: "var(--color-text-secondary)",
        marginBottom: 11,
        lineHeight: 1.5,
      }}
    >
      {page === "resolutions" &&
        "Search UN General Assembly resolutions and see how every country voted."}

      {page === "similarity" &&
        "Discover which countries vote alike — and which are diplomatic rivals."}

      {page === "blocs" &&
        "See how regional blocs vote together on different issue areas."}

      {page === "country" &&
        "Deep dive into any country's full UN voting history and trends."}
    </p>
  </div>

  {/* Page Content */}
  <div
    style={{
      padding: isMobile ? "0 12px 30px" : "0 24px 40px",
    }}
  >
    {page === "resolutions" && <Resolutions />}
    {page === "similarity" && <Similarity />}
    {page === "blocs" && <VotingBlocs />}
    {page === "country" && <CountryProfile />}
  </div>
</div>
  );
}