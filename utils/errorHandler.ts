/**
 * Utility function to format error messages for better user experience
 * Handles common blockchain transaction errors with user-friendly messages
 */
export function formatErrorMessage(error: Error | unknown): string {
  if (!error) return 'An unknown error occurred';
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();
  
  // User rejected transaction
  if (lowerMessage.includes('user rejected') || 
      lowerMessage.includes('user denied') ||
      lowerMessage.includes('user cancelled') ||
      lowerMessage.includes('rejected by user') ||
      lowerMessage.includes('user canceled') ||
      lowerMessage.includes('transaction was rejected')) {
    return 'User denied transaction signature';
  }
  
  // Insufficient funds
  if (lowerMessage.includes('insufficient funds') ||
      lowerMessage.includes('insufficient balance')) {
    return 'Insufficient funds for transaction';
  }
  
  // Gas related errors
  if (lowerMessage.includes('gas') && lowerMessage.includes('too low')) {
    return 'Gas price too low, please try again';
  }
  
  if (lowerMessage.includes('out of gas')) {
    return 'Transaction ran out of gas';
  }
  
  // Network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
    return 'Network connection error, please try again';
  }
  
  // Contract errors
  if (lowerMessage.includes('execution reverted')) {
    return 'Transaction failed - contract execution reverted';
  }
  
  // Nonce errors
  if (lowerMessage.includes('nonce')) {
    return 'Transaction nonce error, please try again';
  }
  
  // Default: return original message but truncated if too long
  if (errorMessage.length > 100) {
    return errorMessage.substring(0, 97) + '...';
  }
  
  return errorMessage;
}