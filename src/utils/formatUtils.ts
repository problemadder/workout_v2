/**
 * Formats a number to have at most 1 decimal place.
 * Returns integers without decimal points.
 * @param value - The number to format
 * @returns The formatted number
 */
export function formatSingleDecimal(value: number): number {
  // Round to 1 decimal place
  const rounded = Math.round(value * 10) / 10;
  
  // If it's a whole number, return as is (will display without decimal)
  // Otherwise return with 1 decimal place
  return rounded;
}
