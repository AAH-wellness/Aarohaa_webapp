import React, { useState, useEffect, useRef } from 'react'
import './SessionChat.css'

const SessionChat = ({ bookingId, currentUserName, providerName, onSendMessage }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  useEffect(() => {
    // Load messages from localStorage (in production, use API/WebSocket)
    loadMessages()
    
    // Poll for new messages every 2 seconds (in production, use WebSocket)
    const interval = setInterval(loadMessages, 2000)
    return () => clearInterval(interval)
  }, [bookingId])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollToBottom()
  }, [messages])

  const loadMessages = () => {
    try {
      const savedMessages = JSON.parse(localStorage.getItem(`session_messages_${bookingId}`) || '[]')
      setMessages(savedMessages)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return

    const message = {
      id: Date.now().toString(),
      sender: currentUserName || 'You',
      senderType: 'user',
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      bookingId: bookingId
    }

    // Add message to local state immediately
    const updatedMessages = [...messages, message]
    setMessages(updatedMessages)
    
    // Save to localStorage
    localStorage.setItem(`session_messages_${bookingId}`, JSON.stringify(updatedMessages))
    
    // Clear input
    setNewMessage('')

    // Call callback if provided (for API integration)
    if (onSendMessage) {
      try {
        setIsLoading(true)
        await onSendMessage(message)
      } catch (error) {
        console.error('Error sending message:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="session-chat">
      <div className="chat-header">
        <h3 className="chat-title">Session Notes</h3>
        <p className="chat-subtitle">Chat with {providerName}</p>
      </div>
      
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="empty-icon">💬</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message ${message.senderType === 'user' ? 'user-message' : 'provider-message'}`}
            >
              <div className="message-content">
                <div className="message-header">
                  <span className="message-sender">{message.sender}</span>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
                <div className="message-text">{message.content}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!newMessage.trim() || isLoading}
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default SessionChat
