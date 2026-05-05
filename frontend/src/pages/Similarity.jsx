import { useState, useEffect } from 'react';
import { getCountries, getSimilarity, getSimilarityRanking } from '../api';

function ScoreBar({ score }) {
  const color = score >= 70 ? '#3B6D11' : score >= 50 ? '#BA7517' : '#A32D2D';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--color-background-secondary)', borderRadius: 3 }}>
        <div style={{ width: `${score}%`, height: 6, background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color, minWidth: 36 }}>{score}%</span>
    </div>
  );
}

export default function Similarity() {
  const [countries, setCountries] = useState([]);
  const [c1, setC1] = useState('');
  const [c2, setC2] = useState('');
  const [result, setResult] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rankLoading, setRankLoading] = useState(false);

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

  const card = (children) => ({
    background: 'var(--color-background-primary)',
    border: '0.5px solid var(--color-border-tertiary)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '14px 16px',
    marginBottom: 12,
  });

  return (
    <div>
      {/* Country pair selector */}
      <div style={card()}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: 'var(--color-text-primary)' }}>
          Compare two countries
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <select style={{ flex: 1 }} value={c1} onChange={e => setC1(e.target.value)}>
            <option value="">Select country A...</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>vs</span>
          <select style={{ flex: 1 }} value={c2} onChange={e => setC2(e.target.value)}>
            <option value="">Select country B...</option>
            {countries.filter(c => c.id !== parseInt(c1)).map(c =>
              <option key={c.id} value={c.id}>{c.name}</option>
            )}
          </select>
          <button onClick={handleCompare} disabled={!c1 || !c2 || c1 === c2 || loading}>
            {loading ? 'Computing...' : 'Compare'}
          </button>
        </div>

        {result && (
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12,
            }}>
              {[
                {
                  label: 'Similarity score',
                  value: result.score != null ? `${result.score}%` : 'No similarity',
                  color:
                    result.score == null
                      ? 'var(--color-text-secondary)'
                      : result.score >= 70
                        ? 'var(--color-text-success)'
                        : result.score >= 50
                          ? 'var(--color-text-warning)'
                          : 'var(--color-text-danger)',
                },
                { label: 'Matching votes', value: result.matchingVotes },
                { label: 'Compared on', value: `${result.totalCompared} resolutions` },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 500, color: s.color || 'var(--color-text-primary)' }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{
              padding: '8px 12px', borderRadius: 'var(--border-radius-md)',
              background: 'var(--color-background-secondary)',
              fontSize: 13, color: 'var(--color-text-secondary)',
            }}>
              {result.interpretation}
            </div>
          </div>
        )}
      </div>

      {/* Ranking: one country vs all */}
      <div style={card()}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: 'var(--color-text-primary)' }}>
          Closest allies ranking
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <select
            style={{ flex: 1 }}
            onChange={e => handleRanking(e.target.value)}
            defaultValue=""
          >
            <option value="">Pick a country to see its allies...</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {rankLoading && (
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Computing similarity across all countries...</div>
        )}

        {ranking.length > 0 && !rankLoading && (
          <div>
            {ranking.map((c, i) => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 0',
                borderBottom: i < ranking.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none',
              }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', minWidth: 18 }}>{i + 1}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-primary)', minWidth: 120 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', minWidth: 80 }}>{c.region}</span>
                <div style={{ flex: 1 }}>
                  <ScoreBar score={Math.round(c.score)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}