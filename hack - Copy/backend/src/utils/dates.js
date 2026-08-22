/** Calendar date as UTC midnight, using the server's local calendar day. */
export const toUtcDateOnly = (input = new Date()) => {
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}/.test(input)) {
    return new Date(`${input.slice(0, 10)}T00:00:00.000Z`);
  }
  const d = input instanceof Date ? input : new Date(input);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

export const idOf = (value) => {
  if (!value) return value;
  if (typeof value === 'object' && value._id) return value._id;
  return value;
};
