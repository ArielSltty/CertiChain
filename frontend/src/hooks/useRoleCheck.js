import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import CertificateNFTABI from '../contracts/CertificateNFT.json'

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS

const useRoleCheck = (provider, account) => {
  const [isIssuer, setIsIssuer] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkRoles = async () => {
      if (!provider || !account) {
        setIsIssuer(false)
        setIsOwner(false)
        setLoading(false)
        return
      }

      try {
        const signer = await provider.getSigner()
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CertificateNFTABI.abi,
          signer
        )

        // Check if issuer
        const issuerStatus = await contract.isIssuer(account)
        setIsIssuer(issuerStatus)

        // Check if owner
        const ownerAddress = await contract.owner()
        setIsOwner(ownerAddress.toLowerCase() === account.toLowerCase())

      } catch (err) {
        console.error('Role check error:', err)
        setIsIssuer(false)
        setIsOwner(false)
      } finally {
        setLoading(false)
      }
    }

    checkRoles()
  }, [provider, account])

  return { isIssuer, isOwner, loading }
}

export default useRoleCheck