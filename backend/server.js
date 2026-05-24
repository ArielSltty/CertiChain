const express = require("express");
const cors = require("cors");
const multer = require("multer");
const PinataSDK = require("@pinata/sdk");
const dotenv = require("dotenv");
const path = require("path");

// ============ CONFIG ============
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE ============

// CORS - izinkan frontend akses
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"], // Vite default
  methods: ["GET", "POST"],
  credentials: true,
}));

app.use(express.json());

// Multer - handle file upload di memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Max 10MB
  },
  fileFilter: (req, file, cb) => {
    // Hanya izinkan PDF
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Hanya file PDF yang diizinkan!"), false);
    }
  },
});

// ============ PINATA SETUP ============
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
});

// ============ ENDPOINTS ============

/**
 * POST /api/upload
 * Upload file PDF ke IPFS via Pinata
 */
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    // Validasi file ada
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "File tidak ditemukan. Silakan upload file PDF.",
      });
    }

    // Ambil metadata opsional dari request body
    const { studentName, courseName } = req.body;

    // Upload ke Pinata
    const uploadResult = await pinata.upload.file(req.file.buffer, {
      pinataMetadata: {
        name: req.file.originalname,
        keyvalues: {
          studentName: studentName || "",
          courseName: courseName || "",
          uploadedBy: "certificate-dapp",
          timestamp: new Date().toISOString(),
        },
      },
      pinataOptions: {
        cidVersion: 1,
      },
    });

    console.log("✅ File uploaded to IPFS:", uploadResult.IpfsHash);

    // Return sukses
    return res.status(200).json({
      success: true,
      cid: uploadResult.IpfsHash,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Upload error:", error);

    return res.status(500).json({
      success: false,
      error: "Gagal upload ke IPFS",
      message: error.message || "Internal server error",
    });
  }
});

/**
 * GET /api/health
 * Cek status server
 */
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============ ERROR HANDLING ============

// Handle Multer errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File terlalu besar. Maksimal 10MB.",
      });
    }
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  if (error.message === "Hanya file PDF yang diizinkan!") {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  next(error);
});

// Handle general errors
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