const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const axios = require("axios");
const FormData = require("form-data");

// ============ CONFIG ============
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE ============
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST"],
  credentials: true,
}));

app.use(express.json());

// Multer - simpan file di memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// ============ ENDPOINTS ============

// Health check
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Upload file ke Pinata
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    // Cek apakah file ada
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "File tidak ditemukan. Silakan upload file PDF.",
      });
    }

    console.log("📤 Received file:", req.file.originalname);
    console.log("📏 File size:", (req.file.size / 1024).toFixed(2), "KB");

    // Siapkan FormData untuk Pinata
    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // Metadata opsional
    const metadata = JSON.stringify({
      name: req.file.originalname,
      keyvalues: {
        studentName: req.body.studentName || "",
        courseName: req.body.courseName || "",
        uploadedBy: "certificate-dapp",
        timestamp: new Date().toISOString(),
      },
    });
    formData.append("pinataMetadata", metadata);

    // Options
    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append("pinataOptions", options);

    // Upload ke Pinata API
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
      }
    );

    const cid = response.data.IpfsHash;
    console.log("✅ Uploaded to IPFS:", cid);

    return res.status(200).json({
      success: true,
      cid: cid,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Upload error:", error.message);

    // Log detail error dari Pinata
    if (error.response) {
      console.error("Pinata response:", error.response.data);
    }

    return res.status(500).json({
      success: false,
      error: "Gagal upload ke IPFS",
      message: error.message || "Internal server error",
    });
  }
});

// ============ ERROR HANDLING ============
app.use((error, req, res, next) => {
  console.error("❌ Server error:", error);
  return res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📤 Upload endpoint: POST http://localhost:${PORT}/api/upload`);
  console.log("=".repeat(50));
});