const { logger } = require("../config/logger");

function notFoundHandler(req, res) {
  return res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

function errorHandler(error, req, res, _next) {
  logger.error("Unhandled application error", {
    path: req.originalUrl,
    method: req.method,
    error: error.message
  });

  if (error.code === "SQLITE_CONSTRAINT") {
    const message = error.message.includes("UNIQUE")
      ? "That record already exists and must be unique."
      : "Database constraint violation.";

    return res.status(409).json({ message });
  }

  return res.status(error.statusCode || 500).json({
    message: error.message || "Internal server error."
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
