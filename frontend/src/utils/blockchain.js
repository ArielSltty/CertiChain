import { ethers } from 'ethers'

// ============ CONTRACT ABI ============
const CONTRACT_ABI = [
  // Owner
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Issuer Management
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'isIssuer',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_newIssuer', type: 'address' }],
    name: 'addIssuer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_issuer', type: 'address' }],
    name: 'removeIssuer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Certificate Management
  {
    inputs: [
      { internalType: 'bytes32', name: 'certId', type: 'bytes32' },
      { internalType: 'string', name: '_studentName', type: 'string' },
      { internalType: 'string', name: '_courseName', type: 'string' },
      { internalType: 'string', name: '_ipfsCID', type: 'string' },
    ],
    name: 'issueCertificate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'certId', type: 'bytes32' }],
    name: 'revokeCertificate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Verification (View - FREE)
  {
    inputs: [{ internalType: 'bytes32', name: 'certId', type: 'bytes32' }],
    name: 'verifyCertificate',
    outputs: [
      { internalType: 'bool', name: 'isValid', type: 'bool' },
      { internalType: 'string', name: 'studentName', type: 'string' },
      { internalType: 'string', name: 'courseName', type: 'string' },
      { internalType: 'uint256', name: 'issueDate', type: 'uint256' },
      { internalType: 'address', name: 'issuer', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'certId', type: 'bytes32' }],
    name: 'getCertificate',
    outputs: [
      { internalType: 'string', name: 'studentName', type: 'string' },
      { internalType: 'string', name: 'courseName', type: 'string' },
      { internalType: 'string', name: 'ipfsCID', type: 'string' },
      { internalType: 'uint256', name: 'issueDate', type: 'uint256' },
      { internalType: 'bool', name: 'isValid', type: 'bool' },
      { internalType: 'address', name: 'issuer', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'certId', type: 'bytes32' }],
    name: 'certificateExists',
    outputs: [{ internalType: 'bool', name: 'exists', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTotalCertificates',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'certId', type: 'bytes32' },
      { indexed: false, internalType: 'string', name: 'studentName', type: 'string' },
      { indexed: true, internalType: 'address', name: 'issuer', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'CertificateIssued',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'certId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'issuer', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'CertificateRevoked',
    type: 'event',
  },
]

// ============ CONSTANTS ============
const SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS

/**
 * Setup provider untuk baca data (read-only, tanpa signer)
 * @returns {ethers.JsonRpcProvider}
 */
export const getProvider = () => {
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL)
    return provider
  } catch (error) {
    console.error('❌ Failed to create provider:', error)
    throw new Error('Gagal terhubung ke jaringan Sepolia. Periksa RPC URL.')
  }
}

/**
 * Setup signer dari MetaMask provider
 * @param {ethers.BrowserProvider} browserProvider - Provider dari MetaMask
 * @returns {Promise<ethers.Signer>}
 */
export const getSigner = async (browserProvider) => {
  try {
    if (!browserProvider) {
      throw new Error('MetaMask provider tidak tersedia. Silakan connect wallet.')
    }
    const signer = await browserProvider.getSigner()
    return signer
  } catch (error) {
    console.error('❌ Failed to get signer:', error)
    throw new Error('Gagal mendapatkan signer. Pastikan wallet terhubung.')
  }
}

/**
 * Get contract instance dengan signer (untuk write operations)
 * @param {ethers.BrowserProvider} browserProvider - Provider dari MetaMask
 * @returns {Promise<ethers.Contract>}
 */
export const getContract = async (browserProvider) => {
  try {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address tidak ditemukan. Periksa file .env.')
    }

    const signer = await getSigner(browserProvider)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
    return contract
  } catch (error) {
    console.error('❌ Failed to get contract:', error)
    throw error
  }
}

/**
 * Get contract instance read-only (untuk view functions - GRATIS)
 * @returns {ethers.Contract}
 */
export const getReadOnlyContract = () => {
  try {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address tidak ditemukan. Periksa file .env.')
    }

    const provider = getProvider()
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
    return contract
  } catch (error) {
    console.error('❌ Failed to get read-only contract:', error)
    throw error
  }
}

/**
 * Get contract address dari environment variable
 * @returns {string}
 */
export const getContractAddress = () => {
  if (!CONTRACT_ADDRESS) {
    throw new Error('VITE_CONTRACT_ADDRESS tidak di-set di file .env')
  }
  return CONTRACT_ADDRESS
}

/**
 * Generate certificate ID dari studentName + courseName + timestamp
 * @param {string} studentName
 * @param {string} courseName
 * @param {number} timestamp
 * @returns {string} bytes32 hex string
 */
export const generateCertId = (studentName, courseName, timestamp) => {
  const data = ethers.solidityPacked(
    ['string', 'string', 'uint256'],
    [studentName, courseName, timestamp]
  )
  return ethers.keccak256(data)
}

export { CONTRACT_ABI }