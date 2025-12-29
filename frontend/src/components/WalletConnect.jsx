import React, { useState, useEffect } from 'react'
import './WalletConnect.css'

const WalletConnect = ({ onWalletConnected }) => {
  const [availableWallets, setAvailableWallets] = useState([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  useEffect(() => {
    checkAvailableWallets()
  }, [])

  const checkAvailableWallets = () => {
    const wallets = []
    
    // Check for Phantom wallet
    if (window.solana && window.solana.isPhantom) {
      wallets.push({
        name: 'Phantom',
        icon: '👻',
        provider: window.solana,
      })
    }
    
    // Check for Solflare
    if (window.solflare) {
      wallets.push({
        name: 'Solflare',
        icon: '🔥',
        provider: window.solflare,
      })
    }
    
    // Check for Backpack
    if (window.backpack) {
      wallets.push({
        name: 'Backpack',
        icon: '🎒',
        provider: window.backpack,
      })
    }
    
    setAvailableWallets(wallets)
  }

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
    setIsConnecting(true)
    try {
      const provider = wallet.provider
      
      // Connect to wallet
      const response = await provider.connect()
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
      
      // Save to localStorage
      localStorage.setItem('walletData', JSON.stringify(walletData))
      
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
