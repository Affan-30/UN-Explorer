import { useState, useEffect } from 'react';
import { getCountries, getCountry, getCountryVotes } from '../api';
import TrendChart from './TrendChart';
import TradeChart from './TradeChart';
import GdpChart from './GdpChart';
import './App.css';

const VOTE_STYLE = {
  yes: { color: '#1f4400', bg: '#EAF3DE' },
  no: { color: '#A32D2D', bg: '#FCEBEB' },
  abstain: { color: '#854F0B', bg: '#FAEEDA' },
  absent: { color: '#5F5E5A', bg: '#F1EFE8' },
};

export default function CountryProfile() {
  const [countries, setCountries] = useState([]);
  const [selected, setSelected] = useState('');
  const [profile, setProfile] = useState(null);
  const [wb, setWb] = useState(null);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [page, setPage] = useState(0);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const ROWS_PER_PAGE = 10;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  window.addEventListener("resize", handleResize);

  return () => window.removeEventListener("resize", handleResize);
}, []);
useEffect(() => {
  getCountries()
    .then(data => {
      console.log("Countries API response:", data);
      setCountries(data);
    })
    .catch(err => {
      console.error("Countries API ERROR:", err);
    });
}, []);

  const loadCountry = async (id) => {
    setLoading(true);
    try {
      const res = await getCountry(id);
      const voteRes = await getCountryVotes(id, {
        page,
        size: ROWS_PER_PAGE,
        topic
      });
console.log("voteRes =", voteRes);
      setProfile(res.profile);
      setWb(res.worldBank);
      setVotes(voteRes.content);
      setTotalPages(voteRes.totalPages);
    } catch {
      console.error("ERROR:", err); // 🔥 shows real issue
      alert('Error loading data');
      setError("Error loading Contry Profile !")
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selected) loadCountry(selected);
  }, [selected, page, topic]); // 🔥 important

  //   useEffect(() => {
  //   setPage(0); // reset to first page when topic changes
  // }, [topic]);

  const statsMap = profile?.stats || {};
  const totalVotes = Object.values(statsMap).reduce((a, b) => a + b, 0);

  const normalizeVoteType = (type) => {
    if (!type) return 'absent';
    const t = type.toLowerCase();
    return VOTE_STYLE[t] ? t : 'absent';
  };

  // reusable styles
  const thStyle = {
    textAlign: 'left',
    padding: 10,
    fontSize: 12
  };

  const tdStyle = {
    padding: 10,
    fontSize: 12,
    color: '#333'
  };

  return (
   <div
  style={{
    maxWidth: 900,
    margin: "0 auto",
    fontFamily: "Poppins",
    position: "relative",

    padding: isMobile ? "0 10px" : 0,
  }}
>
  {/* Filters */}
  <div
    style={{
      display: "flex",
      gap: 10,
      marginBottom: 20,

      flexDirection: isMobile ? "column" : "row",
    }}
  >
    <select
      style={{
        flex: 1,
        padding: isMobile ? 10 : 8,
        width: isMobile ? "100%" : "auto",
      }}
      value={selected}
      onChange={(e) => {
        setSelected(e.target.value);
        setError(null);
      }}
    >
      <option value="">Select a country...</option>

      {countries.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>

    <select
      style={{
        padding: isMobile ? 10 : 8,
        width: isMobile ? "100%" : "auto",
      }}
      value={topic}
      onChange={(e) => setTopic(e.target.value)}
    >
      <option value="">All topics</option>
      <option value="Nuclear">Nuclear Weapons</option>
      <option value="Human Rights">Human rights</option>
      <option value="Climate">Climate & Environment</option>
      <option value="Palestine">Palestine</option>
      <option value="Trade">Trade & Development</option>
      <option value="Peacekeeping">Peace keeping</option>
      <option value="Decolonization">Decolonization</option>
    </select>
  </div>

  {/* Error */}
  {error && (
    <div
      style={{
        color: "#A32D2D",
        background: "#FCEBEB",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        zIndex: 10,
        fontSize: isMobile ? 13 : 14,
      }}
    >
      ⚠️ {error}
    </div>
  )}

  {/* Loading */}
  {loading && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(255,255,255,0.9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div className="spinner"></div>

      <p
        style={{
          color: "#333",
          marginTop: 10,
          fontSize: isMobile ? 14 : 16,
        }}
      >
        Loading...
      </p>
    </div>
  )}

  {/* Main Content */}
  {profile && !loading && !error && (
    <>
      {/* Header */}
      <div
        style={{
          background: "#ddd",
          border: "1px solid #ddd",
          borderRadius: 10,

          padding: isMobile ? 12 : 16,

          marginBottom: 16,

          boxShadow:
            "0 2px 4px rgba(0,0,0,0.1)",

          color: "#000000",
        }}
      >
        <h3
          style={{
            marginBottom: 5,
            fontSize: isMobile ? 18 : 22,
          }}
        >
          {profile.country.name}
        </h3>

        <div
          style={{
            color: "#5e5e5f",
            fontSize: isMobile ? 12 : 13,
            lineHeight: 1.5,
          }}
        >
          {profile.country.region} · UN since{" "}
          {profile.country.unMemberSince}
        </div>

        {/* Stats */}
        {totalVotes > 0 && (
          <div
            style={{
              display: "grid",

              gridTemplateColumns: isMobile
                ? "1fr 1fr"
                : "repeat(4, 1fr)",

              gap: 10,

              marginTop: 15,
            }}
          >
            {Object.entries(VOTE_STYLE).map(
              ([type, style]) => {
                const count =
                  statsMap[type] || 0;

                const pct = Math.round(
                  (count / totalVotes) * 100
                );

                return (
                  <div
                    key={type}
                    style={{
                      background: "#70b6e7",

                      borderRadius: 8,

                      padding: isMobile
                        ? 8
                        : 10,

                      textAlign: "center",

                      color: "#454545",
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          isMobile ? 11 : 12,
                      }}
                    >
                      {type}
                    </div>

                    <div
                      style={{
                        color: "#000000",

                        fontSize:
                          isMobile ? 16 : 18,

                        fontWeight: 600,
                      }}
                    >
                      {pct}%
                    </div>

                    <div
                      style={{
                        fontSize:
                          isMobile ? 10 : 11,
                      }}
                    >
                      {count}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Trend Graph */}
      <div
        style={{
          marginBottom: 10,
          fontWeight: 600,
          fontSize: isMobile ? 14 : 16,
        }}
      >
        Yes vote % by year
      </div>

      {profile.trend?.length > 0 && (
        <div
          style={{
            overflowX: "auto",
          }}
        >
          <TrendChart trend={profile.trend} />
        </div>
      )}

      {/* World Bank */}
      {wb && (
        <div
          style={{
            marginTop: 20,

            padding: isMobile ? 12 : 16,

            background: "#fff",

            border: "1px solid #ddd",

            borderRadius: 10,

            position: "relative",

            color: "black",

            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontSize: isMobile ? 18 : 22,
            }}
          >
            🌍 Economic Overview
          </h3>

          {/* Metadata */}
          <div
            style={{
              display: "grid",

              gridTemplateColumns: isMobile
                ? "1fr 1fr"
                : "repeat(4,1fr)",

              gap: 10,

              marginBottom: 20,

              fontSize: isMobile ? 12 : 14,
            }}
          >
            <div>
              <b>Capital:</b>{" "}
              {wb.metadata.capitalCity}
            </div>

            <div>
              <b>Income:</b>{" "}
              {wb.metadata.incomeLevel}
            </div>

            <div>
              <b>Region:</b>{" "}
              {wb.metadata.region}
            </div>

            <div>
              <b>ISO3:</b>{" "}
              {wb.metadata.iso3Code}
            </div>
          </div>

          {/* GDP */}
          <h4
            style={{
              fontSize: isMobile ? 15 : 18,
            }}
          >
            GDP Growth (%)
          </h4>

          <div style={{ overflowX: "auto" }}>
            <GdpChart dataMap={wb.gdpGrowth} />
          </div>

          {/* Trade */}
          <h4
            style={{
              marginTop: 20,
              fontSize: isMobile ? 15 : 18,
            }}
          >
            Trade (Imports vs Exports)
          </h4>

          <div style={{ overflowX: "auto" }}>
            <TradeChart
              exportsData={wb.exports}
              importsData={wb.imports}
            />
          </div>
        </div>
      )}

      {/* Table */}
      {votes.length > 0 ? (
        <>
          <div
            style={{
              background: "#fff",

              border: "1px solid #ddd",

              borderRadius: 10,

              overflowX: "auto",

              boxShadow:
                "0 2px 4px rgba(0,0,0,0.1)",

              color: "#000000",
            }}
          >
            <div
              style={{
                padding: 12,
                fontWeight: 600,

                fontSize: isMobile ? 13 : 15,
              }}
            >
              Voting history ({totalPages} pages)
            </div>

            <table
              style={{
                width: "100%",

                minWidth: isMobile ? 650 : 0,

                borderCollapse: "collapse",

                color: "#000000",

                fontSize: isMobile ? 11 : 14,
              }}
            >
              <thead
                style={{
                  background: "#f8f9fa",
                }}
              >
                <tr>
                  <th style={thStyle}>Year</th>
                  <th style={thStyle}>
                    Resolution
                  </th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Vote</th>
                </tr>
              </thead>

              <tbody>
                {votes.map((v, i) => {
                  const voteKey =
                    normalizeVoteType(
                      v.voteType
                    );

                  const vs =
                    VOTE_STYLE[voteKey];

                  return (
                    <tr
                      key={`${v.resolutionId}-${i}`}
                      style={{
                        borderTop:
                          "1px solid #eee",
                      }}
                    >
                      <td style={tdStyle}>
                        {v.sessionYear}
                      </td>

                      <td style={tdStyle}>
                        {v.resolutionNumber}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          minWidth:
                            isMobile
                              ? 220
                              : "auto",
                        }}
                      >
                        {v.title}
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            background:
                              vs.bg,

                            color: vs.color,

                            padding:
                              "4px 8px",

                            borderRadius: 12,

                            fontWeight: 500,

                            fontSize:
                              isMobile
                                ? 11
                                : 12,

                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {voteKey}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            style={{
              display: "flex",

              justifyContent:
                "space-between",

              alignItems: "center",

              flexDirection: isMobile
                ? "column"
                : "row",

              gap: 10,

              marginTop: 12,
            }}
          >
            <button
              onClick={() =>
                setPage((prev) =>
                  Math.max(prev - 1, 0)
                )
              }
              disabled={page === 0}
              style={{
                padding: "8px 12px",

                borderRadius: 6,

                border:
                  "1px solid #ccc",

                background:
                  page === 0
                    ? "#eee"
                    : "#fff",

                cursor:
                  page === 0
                    ? "not-allowed"
                    : "pointer",

                color: "#000",

                width: isMobile
                  ? "100%"
                  : "auto",
              }}
            >
              ⬅ Previous
            </button>

            <div
              style={{
                fontSize:
                  isMobile ? 12 : 13,

                color: "#444",
              }}
            >
              Page <b>{page + 1}</b> of{" "}
              <b>{totalPages}</b>
            </div>

            <button
              onClick={() =>
                setPage((prev) => prev + 1)
              }
              disabled={
                page >= totalPages - 1
              }
              style={{
                padding: "8px 12px",

                borderRadius: 6,

                border:
                  "1px solid #ccc",

                background:
                  page >= totalPages - 1
                    ? "#eee"
                    : "#fff",

                cursor:
                  page >= totalPages - 1
                    ? "not-allowed"
                    : "pointer",

                color: "#000",

                width: isMobile
                  ? "100%"
                  : "auto",
              }}
            >
              Next ➡
            </button>
          </div>
        </>
      ) : (
        <div
          style={{
            textAlign: "center",

            padding: isMobile ? 24 : 40,

            color: "#666",

            background: "#f8f9fa",

            borderRadius: 10,

            border:
              "2px dashed #dee2e6",

            fontSize: isMobile ? 13 : 15,
          }}
        >
          No voting records found.
        </div>
      )}
    </>
  )}
</div>
  );
}