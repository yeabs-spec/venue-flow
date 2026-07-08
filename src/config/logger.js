const fs = require("fs");
const path = require("path");

const logsDirectory = path.join(process.cwd(), "logs");

function ensureLogsDirectory() {
  if (!fs.existsSync(logsDirectory)) {
    fs.mkdirSync(logsDirectory, { recursive: true });
  }
}

function writeLog(fileName, payload) {
  ensureLogsDirectory();
  const logPath = path.join(logsDirectory, fileName);
  fs.appendFileSync(logPath, `${JSON.stringify(payload)}\n`, "utf8");
}

function baseLog(level, message, meta = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  };

  const consoleMethod = level === "error" ? console.error : console.log;
  consoleMethod(`[${payload.timestamp}] ${level.toUpperCase()} ${message}`);
  writeLog("app.log", payload);

  if (level === "error") {
    writeLog("error.log", payload);
  }
}

const logger = {
  info(message, meta) {
    baseLog("info", message, meta);
  },
  warn(message, meta) {
    baseLog("warn", message, meta);
  },
  error(message, meta) {
    baseLog("error", message, meta);
  }
};

module.exports = {
  logger,
  logsDirectory,
  ensureLogsDirectory
};
