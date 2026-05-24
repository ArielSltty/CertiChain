import axios from 'axios'

// ============ CONSTANTS ============
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

/**
 * Upload file PDF ke backend proxy, lalu backend upload ke Pinata
 * @param {File} file - File PDF dari input form
 * @param {Object} metadata - Metadata tambahan (studentName, courseName)
 * @returns {Promise<{success: boolean, cid: string, fileName: string}>}
 */
export const uploadFileToBackend = async (file, metadata = {}) => {
  try {
    // Validasi input
    if (!file) {
      throw new Error('File tidak ditemukan.')
    }

    // Validasi tipe file
    if (file.type !== 'application/pdf') {
      throw new Error('Hanya file PDF yang diizinkan.')
    }

    // Validasi ukuran (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_SIZE) {
      throw new Error('Ukuran file terlalu besar. Maksimal 10MB.')
    }

    // Siapkan FormData
    const formData = new FormData()
    formData.append('file', file)

    // Tambahkan metadata jika ada
    if (metadata.studentName) {
      formData.append('studentName', metadata.studentName)
    }
    if (metadata.courseName) {
      formData.append('courseName', metadata.courseName)
    }

    console.log(`📤 Uploading ${file.name} (${(file.size / 1024).toFixed(2)} KB) to backend...`)

    // Kirim ke backend
    const response = await axios.post(`${BACKEND_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 detik timeout untuk file besar
    })

    // Validasi response
    if (!response.data.success) {
      throw new Error(response.data.error || 'Upload gagal.')
    }

    console.log('✅ Upload sukses! CID:', response.data.cid)

    return {
      success: true,
      cid: response.data.cid,
      fileName: response.data.fileName,
    }
  } catch (error) {
    console.error('❌ Upload error:', error)

    // Handle Axios errors
    if (error.response) {
      // Server merespon dengan error
      const serverError = error.response.data?.error || error.response.data?.message
      throw new Error(serverError || `Server error: ${error.response.status}`)
    } else if (error.request) {
      // Request dibuat tapi tidak ada response
      throw new Error('Tidak dapat terhubung ke backend. Pastikan server berjalan di port 5000.')
    }

    throw error
  }
}

/**
 * Cek status backend
 * @returns {Promise<boolean>}
 */
export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/health`, {
      timeout: 5000,
    })
    return response.data.status === 'ok'
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message)
    return false
  }
}