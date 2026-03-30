const AWS = require("aws-sdk");
const { formatDate } = require("../utils/formatDateAndTime");

AWS.config.update({
  region: process.env.AWS_BUCKET_REGION,
  credentials: new AWS.Credentials({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  }),
});

const s3 = new AWS.S3();

const BUCKET = process.env.S3_BUCKET_FOR_LOGS;
const SAFE_DELAY = 5 * 60 * 1000; // 5 minutes

// ---------- time helpers ----------

const toMinutes = (t) => {
  const match = t.match(/(\d+)-(\d+)(AM|PM)/);
  if (!match) {
    console.log(`Invalid time format: ${t}`);
    return 0;
  }

  const [, h, m, meridian] = match;

  let hour = Number(h);
  const min = Number(m);

  if (meridian === "PM" && hour !== 12) hour += 12;
  if (meridian === "AM" && hour === 12) hour = 0;

  return hour * 60 + min;
};

const toTimeStr = (mins) => {
  let h = Math.floor(mins / 60);
  const m = mins % 60;

  const meridian = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;

  return `${h}-${m.toString().padStart(2, "0")}${meridian}`;
};

const parseRange = (file) => {
  const parts = file.replace(".json", "").split("_");

  if (parts.length !== 2) {
    console.log(`Invalid filename format: ${file}`);
    return null;
  }

  const [start, end] = parts;

  return {
    start,
    end,
    sMin: toMinutes(start),
    eMin: toMinutes(end),
  };
};

// ---------- IST date helpers (ONLY for prefix) ----------

const getISTPrefix = (date) => {
  const formatedDate = formatDate(date);
  return `logs/${formatedDate}/web/`;
};

// ---------- S3 pagination ----------

const listAllObjects = async (prefix) => {
  let all = [];
  let ContinuationToken;

  do {
    const res = await s3
      .listObjectsV2({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken,
      })
      .promise();

    all.push(...(res.Contents || []));
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : null;

    console.log(`Fetched batch: ${res.Contents?.length || 0}, total: ${all.length}`);
  } while (ContinuationToken);

  return all;
};

// ---------- main job ----------

async function mergeLogsJob() {
  console.log("Starting mergeLogsJob");

  const now = Date.now();

  // IST-based prefixes
  const today = new Date();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const todayPrefix = getISTPrefix(today);
  const yesterdayPrefix = getISTPrefix(yesterday);

  console.log(`Processing prefixes:`);
  console.log(`Yesterday: ${yesterdayPrefix}`);
  console.log(`Today: ${todayPrefix}`);

  const [yesterdayFiles, todayFiles] = await Promise.all([
    listAllObjects(yesterdayPrefix),
    listAllObjects(todayPrefix),
  ]);

  const Contents = [...yesterdayFiles, ...todayFiles];

  console.log(`Total files fetched: ${Contents.length}`);

  const groups = {};

  // ---------- grouping ----------

  for (const obj of Contents) {
    const { Key, LastModified } = obj;

    const match = Key.match(/(logs\/\d{4}\/\d{2}\/\d{2}\/web)\/web\.\d+\/(.+\.json)/);

    if (!match) continue;

    const base = match[1];
    const file = match[2];

    const parsed = parseRange(file);
    if (!parsed) continue;
    
    if (!groups[base]) groups[base] = [];

    groups[base].push({
      key: Key,
      lastModified: LastModified,
      ...parsed,
    });
  }

  console.log(`Total groups formed: ${Object.keys(groups).length}`);

  // ---------- processing ----------

  for (const base in groups) {
    const files = groups[base];

    console.log(`Processing group: ${base}, files: ${files.length}`);

    files.sort((a, b) => a.sMin - b.sMin);

    const buckets = [];
    let current = [];

    for (const f of files) {
      if (!current.length) {
        current.push(f);
        continue;
      }

      const last = current[current.length - 1];

      if (f.sMin < last.eMin) {
        current.push(f);
        last.eMin = Math.max(last.eMin, f.eMin);
      } else {
        buckets.push(current);
        current = [f];
      }
    }

    if (current.length) buckets.push(current);

    console.log(`Buckets created: ${buckets.length}`);

    // ---------- merge ----------

    for (const bucket of buckets) {
      // Bucket-level SAFE check, skip entire bucket if any file is too recent
      const hasRecentFile = bucket.some(
        (f) => now - new Date(f.lastModified).getTime() < SAFE_DELAY
      );

      if (hasRecentFile) {
        console.log(`Skipping bucket due to recent file`);
        continue;
      }

      let min = Infinity;
      let max = -Infinity;

      bucket.forEach((f) => {
        min = Math.min(min, f.sMin);
        max = Math.max(max, f.eMin);
      });

      const fileName = `${toTimeStr(min)}_${toTimeStr(max)}.json`;
      const outputKey = `${base}/${fileName}`;

      console.log(`Merging ${bucket.length} files into ${outputKey}`);

      try {
        await s3.headObject({ Bucket: BUCKET, Key: outputKey }).promise();
        console.log(`Skipping existing merged file: ${outputKey}`);
        continue;
      } catch {}

      const results = await Promise.all(
        bucket.map((f) =>
          s3.getObject({ Bucket: BUCKET, Key: f.key }).promise()
        )
      );

      let merged = [];

      for (const res of results) {
        try {
          const lines = res.Body.toString().split("\n").filter(Boolean);

          for (const line of lines) {
            try {
              merged.push(JSON.parse(line));
            } catch {
              console.log("Skipping invalid JSON line");
            }
          }
        } catch {
          console.log("Failed to read file");
        }
      }

      console.log(`Total records merged: ${merged.length}`);

      merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      await s3
        .putObject({
          Bucket: BUCKET,
          Key: outputKey,
          Body: JSON.stringify(merged),
          ContentType: "application/json",
        })
        .promise();

      await s3
        .deleteObjects({
          Bucket: BUCKET,
          Delete: {
            Objects: bucket.map((f) => ({ Key: f.key })),
          },
        })
        .promise();

      console.log(`Merged successfully: ${outputKey}`);
    }
  }

  console.log("mergeLogsJob completed");
}

module.exports = { mergeLogsJob };