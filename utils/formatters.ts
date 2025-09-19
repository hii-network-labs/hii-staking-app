/**
 * Format a number string to display with proper truncation and formatting
 */
export function formatNumber(value: string | number, options?: {
  maxDecimals?: number;
  minDecimals?: number;
  showFullOnHover?: boolean;
  compact?: boolean;
}): string {
  const {
    maxDecimals = 2,
    minDecimals = 0,
    compact = false
  } = options || {};

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0.00';

  // For very large numbers, use compact notation
  if (compact && numValue >= 1000000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    }).format(numValue);
  }

  // For all numbers, format with specified decimals
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(numValue);
}

/**
 * Format HII amounts with appropriate precision
 */
export function formatHII(value: string | number, options?: {
  showSymbol?: boolean;
  maxDecimals?: number;
  compact?: boolean;
}): string {
  const {
    showSymbol = false,
    maxDecimals = 2,
    compact = false
  } = options || {};

  const formatted = formatNumber(value, { maxDecimals, compact, minDecimals: 2 });
  return showSymbol ? `${formatted} HII` : formatted;
}

/**
 * @deprecated Use formatHII instead
 * Format BNB amounts with appropriate precision (kept for backward compatibility)
 */
export function formatBNB(value: string | number, options?: {
  showSymbol?: boolean;
  maxDecimals?: number;
  compact?: boolean;
}): string {
  return formatHII(value, options);
}

/**
 * Format shares with appropriate precision
 */
export function formatShares(value: string | number, options?: {
  maxDecimals?: number;
  compact?: boolean;
}): string {
  const { maxDecimals = 2, compact = false } = options || {};
  return formatNumber(value, { maxDecimals, compact, minDecimals: 2 });
}

/**
 * Format exchange rate with consistent precision
 */
export function formatExchangeRate(value: string | number): string {
  return formatNumber(value, { maxDecimals: 2, minDecimals: 2 });
}

/**
 * Truncate long text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 20): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}