/**
 * Extracts password from phone number by removing country code
 * Used for Supabase authentication with phone-based passwords
 */
export const getPasswordFromPhone = (phone: string): string => {
  // Remove common country codes and return stripped number
  return phone.replace(/^\+?\d{1,4}/, '')
}