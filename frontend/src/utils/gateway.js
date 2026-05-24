// ============ IPFS GATEWAYS ============
const GATEWAYS = {
  pinata: 'https://gateway.pinata.cloud/ipfs',
  ipfs: 'https://ipfs.io/ipfs',
  cloudflare: 'https://cloudflare-ipfs.com/ipfs',
  dweb: 'https://dweb.link/ipfs',
  '4everland': 'https://4everland.io/ipfs',
}

const DEFAULT_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'pinata'

/**
 * Get IPFS URL dari CID
 * @param {string} cid - IPFS Content Identifier
 * @param {string} gateway - Nama gateway (default: dari .env atau 'pinata')
 * @returns {string} Full IPFS URL
 */
export const getIPFSUrl = (cid, gateway = DEFAULT_GATEWAY) => {
  // Validasi CID
  if (!cid || typeof cid !== 'string') {
    throw new Error('CID tidak valid. CID harus berupa string.')
  }

  // Bersihkan CID dari prefix yang mungkin ada
  let cleanCid = cid.trim()
  
  // Hapus prefix ipfs:// jika ada
  if (cleanCid.startsWith('ipfs://')) {
    cleanCid = cleanCid.replace('ipfs://', '')
  }

  // Validasi format CID (basic check)
  if (cleanCid.length < 10) {
    throw new Error('CID terlalu pendek. Format CID tidak valid.')
  }

  // Cek gateway tersedia
  const gatewayUrl = GATEWAYS[gateway]
  if (!gatewayUrl) {
    console.warn(`⚠️ Gateway "${gateway}" tidak dikenal. Menggunakan default: pinata`)
    return `${GATEWAYS.pinata}/${cleanCid}`
  }

  return `${gatewayUrl}/${cleanCid}`
}

/**
 * Get multiple gateway URLs untuk fallback
 * @param {string} cid
 * @returns {Array<{name: string, url: string}>}
 */
export const getAllGatewayUrls = (cid) => {
  if (!cid) return []

  const cleanCid = cid.replace('ipfs://', '')

  return Object.entries(GATEWAYS).map(([name, url]) => ({
    name,
    url: `${url}/${cleanCid}`,
  }))
}

/**
 * Cek apakah sebuah CID bisa diakses
 * @param {string} cid
 * @param {string} gateway
 * @returns {Promise<boolean>}
 */
export const checkCIDAccessible = async (cid, gateway = 'pinata') => {
  try {
    const url = getIPFSUrl(cid, gateway)
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 detik timeout
    })
    return response.ok
  } catch (error) {
    console.warn(`⚠️ CID tidak dapat diakses via ${gateway}:`, error.message)
    return false
  }
}

/**
 * Download file PDF dari IPFS
 * @param {string} cid
 * @param {string} gateway
 * @returns {Promise<Blob>}
 */
export const downloadFromIPFS = async (cid, gateway = DEFAULT_GATEWAY) => {
  try {
    const url = getIPFSUrl(cid, gateway)
    console.log('📥 Downloading from:', url)

    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000), // 30 detik timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const blob = await response.blob()
    return blob
  } catch (error) {
    console.error('❌ Download error:', error)
    throw new Error(`Gagal mengunduh file dari IPFS: ${error.message}`)
  }
}

/**
 * Buka file PDF di tab baru
 * @param {string} cid
 * @param {string} gateway
 */
export const openPDFInNewTab = (cid, gateway = DEFAULT_GATEWAY) => {
  try {
    const url = getIPFSUrl(cid, gateway)
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (error) {
    console.error('❌ Gagal membuka PDF:', error)
    throw error
  }
}

export { GATEWAYS, DEFAULT_GATEWAY }