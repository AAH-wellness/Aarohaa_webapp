import React, { useState, useEffect } from 'react'
import './AdminAnalytics.css'

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState('30d')
  const [analyticsData, setAnalyticsData] = useState({
    usageTrends: [],
    sessionVolumes: [],
    walletActivity: [],
    revenueData: [],
  })

  useEffect(() => {
    // Load real analytics data from localStorage or API
    const loadAnalytics = () => {
      const storedData = JSON.parse(localStorage.getItem('analyticsData') || '{}')
      
      // If no stored data, initialize with empty arrays
      setAnalyticsData({
        usageTrends: storedData.usageTrends || [],
        sessionVolumes: storedData.sessionVolumes || [],
        walletActivity: storedData.walletActivity || [],
        revenueData: storedData.revenueData || [],
      })
    }

    loadAnalytics()
  }, [timeRange])

  const maxUsers = Math.max(...analyticsData.usageTrends.map(d => d.users), 0)
  const maxSessions = Math.max(...analyticsData.sessionVolumes.map(d => d.sessions), 0)
  const maxTransactions = Math.max(...analyticsData.walletActivity.map(d => d.transactions), 0)
  const maxRevenue = Math.max(...analyticsData.revenueData.map(d => d.revenue), 0)

  const totalRevenue = analyticsData.revenueData.reduce((sum, d) => sum + (d.revenue || 0), 0)
  const totalSessions = analyticsData.sessionVolumes.reduce((sum, d) => sum + (d.sessions || 0), 0)
  const totalTransactions = analyticsData.walletActivity.reduce((sum, d) => sum + (d.transactions || 0), 0)
  const avgSessionDuration = analyticsData.sessionVolumes.length > 0 
    ? Math.round(analyticsData.sessionVolumes.reduce((sum, d) => sum + (d.avgDuration || 0), 0) / analyticsData.sessionVolumes.length)
    : 0

  return (
    <div className="admin-analytics">
      <div className="analytics-header">
        <div>
          <h1 className="page-title">Analytics & Insights</h1>
          <p className="page-subtitle">Comprehensive platform analytics and usage trends</p>
        </div>
        <div className="time-range-selector">
          <button
            className={`time-range-btn ${timeRange === '7d' ? 'active' : ''}`}
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </button>
          <button
            className={`time-range-btn ${timeRange === '30d' ? 'active' : ''}`}
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </button>
          <button
            className={`time-range-btn ${timeRange === '90d' ? 'active' : ''}`}
            onClick={() => setTimeRange('90d')}
          >
            90 Days
          </button>
        </div>
      </div>

      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <span className="kpi-label">Total Revenue</span>
            <span className="kpi-value">${totalRevenue.toLocaleString()}</span>
            <span className="kpi-trend"></span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <span className="kpi-label">Total Sessions</span>
            <span className="kpi-value">{totalSessions.toLocaleString()}</span>
            <span className="kpi-trend"></span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🔗</div>
          <div className="kpi-content">
            <span className="kpi-label">Wallet Transactions</span>
            <span className="kpi-value">{totalTransactions.toLocaleString()}</span>
            <span className="kpi-trend"></span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">⏱️</div>
          <div className="kpi-content">
            <span className="kpi-label">Avg. Session Duration</span>
            <span className="kpi-value">{avgSessionDuration} min</span>
            <span className="kpi-trend"></span>
          </div>
        </div>
      </div>

      <div className="analytics-charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Usage Trends</h3>
            <span className="chart-subtitle">Users & Providers Over Time</span>
          </div>
          <div className="chart-container">
            <div className="bar-chart">
              {analyticsData.usageTrends.map((data, index) => (
                <div key={index} className="bar-group">
                  <div className="bar-wrapper">
                    <div
                      className="bar users-bar"
                      style={{ height: `${(data.users / maxUsers) * 100}%` }}
                      title={`${data.users} users`}
                    ></div>
                    <div
                      className="bar providers-bar"
                      style={{ height: `${(data.providers / maxUsers) * 100}%` }}
                      title={`${data.providers} providers`}
                    ></div>
                  </div>
                  <span className="bar-label">{data.date.split(' ')[1]}</span>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color users"></span>
                <span>Users</span>
              </div>
              <div className="legend-item">
                <span className="legend-color providers"></span>
                <span>Providers</span>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Session Volumes</h3>
            <span className="chart-subtitle">Daily Session Count</span>
          </div>
          <div className="chart-container">
            <div className="line-chart">
              <svg viewBox="0 0 400 200" className="line-chart-svg">
                <polyline
                  fill="none"
                  stroke="#0e4826"
                  strokeWidth="3"
                  points={analyticsData.sessionVolumes
                    .map((d, i) => {
                      const x = (i / (analyticsData.sessionVolumes.length - 1)) * 380 + 10
                      const y = 190 - (d.sessions / maxSessions) * 170
                      return `${x},${y}`
                    })
                    .join(' ')}
                />
                {analyticsData.sessionVolumes.map((d, i) => {
                  const x = (i / (analyticsData.sessionVolumes.length - 1)) * 380 + 10
                  const y = 190 - (d.sessions / maxSessions) * 170
                  return (
                    <circle key={i} cx={x} cy={y} r="4" fill="#FFD700" />
                  )
                })}
              </svg>
            </div>
            <div className="chart-axis-labels">
              <span>Start</span>
              <span>End</span>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Wallet Activity</h3>
            <span className="chart-subtitle">Blockchain Transactions</span>
          </div>
          <div className="chart-container">
            <div className="area-chart">
              {analyticsData.walletActivity.map((data, index) => (
                <div key={index} className="area-bar-group">
                  <div
                    className="area-bar"
                    style={{ height: `${(data.transactions / maxTransactions) * 100}%` }}
                    title={`${data.transactions} transactions`}
                  >
                    <div className="area-fill"></div>
                  </div>
                  <span className="area-label">{data.date.split(' ')[1]}</span>
                </div>
              ))}
            </div>
            <div className="chart-stats">
              <div className="stat-item">
                <span className="stat-label">Total Volume</span>
                <span className="stat-value">
                  ${analyticsData.walletActivity.reduce((sum, d) => sum + d.volume, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Revenue Trends</h3>
            <span className="chart-subtitle">Daily Revenue</span>
          </div>
          <div className="chart-container">
            <div className="revenue-chart">
              {analyticsData.revenueData.map((data, index) => (
                <div key={index} className="revenue-bar-group">
                  <div
                    className="revenue-bar"
                    style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                    title={`$${data.revenue.toLocaleString()}`}
                  >
                    <div className="revenue-fill"></div>
                  </div>
                  <span className="revenue-label">{data.date.split(' ')[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-insights">
        <div className="insights-card">
          <h3 className="insights-title">Key Insights</h3>
          <ul className="insights-list">
            {(() => {
              const insights = JSON.parse(localStorage.getItem('analyticsInsights') || '[]')
              return insights.length === 0 ? (
                <li>
                  <span className="insight-icon">ℹ️</span>
                  <span>No insights available. Analytics will populate as data is collected.</span>
                </li>
              ) : (
                insights.map((insight, index) => (
                  <li key={index}>
                    <span className="insight-icon">{insight.icon || '📊'}</span>
                    <span>{insight.text}</span>
                  </li>
                ))
              )
            })()}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AdminAnalytics

