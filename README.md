# 🎓 CertiChain - Verifikasi Ijazah Digital Berbasis Blockchain

Platform terdesentralisasi untuk menerbitkan dan memverifikasi ijazah digital menggunakan **Ethereum Blockchain** dan **IPFS**.

![Tech Stack](https://img.shields.io/badge/Blockchain-Ethereum%20Sepolia-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)
![Backend](https://img.shields.io/badge/Backend-Express.js-green)
![IPFS](https://img.shields.io/badge/Storage-IPFS%20Pinata-teal)

---

## 📋 Daftar Isi

- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Environment Variables](#environment-variables)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Deployment](#deployment)
- [Testing](#testing)
- [Struktur Project](#struktur-project)
- [Screenshot](#screenshot)

---

## ✨ Fitur

- 🔐 **Role-Based Access**: Owner, Issuer, Verifier
- 📜 **Issue Certificate**: Terbitkan ijazah digital ke blockchain
- ✅ **Verify Certificate**: Verifikasi keaslian GRATIS (tanpa gas fee)
- 📄 **IPFS Storage**: File ijazah disimpan terdesentralisasi
- 🔗 **Shareable Links**: Link verifikasi yang bisa dibagikan
- 🎨 **Minimalis UI**: Desain ala OpenAI dengan Tailwind CSS

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Blockchain** | Ethereum Sepolia Testnet |
| **Smart Contract** | Solidity 0.8.20, Hardhat |
| **Storage** | IPFS (Pinata) |
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | Express.js (Proxy IPFS) |
| **Wallet** | MetaMask |
| **Library** | ethers.js v6, react-hot-toast, lucide-react |

---

## 📦 Prasyarat

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MetaMask** browser extension
- **Git**

---

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/your-username/certificate-dapp.git
cd certificate-dapp
2. Install Smart Contract Dependencies
bash
cd contracts
npm install
3. Install Backend Dependencies
bash
cd ../backend
npm install
4. Install Frontend Dependencies
bash
cd ../frontend
npm install```

##🔑 Environment Variables
```contracts/.env
env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_metamask_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key```

```backend/.env
env
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY=gateway.pinata.cloud
PORT=5000```

```frontend/.env
env
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
VITE_CONTRACT_ADDRESS=0x_your_contract_address
VITE_BACKEND_URL=http://localhost:5000
VITE_IPFS_GATEWAY=pinata```

```##▶️ Menjalankan Aplikasi
1. Deploy Smart Contract
bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
Simpan contract address yang muncul!

2. Jalankan Backend
bash
cd backend
npm run dev
3. Jalankan Frontend
bash
cd frontend
npm run dev
Buka http://localhost:5173 di browser.```

```##🌐 Deployment
Frontend (Vercel)
bash
cd frontend
npm install -g vercel
vercel --prod
Backend (Railway)
bash
cd backend
railway login
railway init
railway up```

```##🧪 Testing
Smart Contract Unit Test
bash
cd contracts
npx hardhat test
Test dengan Local Hardhat Node
bash

# Terminal 1
npx hardhat node

# Terminal 2
npx hardhat run scripts/deploy.js --network localhost
Test Role Detection
Role	Address	Bisa Issue?	Bisa Admin?
Owner	Deployer	✅	✅
Issuer	Ditambahkan owner	✅	❌
Non-Issuer	Address biasa	❌	❌```

```## Test Verifikasi
Buka halaman Verify

Masukkan Certificate ID (contoh: CERT-2025-001)

Klik Verify

Hasil akan muncul GRATIS tanpa MetaMask popup```

```##📁 Struktur Project
text
certificate-dapp/
├── contracts/                # Smart Contract (Hardhat)
│   ├── contracts/
│   │   └── CertificateNFT.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   │   └── CertificateNFT.test.js
│   └── hardhat.config.js
├── backend/                  # Express Proxy Server
│   ├── server.js
│   └── package.json
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   └── package.json
└── README.md```
