import React from 'react'
import { useTheme } from '../contexts/ThemeContext'
import CryptoBackground3D from './CryptoBackground3D'
import LightThemeBackground from './LightThemeBackground'

/**
 * Renders theme-specific premium background: LightThemeBackground (light), CryptoBackground3D (dark).
 */
export default function ThemeAwareBackground() {
  const { theme } = useTheme()
  if (theme === 'dark') return <CryptoBackground3D />
  if (theme === 'light') return <LightThemeBackground />
  return null
}
