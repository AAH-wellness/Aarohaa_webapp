import React, { useEffect, useMemo, useState } from 'react'
import { userService } from '../services'
import './ProviderGoogleOnboardingModal.css'

const ProviderGoogleOnboardingModal = ({ onCompleted, onSignOut }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [providerEmail, setProviderEmail] = useState('')
  const [providerName, setProviderName] = useState('')

  const [form, setForm] = useState({
    phone: '',
    title: '',
    specialization: '',
    bio: '',
    hourlyRate: '',
  })

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10)
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const res = await userService.getProviderProfile()
        const p = res?.provider
        if (p) {
          setProviderEmail(p.email || '')
          setProviderName(p.name || '')
          setForm({
            phone: p.phone || '',
            title: p.title || '',
            specialization: p.specialty || '',
            bio: p.bio || '',
            hourlyRate: p.hourlyRate ? String(p.hourlyRate) : '',
          })
        }
      } catch (e) {
        console.error('Failed to load provider profile for onboarding:', e)
        setError('Failed to load your profile. Please refresh and try again.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const canSave = useMemo(() => {
    const phoneOk = form.phone.trim().length > 0
    const titleOk = form.title.trim().length > 0
    const specOk = form.specialization.trim().length > 0
    const bioOk = form.bio.trim().length >= 20
    const rate = parseFloat(form.hourlyRate)
    const rateOk = Number.isFinite(rate) && rate > 0
    return phoneOk && titleOk && specOk && bioOk && rateOk && !isSaving
  }, [form, isSaving])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSave = async () => {
    try {
      setError('')
      setIsSaving(true)

      const hourlyRateNum = parseFloat(form.hourlyRate)
      if (!Number.isFinite(hourlyRateNum) || hourlyRateNum <= 0) {
        setError('Please enter a valid hourly rate.')
        setIsSaving(false)
        return
      }

      await userService.updateProviderProfile({
        phone: form.phone.trim(),
        title: form.title.trim(),
        specialty: form.specialization.trim(),
        bio: form.bio.trim(),
        hourlyRate: hourlyRateNum,
      })

      // Unlock provider dashboard
      localStorage.removeItem('profileIncomplete')

      // Update currentUser cache (best-effort)
      try {
        const currentUserRaw = localStorage.getItem('currentUser')
        if (currentUserRaw) {
          const currentUser = JSON.parse(currentUserRaw)
          localStorage.setItem(
            'currentUser',
            JSON.stringify({
              ...currentUser,
              profileIncomplete: false,
            })
          )
        }
      } catch {
        // ignore
      }

      setIsVisible(false)
      setTimeout(() => {
        if (onCompleted) onCompleted()
      }, 250)
    } catch (e) {
      console.error('Failed to save provider onboarding profile:', e)
      setError(e?.message || 'Failed to save your profile. Please try again.')
      setIsSaving(false)
    }
  }

  return (
    <div className={`pg-onboard-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`pg-onboard-content ${isVisible ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="pg-onboard-header">
          <div className="pg-onboard-badge">Provider setup</div>
          <h2 className="pg-onboard-title">Complete your professional profile</h2>
          <p className="pg-onboard-subtitle">
            To protect patients and ensure quality, providers who sign up with Google must complete these details before
            accessing the dashboard.
          </p>
        </div>

        {isLoading ? (
          <div className="pg-onboard-loading">Loading your profile…</div>
        ) : (
          <>
            {error && <div className="pg-onboard-error">{error}</div>}

            <div className="pg-onboard-readonly">
              <div className="pg-onboard-ro-item">
                <span className="pg-onboard-ro-label">Name</span>
                <span className="pg-onboard-ro-value">{providerName || '—'}</span>
              </div>
              <div className="pg-onboard-ro-item">
                <span className="pg-onboard-ro-label">Email</span>
                <span className="pg-onboard-ro-value">{providerEmail || '—'}</span>
              </div>
            </div>

            <div className="pg-onboard-grid">
              <div className="pg-onboard-field">
                <label>Phone number *</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91…" />
              </div>
              <div className="pg-onboard-field">
                <label>Professional title *</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="e.g., Yoga Therapist" />
              </div>
              <div className="pg-onboard-field full">
                <label>Specialization *</label>
                <input
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  placeholder="e.g., Meditation, Stress Management…"
                />
              </div>
              <div className="pg-onboard-field full">
                <label>Bio * <span className="muted">(min 20 chars)</span></label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Tell patients about your experience and approach…"
                />
              </div>
              <div className="pg-onboard-field">
                <label>Hourly rate (USD) *</label>
                <input
                  name="hourlyRate"
                  value={form.hourlyRate}
                  onChange={handleChange}
                  inputMode="decimal"
                  placeholder="e.g., 50"
                />
              </div>
            </div>

            <div className="pg-onboard-actions">
              <button className="pg-onboard-secondary" type="button" onClick={onSignOut}>
                Sign out
              </button>
              <button className="pg-onboard-primary" type="button" disabled={!canSave} onClick={handleSave}>
                {isSaving ? 'Saving…' : 'Save & continue'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ProviderGoogleOnboardingModal

