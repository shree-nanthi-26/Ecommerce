export default function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  const isProduction = process.env.NODE_ENV === "production";

  // Prevent leaking internal system details on 500 errors in production
  const message =
    statusCode === 500 && isProduction
      ? "An internal server error occurred. Please try again later."
      : err.message || "Server Error";

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
}
