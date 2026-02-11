/**
 * Default 2D avatar URLs by gender (DiceBear Personas API)
 * Used when provider has not uploaded a profile photo
 */
const DEFAULT_AVATAR_BY_GENDER = {
  male: 'https://api.dicebear.com/8.x/personas/svg?seed=male',
  female: 'https://api.dicebear.com/8.x/personas/svg?seed=female',
  other: 'https://api.dicebear.com/8.x/personas/svg?seed=person',
}

/**
 * Get default avatar URL for a provider based on gender
 * @param {string|null} gender - male, female, or other
 * @returns {string} Avatar URL
 */
export function getDefaultAvatarUrl(gender) {
  if (gender && DEFAULT_AVATAR_BY_GENDER[gender]) return DEFAULT_AVATAR_BY_GENDER[gender]
  return DEFAULT_AVATAR_BY_GENDER.other
}

/**
 * Get display avatar for a provider: use profilePhoto if set, else default by gender
 * @param {string|null} profilePhoto - Provider's uploaded photo (base64 or URL)
 * @param {string|null} gender - male, female, or other
 * @returns {string} Avatar URL or data URL
 */
export function getProviderAvatarUrl(profilePhoto, gender) {
  if (profilePhoto) return profilePhoto
  return getDefaultAvatarUrl(gender)
}

/**
 * Get display avatar for a user: use profilePhoto if set, else default by gender
 * @param {string|null} profilePhoto - User's uploaded photo (base64 or URL)
 * @param {string|null} gender - male, female, or other
 * @returns {string} Avatar URL or data URL
 */
export function getUserAvatarUrl(profilePhoto, gender) {
  try {
    if (profilePhoto && typeof profilePhoto === 'string' && profilePhoto.trim()) {
      return profilePhoto
    }
    return getDefaultAvatarUrl(gender)
  } catch (error) {
    console.error('Error getting user avatar URL:', error)
    return getDefaultAvatarUrl('other')
  }
}
