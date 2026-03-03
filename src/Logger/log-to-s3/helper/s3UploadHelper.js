const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");

const LOG_DIR = path.join(process.cwd(), process.env.LOG_DIRECTORY);

AWS.config.update({
  region: process.env.AWS_BUCKET_REGION,
  credentials: new AWS.Credentials({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  })
});

const s3 = new AWS.S3();

async function upload(filePath) {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const s3Key = `logs/${yyyy}/${mm}/${dd}/${path.basename(String(filePath))}`;

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

  // Sort by creation time and get the latest file
  const fileStats = files.map(file => ({
    name: file,
    path: path.join(LOG_DIR, file),
    time: fs.statSync(path.join(LOG_DIR, file)).birthtime
  })).sort((a, b) => b.time - a.time);

  const latestFile = fileStats[0]?.path;

  for (const fileInfo of fileStats) {
    if (fileInfo.path === latestFile && skipCurrent) continue;

    try {
      await upload(fileInfo.path);
      fs.unlinkSync(fileInfo.path);

      console.log(`Uploaded & Deleted log file: ${fileInfo.name}`);
    } catch (err) {
      console.error(`S3 upload failed: ${fileInfo.name}`, err.message);
    }
  }
}

module.exports = { startS3UploadScheduler };