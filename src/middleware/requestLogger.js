const fs = require("fs");
const path = require("path");
const morgan = require("morgan");

const { ensureLogsDirectory } = require("../config/logger");

ensureLogsDirectory();

const accessLogStream = fs.createWriteStream(path.join(process.cwd(), "logs", "access.log"), {
  flags: "a"
});

module.exports = morgan("combined", {
  stream: accessLogStream
});
