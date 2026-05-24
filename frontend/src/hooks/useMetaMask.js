import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'

const SEPOLIA_CHAIN_ID = '0xaa36a7' // 11155111 in hex

const useMetaMask = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState(null)
  const [balance, setBalance] = useState('0')
  const [chainId, setChainId] = useState(null)
  const [provider, setProvider] = useState(null)
  const [error, setError] = useState(null)

  // Check if already connected on mount
  useEffect(() => {
    checkConnection()
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet()
    } else {
      setAccount(accounts[0])
      getBalance(accounts[0])
    }
  }

  const handleChainChanged = (chainIdHex) => {
    setChainId(parseInt(chainIdHex, 16))
    if (account) {
      getBalance(account)
    }
  }

  const checkConnection = async () => {
    try {
      if (!window.ethereum) {
        setError('MetaMask not installed')
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.listAccounts()
      
      if (accounts.length > 0) {
        const network = await provider.getNetwork()
        setAccount(accounts[0].address)
        setChainId(Number(network.chainId))
        setIsConnected(true)
        setProvider(provider)
        await getBalance(accounts[0].address, provider)
      }
    } catch (err) {
      console.error('Check connection error:', err)
    }
  }

  const connectWallet = async () => {
    try {
      setError(null)

      if (!window.ethereum) {
        throw new Error('Please install MetaMask!')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      
      // Request accounts
      const accounts = await provider.send('eth_requestAccounts', [])
      
      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const network = await provider.getNetwork()
      
      // Check if on Sepolia
      if (Number(network.chainId) !== 11155111) {
        // Try to switch to Sepolia
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          })
        } catch (switchError) {
          // If Sepolia not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: SEPOLIA_CHAIN_ID,
                chainName: 'Sepolia Testnet',
                nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: [import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              }],
            })
          }
        }
      }

      setAccount(accounts[0])
      setChainId(Number(network.chainId))
      setIsConnected(true)
      setProvider(provider)
      
      await getBalance(accounts[0], provider)

    } catch (err) {
      console.error('Connect error:', err)
      setError(err.message || 'Failed to connect')
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setBalance('0')
    setChainId(null)
    setIsConnected(false)
    setProvider(null)
    setError(null)
  }

  const getBalance = async (address, prov = null) => {
    try {
      const p = prov || provider
      if (!p || !address) return

      const balanceWei = await p.getBalance(address)
      const balanceEth = ethers.formatEther(balanceWei)
      setBalance(balanceEth)
    } catch (err) {
      console.error('Get balance error:', err)
    }
  }

  return {
    isConnected,
    account,
    balance,
    chainId,
    error,
    provider,
    connectWallet,
    disconnectWallet,
    getBalance,
  }
}

export default useMetaMask