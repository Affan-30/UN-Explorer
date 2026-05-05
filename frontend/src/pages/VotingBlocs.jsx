import { useState, useEffect } from 'react';
import { getBlocs } from '../api';

const REGION_COLORS = {
  'Africa':        { bg: '#E1F5EE', text: '#0F6E56', dot: '#1D9E75' },
  'Americas':      { bg: '#E6F1FB', text: '#185FA5', dot: '#378ADD' },
  'Asia-Pacific':  { bg: '#EEEDFE', text: '#3C3489', dot: '#7F77DD' },
  'Europe':        { bg: '#EAF3DE', text: '#3B6D11', dot: '#639922' },
  'Middle East':   { bg: '#FAEEDA', text: '#854F0B', dot: '#BA7517' },
};

const TOPICS = [
  { slug: '',             label: 'All topics'   },
  { slug: 'nuclear',      label: 'Nuclear Weapons'      },
  { slug: 'human_rights', label: 'Human rights' },
  { slug: 'climate',      label: 'Climate & Environment'      },
  { slug: 'palestine',    label: 'Palestine'    },
  { slug: 'trade',    label: 'Trade & Development'    },
  { slug: 'peacekeeping',    label: 'Peace keeping'    },
  { slug: 'decolonization',    label: 'Decolonization'    },
];

export default function VotingBlocs() {
  const [blocs, setBlocs]   = useState([]);
  const [topic, setTopic]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getBlocs(topic)
      .then(setBlocs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [topic]);

  return (
  <div>

    {/* ─── FILTER BAR ───────────────────────── */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20
    }}>
      <select
        value={topic}
        onChange={e => setTopic(e.target.value)}
        style={{
          padding: 8,
          borderRadius: 6,
          border: '1px solid #ddd'
        }}
      >
        {TOPICS.map(t => (
          <option key={t.slug} value={t.slug}>{t.label}</option>
        ))}
      </select>

      <span style={{ fontSize: 13, color: '#666' }}>
        🌍 Voting blocs by region
      </span>
    </div>

    {/* ─── LOADING ───────────────────────── */}
    {loading ? (
      <div style={{ textAlign: 'center', padding: 40 }}>Computing blocs...</div>
    ) : (

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16
      }}>

        {blocs.map(bloc => {
          const style = REGION_COLORS[bloc.region] || {
            bg: '#F1EFE8',
            text: '#5F5E5A',
            dot: '#888780'
          };

          const voteDist = bloc.voteDistribution || {};
          const total = Object.values(voteDist).reduce((a, b) => a + b, 0);

          return (
            <div key={bloc.region} style={{
              background: '#fff',
              border: '1px solid #e5e5e5',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}>

              {/* ─── HEADER ───────────────── */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: style.dot,
                  marginRight: 8
                }} />

                <div style={{ fontWeight: 600, color:'black' }}>
                  {bloc.region}
                </div>

                <div style={{
                  marginLeft: 'auto',
                  fontSize: 12,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: style.bg,
                  color: style.text
                }}>
                  {bloc.countryCount} countries
                </div>
              </div>

              {/* ─── BIG VOTE BAR ───────────────── */}
              <div style={{
                display: 'flex',
                height: 10,
                borderRadius: 6,
                overflow: 'hidden',
                marginBottom: 12
              }}>
                {[
                  { type: 'yes', color: '#4CAF50' },
                  { type: 'no', color: '#E53935' },
                  { type: 'abstain', color: '#FB8C00' },
                  { type: 'absent', color: '#9E9E9E' },
                ].map(({ type, color }) => {
                  const count = voteDist[type] || 0;
                  const pct = total ? (count / total) * 100 : 0;

                  return pct > 0 && (
                    <div
                      key={type}
                      style={{
                        width: `${pct}%`,
                        background: color
                      }}
                      title={`${type}: ${Math.round(pct)}%`}
                    />
                  );
                })}
              </div>

              {/* ─── STATS GRID ───────────────── */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2,1fr)',
                gap: 8,
                marginBottom: 12
              }}>
                {Object.entries(voteDist).map(([type, count]) => {
                  const pct = total ? Math.round((count / total) * 100) : 0;

                  return (
                    <div key={type} style={{
                      background: '#f8f9fa',
                      borderRadius: 6,
                      padding: 8,
                      fontSize: 12
                    }}>
                      <div style={{ textTransform: 'capitalize', color: '#2f0000' }}>
                        {type}
                      </div>
                      <div style={{ fontWeight: 600, color:'gray' }}>
                        {pct}% ({count})
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ─── COUNTRIES ───────────────── */}
              <div style={{
                fontSize: 12,
                color: '#555',
                lineHeight: 1.6,
                borderTop: '1px solid #eee',
                paddingTop: 10
              }}>
                <strong>Countries:</strong><br />
                {bloc.countries.slice(0, 5).join(', ')}
                {bloc.countries.length > 5 && (
                  <span style={{ color: '#999' }}>
                    {' '}+{bloc.countries.length - 5} more
                  </span>
                )}
              </div>

            </div>
          );
        })}
      </div>
    )}
  </div>
);
}