/**
 * Escapes HTML entities in a string to prevent XSS attacks
 * when inserting user-controlled data into HTML templates.
 * 
 * @param text - The text to escape
 * @returns The escaped text safe for HTML insertion
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Escapes HTML in an array of strings and joins them with a separator
 * 
 * @param arr - Array of strings to escape
 * @param separator - The separator to join with (default: ', ')
 * @returns The escaped and joined string
 */
export function escapeHtmlArray(arr: (string | null | undefined)[] | null | undefined, separator: string = ', '): string {
  if (!arr || arr.length === 0) return '';
  return arr.filter(Boolean).map(item => escapeHtml(item)).join(separator);
}

/**
 * Escapes HTML in a number array and joins them with a separator
 * 
 * @param arr - Array of numbers to escape
 * @param separator - The separator to join with (default: ', ')
 * @returns The escaped and joined string
 */
export function escapeNumberArray(arr: number[] | null | undefined, separator: string = ', '): string {
  if (!arr || arr.length === 0) return '';
  return arr.map(n => String(n)).join(separator);
}
