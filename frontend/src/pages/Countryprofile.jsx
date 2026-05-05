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

  useEffect(() => {
    getCountries().then(setCountries);
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
    <div style={{
      maxWidth: 900,
      margin: '0 auto',
      font: 'Poppins',
      position: 'relative', // 🔥 FIX: Prevent overlay stacking issues
      // zIndex: 5000
    }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <select
          style={{ flex: 1, padding: 8 }}
          value={selected}
          onChange={e => {
            setSelected(e.target.value);
            setError(null);
          }}
        >
          <option value="">Select a country...</option>
          {countries.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          style={{ padding: 8 }}
          value={topic}
          onChange={e => setTopic(e.target.value)}
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
        <div style={{
          color: '#A32D2D',
          background: '#FCEBEB',
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          zIndex: 10 // 🔥 FIX: Ensure error shows above everything
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading - 🔥 FIX: Proper loading overlay */}
      {loading && (
        <div style={{
          position: 'fixed',
          inset: 0, // cleaner than top/left/right/bottom
          background: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000 // highest layer
        }}>
          <div className="spinner"></div>
          <p style={{ color: "#333", marginTop: 10 }}>
            Loading...
          </p>
        </div>
      )}

      {/* Main content */}
      {profile && !loading && !error && (
        <>
          {/* Header */}
          <div style={{
            background: '#ddd',
            border: '1px solid #ddd',
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // 🔥 FIX: Better visual separation
            color: '#000000',
          }}>
            <h3 style={{ marginBottom: 5 }}>{profile.country.name}</h3>
            <div style={{ color: '#5e5e5f', fontSize: 13 }}>
              {profile.country.region} · UN since {profile.country.unMemberSince}
            </div>

            {/* Stats */}
            {totalVotes > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 10,
                marginTop: 15
              }}>
                {Object.entries(VOTE_STYLE).map(([type, style]) => {
                  const count = statsMap[type] || 0;
                  const pct = Math.round((count / totalVotes) * 100);

                  return (
                    <div key={type} style={{
                      background: '#70b6e7',
                      borderRadius: 8,
                      padding: 10,
                      textAlign: 'center',
                      color: '#454545'
                    }}>
                      <div style={{ fontSize: 12 }}>{type}</div>
                      <div style={{ color: '#000000', fontSize: 18, fontWeight: 600 }}>{pct}%</div>
                      <div style={{ fontSize: 11 }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trend Graph - 🔥 FIXED: Proper bar chart */}
          <div style={{ marginBottom: 10, fontWeight: 600 }}>
            Yes vote % by year
          </div>
          {profile.trend?.length > 0 && (
            // <TrendChart trend={profile.trend} />
            <TrendChart trend={profile.trend} />
          )}

          {/* 🌍 WORLD BANK SECTION */}
          {wb && (
            <div style={{
              marginTop: 20,
              padding: 16,
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 10,
              position: "relative",
              color: 'black',
              marginBottom: 20
            }}>
              <h3>🌍 Economic Overview</h3>
              {/* Metadata */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4,1fr)',
                gap: 10,
                marginBottom: 20
              }}>
                <div><b>Capital:</b> {wb.metadata.capitalCity}</div>
                <div><b>Income:</b> {wb.metadata.incomeLevel}</div>
                <div><b>Region:</b> {wb.metadata.region}</div>
                <div><b>ISO3:</b> {wb.metadata.iso3Code}</div>
              </div>

              {/* GDP Chart */}
              <h4>GDP Growth (%)</h4>
              <GdpChart dataMap={wb.gdpGrowth} />

              {/* TRADE CHART */}
              <h4 style={{ marginTop: 20 }}>Trade (Imports vs Exports)</h4>
              <TradeChart
                exportsData={wb.exports}
                importsData={wb.imports}
              />
            </div>
          )}

          {/* Table */}
          {votes.length > 0 ?
            (
              <>
                <div style={{
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: 10,
                  overflowX: 'auto',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  color: "#000000"
                }}>
                  <div style={{ padding: 12, fontWeight: 600, }}>
                    Voting history ({totalPages} pages)
                  </div>

                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    color: "#000000"
                  }}>
                    <thead style={{ background: '#f8f9fa' }}>
                      <tr>
                        <th style={thStyle}>Year</th>
                        <th style={thStyle}>Resolution</th>
                        <th style={thStyle}>Title</th>
                        <th style={thStyle}>Vote</th>
                      </tr>
                    </thead>

                    <tbody>
                      {votes.map((v, i) => {
                        const voteKey = normalizeVoteType(v.voteType);
                        const vs = VOTE_STYLE[voteKey];

                        return (
                          <tr key={`${v.resolutionId}-${i}`} style={{
                            borderTop: '1px solid #eee'
                          }}>
                            <td style={tdStyle}>{v.sessionYear}</td>
                            <td style={tdStyle}>{v.resolutionNumber}</td>
                            <td style={tdStyle}>{v.title}</td>
                            <td style={tdStyle}>
                              <span style={{
                                background: vs.bg,
                                color: vs.color,
                                padding: '4px 8px',
                                borderRadius: 12,
                                fontWeight: 500,
                                fontSize: 12
                              }}>
                                {voteKey}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/*  */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 12,
                }}>
                  <button
                    onClick={() => setPage(prev => Math.max(prev - 1, 0))}
                    disabled={page === 0}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #ccc',
                      background: page === 0 ? '#eee' : '#fff',
                      cursor: page === 0 ? 'not-allowed' : 'pointer',
                      color: "#000"
                    }}
                  >
                    ⬅ Previous
                  </button>

                  <div style={{ fontSize: 13, color: '#444' }}>
                    Page <b>{page + 1}</b> of <b>{totalPages}</b>
                  </div>

                  <button
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={page >= totalPages - 1}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #ccc',
                      background: page >= totalPages - 1 ? '#eee' : '#fff',
                      cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                      color: "#000"
                    }}
                  >
                    Next ➡
                  </button>
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: 40,
                color: '#666',
                background: '#f8f9fa',
                borderRadius: 10,
                border: '2px dashed #dee2e6'
              }}>
                No voting records found.
              </div>
            )}
        </>
      )}
    </div>
  );
}