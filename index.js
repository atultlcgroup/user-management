const express = require('express');
const app = express();
require('dotenv').config();
const userRoutes = require('./src/routes/user.route');
const { httpLogger } = require('./src/Logger/log-to-s3/httpLogger');
const { setupShutdown } = require('./src/Logger/log-to-s3/shutdown-cleanup');
const fs = require('fs');
const path = require('path');

app.use(express.json());
app.use(httpLogger);
setupShutdown();
app.use('/users', userRoutes);

const PORT = process.env.PORT || 3000;
const LOG_DIR = path.join(process.cwd(), process.env.LOG_DIRECTORY);

app.get("/log-files", (req, res)=> {
  if (!fs.existsSync(LOG_DIR)) return;
    console.log("Starting S3 upload scheduler for API logs...");
  
    const files = fs.readdirSync(LOG_DIR);
    if (files.length === 0) return;
  
    // Sort by creation time and get the latest file
    return res.status(200).send(files);
});

app.get("/log-files/:name", async (req, res) => {
  try {
    const fileName = req.params.name;

    // 🚨 Prevent path traversal attacks
    if (fileName.includes("..") || fileName.includes("/")) {
      return res.status(400).json({ message: "Invalid file name" });
    }

    const filePath = path.join(LOG_DIR, fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    const fileContent = await fs.promises.readFile(filePath, "utf-8");

    return res.status(200).json({
      fileName,
      content: JSON.stringify(fileContent)
    });

  } catch (error) {
    console.error("Error reading log file:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
