export const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // body-parser errors carry `status` (400 bad JSON, 413 too large); anything else unexpected is a 500.
  const status = err.status || err.statusCode || 500;
  const message = status >= 500 && process.env.NODE_ENV !== 'development'
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
