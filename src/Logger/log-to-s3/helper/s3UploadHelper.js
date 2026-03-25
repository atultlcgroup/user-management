const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
const { formatTime, formatDate } = require("../utils/formatDateAndTime");

const LOG_DIR = path.join(process.cwd(), process.env.LOG_DIRECTORY);

AWS.config.update({
  region: process.env.AWS_BUCKET_REGION,
  credentials: new AWS.Credentials({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  })
});

const s3 = new AWS.S3();

async function upload(filePath, s3Key) {
  console.log(`Uploading log file to S3: ${path.basename(String(filePath))} as ${s3Key}`);
  return s3.upload({
    Bucket: process.env.S3_BUCKET_FOR_LOGS,
    Key: s3Key,
    Body: fs.createReadStream(filePath),
    ContentType: "application/json"
  }).promise();
}

async function startS3UploadScheduler(skipCurrent = true) {
  if (!fs.existsSync(LOG_DIR)) return;

  console.log("Starting S3 upload scheduler for API logs...");

  const files = fs.readdirSync(LOG_DIR);
  if (files.length === 0) return;

  const fileStats = files.map(file => {
    const fullPath = path.join(LOG_DIR, file);
    const stats = fs.statSync(fullPath);

    return {
      name: file,
      path: fullPath,
      created: stats.birthtime,
      modified: stats.mtime
    };
  }).sort((a, b) => b.modified - a.modified);

  const latestFile = fileStats[0];

  for (const fileInfo of fileStats) {
    const isLatest = fileInfo.path === latestFile?.path;
    if (isLatest && skipCurrent) continue;

    try {
      const s3Key = getS3Key(fileInfo, isLatest, skipCurrent);

      await upload(fileInfo.path, s3Key);
      fs.unlinkSync(fileInfo.path);

      console.log(`Uploaded & Deleted log file: ${fileInfo.name}`);
    } catch (err) {
      console.error(`S3 upload failed: ${fileInfo.name}`, err.message);
    }
  }
}

function getS3Key(fileInfo, isLatest, skipCurrent) {
  const fileName = path.basename(fileInfo.path);

  const parts = fileName.replace(".json", "").split("_");

  const startStr = parts[0];
  let endStr = parts[1];

  if (isLatest && !skipCurrent) {
    endStr = formatTime(new Date());
  }

  const newFileName = `${startStr}_${endStr}.json`;

  const formattedDate = formatDate(new Date());
  const { full, type } = getDynoInfo();

  const s3Key = `logs/${formattedDate}/${type}/${full}/${fileName}`;

  return s3Key;
}

function getDynoInfo() {
  const dyno = process.env.DYNO || "local";

  const [type, number] = dyno.split(".");

  return {
    full: dyno,          // "web.1"
    type: type || "app", // "web" / "worker"
    number: number || "0"
  };
}

module.exports = { startS3UploadScheduler };