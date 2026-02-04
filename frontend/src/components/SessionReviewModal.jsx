import React, { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { userService } from '../services'
import './SessionReviewModal.css'

const SessionReviewModal = ({ bookingId, providerName, onComplete }) => {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10)
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [])

  const isValid = rating >= 1 && (reviewText.trim().length >= 10)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid || isSubmitting) return
    setError('')
    setIsSubmitting(true)
    try {
      await userService.submitSessionReview(bookingId, {
        rating,
        reviewText: reviewText.trim()
      })
      setIsSuccess(true)
      setTimeout(() => {
        if (onComplete) onComplete()
      }, 2200)
    } catch (err) {
      setError(err.message || 'Failed to submit review. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`session-review-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`session-review-modal ${isVisible ? 'visible' : ''}`} onClick={e => e.stopPropagation()}>
        {!isSuccess ? (
          <>
            <h2 className="session-review-title">Rate Your Session</h2>
            <p className="session-review-subtitle">
              Please rate your session with <strong>{providerName}</strong> and write a review. This helps others find great providers.
            </p>
            <form onSubmit={handleSubmit} className="session-review-form">
              <div className="session-review-field">
                <label>Rating (required) *</label>
                <div className="session-review-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="session-review-star-btn"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      <Star
                        className={`session-review-star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                        size={40}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="session-review-field">
                <label htmlFor="review-text">Review (required, min 10 characters) *</label>
                <textarea
                  id="review-text"
                  className="session-review-textarea"
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Share your experience with this provider..."
                  rows={5}
                  minLength={10}
                  required
                />
              </div>
              {error && <p className="session-review-error">{error}</p>}
              <button
                type="submit"
                className="session-review-submit"
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </>
        ) : (
          <div className="session-review-success">
            <div className="session-review-checkmark-wrapper">
              <div className="session-review-checkmark-circle">
                <svg className="session-review-checkmark-svg" viewBox="0 0 52 52">
                  <circle className="session-review-checkmark-bg" cx="26" cy="26" r="25" fill="none" />
                  <path className="session-review-checkmark-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
              </div>
              <div className="session-review-success-rings">
                <div className="session-review-ring session-review-ring-1" />
                <div className="session-review-ring session-review-ring-2" />
                <div className="session-review-ring session-review-ring-3" />
              </div>
            </div>
            <h2 className="session-review-success-title">Thank You!</h2>
            <p className="session-review-success-message">Your review has been submitted successfully.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionReviewModal
