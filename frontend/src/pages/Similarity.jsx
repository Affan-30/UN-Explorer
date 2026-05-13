import { useState, useEffect } from 'react';
import { getCountries, getSimilarity, getSimilarityRanking } from '../api';

export default function Similarity() {
  const [countries, setCountries] = useState([]);
  const [c1, setC1] = useState('');
  const [c2, setC2] = useState('');
  const [result, setResult] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rankLoading, setRankLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    getCountries().then(setCountries).catch(console.error);
  }, []);

  const handleCompare = async () => {
    if (!c1 || !c2 || c1 === c2) return;
    setLoading(true);
    try {
      const data = await getSimilarity(c1, c2);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRanking = async (id) => {
    if (!id) return;
    setRankLoading(true);
    try {
      const data = await getSimilarityRanking(id, 15);
      setRanking(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRankLoading(false);
    }
  };

  function ScoreBar({ score }) {
    const color =
      score >= 70
        ? "#3B6D11"
        : score >= 50
          ? "#BA7517"
          : "#A32D2D";

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 6 : 8,
          width: "100%",
        }}
      >
        {/* Progress Bar */}
        <div
          style={{
            flex: 1,
            height: isMobile ? 7 : 6,
            background:
              "var(--color-background-secondary)",
            borderRadius: 999,
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: `${score}%`,
              height: "100%",
              background: color,
              borderRadius: 999,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* Percentage */}
        <span
          style={{
            fontSize: isMobile ? 11 : 12,
            fontWeight: 600,
            color,
            minWidth: isMobile ? 32 : 36,
            textAlign: "right",
            whiteSpace: "nowrap",
          }}
        >
          {score}%
        </span>
      </div>
    );
  }

  const card = (children) => ({
    background: 'var(--color-background-primary)',
    border: '0.5px solid var(--color-border-tertiary)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '14px 16px',
    marginBottom: 12,
  });

  return (
    <div>
      {/* Country Pair Selector */}
      <div style={card()}>
        <div
          style={{
            fontSize: isMobile ? 12 : 13,
            fontWeight: 500,
            marginBottom: 10,
            color: "var(--color-text-primary)",
          }}
        >
          Compare two countries
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: isMobile ? "stretch" : "center",
            flexDirection: isMobile ? "column" : "row",
            marginBottom: 12,
          }}
        >
          <select
            style={{
              flex: 1,
              width: isMobile ? "100%" : "auto",
            }}
            value={c1}
            onChange={(e) => setC1(e.target.value)}
          >
            <option value="">Select country A...</option>

            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <span
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
              fontWeight: 500,
              textAlign: "center",
            }}
          >
            vs
          </span>

          <select
            style={{
              flex: 1,
              width: isMobile ? "100%" : "auto",
            }}
            value={c2}
            onChange={(e) => setC2(e.target.value)}
          >
            <option value="">Select country B...</option>

            {countries
              .filter((c) => c.id !== parseInt(c1))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>

          <button
            onClick={handleCompare}
            disabled={!c1 || !c2 || c1 === c2 || loading}
            style={{
              width: isMobile ? "100%" : "auto",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Computing..." : "Compare"}
          </button>
        </div>

        {result && (
          <div>
            <div
              style={{
                display: "grid",

                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "1fr 1fr 1fr",

                gap: 8,
                marginBottom: 12,
              }}
            >
              {[
                {
                  label: "Similarity score",

                  value:
                    result.score != null
                      ? `${result.score}%`
                      : "No similarity",

                  color:
                    result.score == null
                      ? "var(--color-text-secondary)"
                      : result.score >= 70
                        ? "var(--color-text-success)"
                        : result.score >= 50
                          ? "var(--color-text-warning)"
                          : "var(--color-text-danger)",
                },

                {
                  label: "Matching votes",
                  value: result.matchingVotes,
                },

                {
                  label: "Compared on",
                  value: `${result.totalCompared} resolutions`,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background:
                      "var(--color-background-secondary)",

                    borderRadius: "var(--border-radius-md)",

                    padding: isMobile
                      ? "10px"
                      : "10px 12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color:
                        "var(--color-text-secondary)",
                      marginBottom: 3,
                    }}
                  >
                    {s.label}
                  </div>

                  <div
                    style={{
                      fontSize: isMobile ? 16 : 18,
                      fontWeight: 500,
                      color:
                        s.color ||
                        "var(--color-text-primary)",
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: isMobile
                  ? "10px"
                  : "8px 12px",

                borderRadius:
                  "var(--border-radius-md)",

                background:
                  "var(--color-background-secondary)",

                fontSize: isMobile ? 12 : 13,
                color: "var(--color-text-secondary)",
                lineHeight: 1.5,
              }}
            >
              {result.interpretation}
            </div>
          </div>
        )}
      </div>

      {/* Ranking */}
      <div style={card()}>
        <div
          style={{
            fontSize: isMobile ? 12 : 13,
            fontWeight: 500,
            marginBottom: 10,
            color: "var(--color-text-primary)",
          }}
        >
          Closest allies ranking
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <select
            style={{
              flex: 1,
              width: "100%",
            }}
            onChange={(e) =>
              handleRanking(e.target.value)
            }
            defaultValue=""
          >
            <option value="">
              Pick a country to see its allies...
            </option>

            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {rankLoading && (
          <div
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
            }}
          >
            Computing similarity across all
            countries...
          </div>
        )}

        {ranking.length > 0 && !rankLoading && (
          <div>
            {ranking.map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: "flex",

                  flexDirection: isMobile
                    ? "column"
                    : "row",

                  alignItems: isMobile
                    ? "flex-start"
                    : "center",

                  gap: 10,

                  padding: "10px 0",

                  borderBottom:
                    i < ranking.length - 1
                      ? "0.5px solid var(--color-border-tertiary)"
                      : "none",
                }}
              >
                {/* Top row mobile */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color:
                        "var(--color-text-secondary)",
                      minWidth: 18,
                    }}
                  >
                    {i + 1}
                  </span>

                  <span
                    style={{
                      fontSize: isMobile ? 12 : 13,
                      color:
                        "var(--color-text-primary)",
                      fontWeight: 500,
                      minWidth: isMobile
                        ? "auto"
                        : 120,
                    }}
                  >
                    {c.name}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      color:
                        "var(--color-text-secondary)",
                    }}
                  >
                    {c.region}
                  </span>
                </div>

                {/* Score bar */}
                <div
                  style={{  
                     width: isMobile ? "100%" : 920,
    flexShrink: 0,
                  }}
                >
                  <ScoreBar
                    score={Math.round(c.score)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
//  <div>
//             {ranking.map((c, i) => (
//               <div key={c.id} style={{
//                 display: 'flex', alignItems: 'center', gap: 10,
//                 padding: '7px 0',
//                 borderBottom: i < ranking.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none',
//               }}>
//                 <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', minWidth: 18 }}>{i + 1}</span>
//                 <span style={{ fontSize: 13, color: 'var(--color-text-primary)', minWidth: 120 }}>{c.name}</span>
//                 <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', minWidth: 80 }}>{c.region}</span>
//                 <div style={{ flex: 1 }}>
//                   <ScoreBar score={Math.round(c.score)} />
//                 </div>
//               </div>
//             ))}
//           </div>