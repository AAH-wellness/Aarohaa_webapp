import React, { useState, useEffect } from 'react'
import './WalletConnect.css'

const WalletConnect = ({ onWalletConnected }) => {
  const [availableWallets, setAvailableWallets] = useState([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  useEffect(() => {
    let isMounted = true
    
    const checkAvailableWallets = () => {
      if (typeof window === 'undefined') {
        if (isMounted) {
          setAvailableWallets([])
        }
        return
      }
      
      const wallets = []
      
      try {
        // Check for Phantom wallet - safely access window.solana
        if (window.solana && typeof window.solana === 'object' && window.solana.isPhantom) {
          wallets.push({
            name: 'Phantom',
            icon: '👻',
            provider: window.solana,
          })
        }
      } catch (error) {
        console.error('Error checking Phantom wallet:', error)
      }
      
      try {
        // Check for Solflare
        if (window.solflare && typeof window.solflare === 'object') {
          wallets.push({
            name: 'Solflare',
            icon: '🔥',
            provider: window.solflare,
          })
        }
      } catch (error) {
        console.error('Error checking Solflare wallet:', error)
      }
      
      try {
        // Check for Backpack
        if (window.backpack && typeof window.backpack === 'object') {
          wallets.push({
            name: 'Backpack',
            icon: '🎒',
            provider: window.backpack,
          })
        }
      } catch (error) {
        console.error('Error checking Backpack wallet:', error)
      }
      
      if (isMounted) {
        setAvailableWallets(wallets)
      }
    }
    
    checkAvailableWallets()
    
    // Cleanup
    return () => {
      isMounted = false
    }
  }, [])

  const fetchWalletBalance = async (publicKey) => {
    try {
      // Fetch actual SOL balance from Solana RPC
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [publicKey],
        }),
      })
      
      const data = await response.json()
      if (data.result) {
        // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
        const balanceInSol = data.result.value / 1_000_000_000
        // Format with 4 decimal places
        return balanceInSol.toLocaleString('en-US', { 
          minimumFractionDigits: 4, 
          maximumFractionDigits: 4 
        })
      }
      return '0.0000'
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
      return '0.0000' // Return 0 if balance fetch fails
    }
  }

  const connectWallet = async (wallet) => {
    if (!wallet || !wallet.provider) {
      console.error('Invalid wallet object')
      alert('Invalid wallet. Please try again.')
      return
    }
    
    setIsConnecting(true)
    try {
      const provider = wallet.provider
      
      // Validate provider before connecting
      if (typeof provider.connect !== 'function') {
        throw new Error('Wallet provider does not support connection')
      }
      
      // Connect to wallet
      const response = await provider.connect()
      
      if (!response || !response.publicKey) {
        throw new Error('Invalid wallet response')
      }
      
      const publicKey = response.publicKey.toString()
      
      // Fetch SOL balance from wallet
      const balance = await fetchWalletBalance(publicKey)
      
      const walletData = {
        address: publicKey,
        balance: `${balance} SOL`,
        network: 'Solana',
        isConnected: true,
        walletName: wallet.name,
      }
      
      // Save to localStorage safely
      try {
        localStorage.setItem('walletData', JSON.stringify(walletData))
      } catch (storageError) {
        console.error('Error saving wallet data to localStorage:', storageError)
        // Continue even if localStorage fails
      }
      
      // Update parent component
      if (onWalletConnected) {
        onWalletConnected(walletData)
      }
      
      setShowWalletModal(false)
      setIsConnecting(false)
    } catch (error) {
      console.error('Error connecting wallet:', error)
      if (error.code === 4001) {
        alert('Connection rejected. Please approve the connection request.')
      } else {
        alert('Failed to connect wallet. Please try again.')
      }
      setIsConnecting(false)
    }
  }

  const handleConnectClick = () => {
    if (availableWallets.length === 0) {
      alert('No Solana wallets detected. Please install Phantom, Solflare, or Backpack wallet extension.')
      return
    }
    setShowWalletModal(true)
  }

  return (
    <>
      <button className="connect-wallet-btn" onClick={handleConnectClick}>
        Connect Wallet
      </button>

      {showWalletModal && (
        <div className="wallet-modal-overlay" onClick={() => setShowWalletModal(false)}>
          <div className="wallet-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-header">
              <h3>Connect Wallet</h3>
              <button className="close-modal-btn" onClick={() => setShowWalletModal(false)}>×</button>
            </div>
            <div className="wallet-list">
              {availableWallets.length === 0 ? (
                <div className="no-wallets-message">
                  <p>No Solana wallets detected.</p>
                  <p>Please install one of the following:</p>
                  <ul>
                    <li>Phantom Wallet</li>
                    <li>Solflare</li>
                    <li>Backpack</li>
                  </ul>
                </div>
              ) : (
                availableWallets.map((wallet, index) => (
                  <button
                    key={index}
                    className="wallet-option"
                    onClick={() => connectWallet(wallet)}
                    disabled={isConnecting}
                  >
                    <span className="wallet-icon">{wallet.icon}</span>
                    <span className="wallet-name">{wallet.name}</span>
                    {isConnecting && <span className="connecting-spinner">⏳</span>}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default WalletConnect
