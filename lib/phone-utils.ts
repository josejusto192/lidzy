/**
 * Normalizes a phone number by removing all non-digit characters
 * and ensuring it has a country code
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return ""

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "")

  // If the number has 12+ digits, it likely already has a country code
  if (cleaned.length >= 12) {
    return cleaned
  }

  // If it's 10-11 digits (Brazilian local number), add country code 55
  if (cleaned.length >= 10 && cleaned.length <= 11) {
    return `55${cleaned}`
  }

  // Return as-is if it doesn't match expected patterns
  return cleaned
}

/**
 * Generates phone number variations to handle Brazilian 9th digit
 * For numbers like 557191266087 (12 digits), also tries 5571991266087 (13 digits)
 * For numbers like 5571991266087 (13 digits), also tries 557191266087 (12 digits)
 */
export function getPhoneVariations(phone: string): string[] {
  const normalized = normalizePhoneNumber(phone)
  const variations = [normalized]

  // Handle Brazilian mobile numbers with/without 9th digit
  // Format: 55 (country) + 2 digits (area code) + 8-9 digits (number)
  if (normalized.startsWith("55") && normalized.length >= 12) {
    const countryCode = normalized.slice(0, 2) // "55"
    const areaCode = normalized.slice(2, 4) // e.g., "71"
    const number = normalized.slice(4) // e.g., "91266087" or "991266087"

    // If number has 8 digits, try adding 9 at the start
    if (number.length === 8) {
      variations.push(`${countryCode}${areaCode}9${number}`)
    }
    // If number has 9 digits and starts with 9, try removing it
    else if (number.length === 9 && number.startsWith("9")) {
      variations.push(`${countryCode}${areaCode}${number.slice(1)}`)
    }
  }

  return variations
}

/**
 * Compares two phone numbers considering Brazilian 9th digit variations
 * This is the only comparison function needed - it handles all cases
 */
export function phoneNumbersMatch(phone1: string, phone2: string): boolean {
  const variations1 = getPhoneVariations(phone1)
  const variations2 = getPhoneVariations(phone2)

  // Check if any variation of phone1 matches any variation of phone2
  return variations1.some((v1) => variations2.includes(v1))
}
