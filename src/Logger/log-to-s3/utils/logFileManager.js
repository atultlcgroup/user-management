const fs = require("fs");
const path = require("path");
const winston = require("winston");
const {startS3UploadScheduler} = require("../helper/s3UploadHelper")

const LOG_DIR = path.join(process.cwd(), process.env.LOG_DIRECTORY);
const INTERVAL_MIN = Number(process.env.LOG_FILE_INTERVAL_MINUTES || 30);

let currentTransport;
let rotationTimer;

function ensureDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);
}

function buildFileName() {
  const start = new Date();
  const end = new Date(start.getTime() + INTERVAL_MIN * 60000);

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = date.getHours() >= 12 ? "PM" : "AM";
    return `${hours}-${minutes} ${ampm}`;
  };

  const startTime = formatTime(start);
  const endTime = formatTime(end);
  const fileName = `${startTime}_${endTime}.json`;

  return path.join(LOG_DIR, fileName);
}

function rotateTransport(logger) {
  ensureDir();

  // Close old transport
  if (currentTransport) {
    logger.remove(currentTransport);
    currentTransport.close();
  }
  const newFileName = buildFileName();
  console.log(`Rotating log file. New file: ${newFileName}`);
  // Create new transport
  currentTransport = new winston.transports.File({
    filename: newFileName
  });
  
  logger.add(currentTransport);

  // Upload Files to S3
  startS3UploadScheduler();

  clearTimeout(rotationTimer);
  rotationTimer = setTimeout(() => rotateTransport(logger), INTERVAL_MIN * 60000);
}

module.exports = { rotateTransport };