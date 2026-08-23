export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || (statusCode === 401 ? 'AUTH_EXPIRED' : (statusCode === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR'));

  console.error(`[Error Handler] [${req.method} ${req.url}] (${errorCode}):`, err.message);

  res.status(statusCode).json({
    success: false,
    error: errorCode,
    message: err.message || 'An unexpected operational error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
