import { useState, useEffect, useCallback } from 'react';
import { getResolutions, getResolutionVotes } from '../api';

const VOTE_COLORS = {
  yes: { bg: '#EAF3DE', text: '#3B6D11', label: 'Yes' },
  no: { bg: '#FCEBEB', text: '#A32D2D', label: 'No' },
  abstain: { bg: '#FAEEDA', text: '#854F0B', label: 'Abstain' },
  absent: { bg: '#F1EFE8', text: '#5F5E5A', label: 'Absent' },
};

const TOPICS = [
  { slug: '', label: 'All topics' },
  { slug: 'nuclear', label: 'Nuclear Weapons' },
  { slug: 'human_rights', label: 'Human rights' },
  { slug: 'climate', label: 'Climate & Environment' },
  { slug: 'palestine', label: 'Palestine' },
  { slug: 'trade', label: 'Trade & Development' },
  { slug: 'peacekeeping', label: 'Peacekeeping' },
  { slug: 'arms_control', label: 'Arms control' },
];

export default function Resolutions() {
  const [resolutions, setResolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('');
  const [year, setYear] = useState('');
  const [selected, setSelected] = useState(null);
  const [votes, setVotes] = useState(null);
  const [votesLoading, setVotesLoading] = useState(false);

  const fetchResolutions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (topic) params.topic = topic;
      if (year) params.year = year;
      const data = await getResolutions(params);
      setResolutions(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, topic, year]);

  useEffect(() => { fetchResolutions(); }, [fetchResolutions]);

  const openVotes = async (resolution) => {
    setSelected(resolution);
    setVotesLoading(true);
    try {
      const data = await getResolutionVotes(resolution.id);
      setVotes(data.votes);
    } catch (e) {
      console.error(e);
    } finally {
      setVotesLoading(false);
    }
  };

  return (
    <div>
      {/* Search & filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          style={{ flex: 1, minWidth: 200 }}
          placeholder="Search resolutions, e.g. 'nuclear', 'Gaza'..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={topic} onChange={e => setTopic(e.target.value)}>
          {TOPICS.map(t => <option key={t.slug} value={t.slug}>{t.label}</option>)}
        </select>
        <select value={year} onChange={e => setYear(e.target.value)}>
          <option value="">All years</option>
          {[2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y =>
            <option key={y} value={y}>{y}</option>
          )}
        </select>
      </div>

      
      {/* Vote breakdown modal */}
      {selected && (
        <div style={{
          marginTop: 16,
          marginBottom: 16,
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 3 }}>{selected.resolution_number}</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)' }}>{selected.title}</div>
            </div>
            <button onClick={() => { setSelected(null); setVotes(null); }} style={{ fontSize: 12 }}>Close</button>
          </div>

          {votesLoading ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Loading votes...</div>
          ) : votes && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              {Object.entries(VOTE_COLORS).map(([type, style]) => (
                <div key={type} style={{
                  background: style.bg,
                  borderRadius: 'var(--border-radius-md)',
                  padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: style.text, marginBottom: 6 }}>
                    {style.label} ({votes[type]?.length || 0})
                  </div>
                  {(votes[type] || []).slice(0, 8).map(c => (
                    <div key={c.id} style={{ fontSize: 11, color: style.text, marginBottom: 2 }}>{c.name}</div>
                  ))}
                  {(votes[type]?.length || 0) > 8 && (
                    <div style={{ fontSize: 11, color: style.text, opacity: 0.6 }}>
                      +{votes[type].length - 8} more
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resolution list */}
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
            Loading resolutions...
          </div>
        ) : resolutions.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
            No resolutions found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                {['Resolution', 'Title', 'Topics', 'Yes', 'No', 'Abstain'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resolutions.map(r => (
                <tr
                  key={r.id}
                  onClick={() => openVotes(r)}
                  style={{ borderBottom: '0.5px solid var(--color-border-tertiary)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                    {r.resolutionNumber}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {r.title}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span  style={{
                        display: 'inline-block',
                        fontSize: 10,
                        padding: '2px 7px',
                        borderRadius: 20,
                        background: '#EEEDFE',
                        color: '#3C3489',
                        marginRight: 3,
                        fontWeight: 500,
                      }}>
                        {r.topics[0]}
                      </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#a6f961', fontWeight: 500 }}>{r.totalYes}</td>
                  <td style={{ padding: '8px 12px', color: '#ff5e5e', fontWeight: 500 }}>{r.totalNo}</td>
                  <td style={{ padding: '8px 12px', color: '#fc971c', fontWeight: 500 }}>{r.totalAbstain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}