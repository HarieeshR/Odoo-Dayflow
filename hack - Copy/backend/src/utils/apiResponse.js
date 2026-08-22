export const successResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const errorResponse = (res, message, errorCode, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: errorCode
    }
  });
};

/** List payload with both nested pagination and flat keys the frontend expects. */
export const paginatedData = (itemsKey, items, pagination) => ({
  [itemsKey]: items,
  records: items,
  total: pagination.total,
  totalPages: pagination.totalPages,
  pagination
});
