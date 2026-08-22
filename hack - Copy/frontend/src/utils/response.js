export const listItems = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const keys = ['records', 'attendance', 'requests', 'employees', 'documents', 'notifications', 'logs', 'balances'];
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
};

export const listTotal = (data) => data?.pagination?.total ?? data?.total ?? 0;

export const listTotalPages = (data) => data?.pagination?.totalPages ?? data?.totalPages ?? 1;

export const asRecord = (data) => data?.record ?? data ?? null;

export const leaveTypeName = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.name || value.code || '';
};

export const leaveTypeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || value.leaveTypeId || '';
};

export const displayName = (user) => {
  const employee = user?.employee;
  if (employee?.firstName) {
    return `${employee.firstName} ${employee.lastName || ''}`.trim();
  }
  return user?.email || 'User';
};
