import { useState } from 'react';
import Resolutions   from './pages/Resolutions';
import Similarity    from './pages/Similarity';
import VotingBlocs   from './pages/VotingBlocs';
import CountryProfile from './pages/CountryProfile';

const PAGES = [
  { id: 'resolutions', label: 'Resolutions'    },
  { id: 'similarity',  label: 'Similarity'     },
  { id: 'blocs',       label: 'Voting blocs'   },
  { id: 'country',     label: 'Country profile'},
];

export default function App() {
  const [page, setPage] = useState('resolutions');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-background-tertiary, #f5f4f0)',
      fontFamily: 'Poppins',
    }}>
      {/* Top navbar */}
      <div style={{ fontSize: 34, fontWeight: 500, color: 'var(--color-text-primary)', marginLeft: 26 , fontFamily: 'Bungee Spice'}}>
          UN Vote Explorer
        </div>
      <div style={{
        background: 'var(--color-background-primary)',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        height: 52,
        gap: 8,
      }}>
        
        {PAGES.map(p => (
          <button
            key={p.id}
            onClick={() => setPage(p.id)}
            style={{
              fontSize: 13,
              padding: '5px 12px',
              borderRadius: 'var(--border-radius-md)',
              border: '0.5px solid ' + (page === p.id ? 'var(--color-border-secondary)' : 'transparent'),
              background: page === p.id ? 'var(--color-background-secondary)' : 'transparent',
              color: page === p.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: page === p.id ? 500 : 400,
              cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}

        <div style={{ marginLeft: 'auto',marginTop: 7, fontSize: 12, color: 'var(--color-text-secondary)' }}>
          <img src="/UNDL2.png" alt="" srcset="" style={{height:'50px'}} />
        </div>
      </div>

      {/* Page header */}
      <div style={{ padding: '10px 24px 0' }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 2 }}>
          {PAGES.find(p => p.id === page)?.label}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 11 }}>
          {page === 'resolutions'  && 'Search UN General Assembly resolutions and see how every country voted.'}
          {page === 'similarity'   && 'Discover which countries vote alike — and which are diplomatic rivals.'}
          {page === 'blocs'        && 'See how regional blocs vote together on different issue areas.'}
          {page === 'country'      && 'Deep dive into any country\'s full UN voting history and trends.'}
        </p>
      </div>

      {/* Page content */}
      <div style={{ padding: '0 24px 40px' }}>
        {page === 'resolutions'  && <Resolutions />}
        {page === 'similarity'   && <Similarity />}
        {page === 'blocs'        && <VotingBlocs />}
        {page === 'country'      && <CountryProfile />}
      </div>
    </div>
  );
}