const BASE = import.meta.env.VITE_API_URL || 'https://un-explorer-1.onrender.com/api';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Resolutions
export const getResolutions = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/resolutions${qs ? '?' + qs : ''}`);
};
export const getResolution      = (id)    => get(`/resolutions/${id}`);
export const getResolutionVotes = (id)    => get(`/resolutions/${id}/votes`);

// Countries
export const getCountries      = ()           => get('/countries');
export const getCountry        = (id)         => get(`/countries/${id}`);
export const getCountryVotes = (id, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/countries/${id}/votes${qs ? '?' + qs : ''}`);
};

// Similarity
export const getSimilarity        = (c1, c2) => get(`/similarity?c1=${c1}&c2=${c2}`);
export const getSimilarityRanking = (id, limit = 10) =>
  get(`/similarity/ranking/${id}?limit=${limit}`);
// Blocs
export const getBlocs             = (topic)  =>
  get(`/similarity/blocs${topic ? '?topic=' + topic : ''}`);