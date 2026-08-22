const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
export const BACKEND_URL = API_BASE.replace(/\/api\/v1\/?$/, '');

export const personName = (person) =>
  `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || person?.email || 'User';

export const profilePhotoUrl = (person) => {
  if (!person) return null;
  const pic = person.profilePicture || person.profilePhotoUrl;
  if (!pic) return null;
  if (/^https?:\/\//i.test(pic)) return pic;
  return `${BACKEND_URL}/${String(pic).replace(/^\//, '')}`;
};

export const initialsOf = (person, fallback = 'U') => {
  const first = person?.firstName?.charAt(0) || '';
  const last = person?.lastName?.charAt(0) || '';
  const value = `${first}${last}`.trim();
  if (value) return value.toUpperCase();
  if (typeof fallback === 'string' && fallback.trim()) return fallback.trim().charAt(0).toUpperCase();
  return 'U';
};
