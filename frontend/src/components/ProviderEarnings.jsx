import React, { useState, useEffect } from 'react'
import './ProviderEarnings.css'

const ProviderEarnings = () => {
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    thisMonth: 0,
    thisWeek: 0,
    today: 0,
    sessionsCompleted: 0,
  })

  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    const loadEarnings = () => {
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]')
      const now = new Date()
      
      // Calculate earnings from real payment data
      const payments = JSON.parse(localStorage.getItem('payments') || '[]')
      const providerPayments = payments.filter(p => p.providerId || p.provider) // Filter by provider
      
      const totalEarnings = providerPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
      
      // This month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const thisMonthPayments = providerPayments.filter(p => {
        const paymentDate = new Date(p.date || p.createdAt)
        return paymentDate >= monthStart
      })
      const thisMonth = thisMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

      // This week
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const thisWeekPayments = providerPayments.filter(p => {
        const paymentDate = new Date(p.date || p.createdAt)
        return paymentDate >= weekStart
      })
      const thisWeek = thisWeekPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

      // Today
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const todayPayments = providerPayments.filter(p => {
        const paymentDate = new Date(p.date || p.createdAt)
        return paymentDate >= today && paymentDate < tomorrow
      })
      const todayEarnings = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

      // Count completed sessions
      const completedSessions = appointments.filter(apt => {
        const aptDate = new Date(apt.dateTime)
        return aptDate < now
      })

      setEarningsData({
        totalEarnings,
        thisMonth,
        thisWeek,
        today: todayEarnings,
        sessionsCompleted: completedSessions.length,
      })

      // Load real transactions from payments
      const transactionsData = providerPayments.slice(0, 10).map(payment => ({
        id: payment.id || payment.transactionId,
        date: payment.date || payment.createdAt,
        patient: payment.patientName || payment.userName || 'Patient',
        amount: payment.amount || 0,
        status: payment.status || 'completed',
        type: payment.type || 'session',
      }))
      setTransactions(transactionsData)
    }

    loadEarnings()
    const interval = setInterval(loadEarnings, 60000)
    
    return () => clearInterval(interval)
  }, [])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const earningsCards = [
    {
      title: 'Total Earnings',
      value: `$${earningsData.totalEarnings.toLocaleString()}`,
      icon: '💰',
      color: 'purple',
      trend: '',
    },
    {
      title: 'This Month',
      value: `$${earningsData.thisMonth.toLocaleString()}`,
      icon: '📅',
      color: 'blue',
      trend: '',
    },
    {
      title: 'This Week',
      value: `$${earningsData.thisWeek.toLocaleString()}`,
      icon: '📊',
      color: 'green',
      trend: 'Active',
    },
    {
      title: 'Today',
      value: `$${earningsData.today.toLocaleString()}`,
      icon: '💵',
      color: 'orange',
      trend: `${earningsData.today > 0 ? 'Earned' : 'No sessions'}`,
    },
  ]

  return (
    <div className="provider-earnings">
      <div className="provider-earnings-header">
        <div>
          <h1 className="provider-earnings-title">Earnings & Analytics</h1>
          <p className="provider-earnings-subtitle">Track your earnings and session statistics</p>
        </div>
        <div className="provider-earnings-summary">
          <div className="provider-summary-item">
            <span className="provider-summary-label">Sessions Completed</span>
            <span className="provider-summary-value">{earningsData.sessionsCompleted}</span>
          </div>
        </div>
      </div>

      <div className="provider-earnings-grid">
        {earningsCards.map((card, index) => (
          <div key={index} className={`provider-earnings-card provider-earnings-card-${card.color}`}>
            <div className="provider-earnings-card-header">
              <div className="provider-earnings-icon">{card.icon}</div>
              <span className="provider-earnings-trend">{card.trend}</span>
            </div>
            <div className="provider-earnings-card-content">
              <h3 className="provider-earnings-card-title">{card.title}</h3>
              <p className="provider-earnings-card-value">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="provider-transactions-section">
        <h2 className="provider-section-title">Recent Transactions</h2>
        <div className="provider-transactions-card">
          {transactions.length === 0 ? (
            <div className="provider-no-transactions">
              <div className="provider-no-transactions-icon">💰</div>
              <p className="provider-no-transactions-message">No transactions yet</p>
            </div>
          ) : (
            <div className="provider-transactions-list">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="provider-transaction-item">
                  <div className="provider-transaction-icon">💼</div>
                  <div className="provider-transaction-info">
                    <h3 className="provider-transaction-title">Session with {transaction.patient}</h3>
                    <p className="provider-transaction-date">{formatDate(transaction.date)}</p>
                  </div>
                  <div className="provider-transaction-amount">
                    <span className="provider-amount-value">+${transaction.amount}</span>
                    <span className={`provider-status-badge provider-status-${transaction.status}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProviderEarnings

