import crypto from 'crypto';

// In-memory store
const tempTokenStore = new Map<string, { data: any; expiresAt: number }>();
// Track recently consumed tokens (to handle duplicate requests from React Strict Mode)
const consumedTokens = new Map<string, { data: any; consumedAt: number }>();
const CONSUMED_TOKEN_RETENTION = 60 * 1000; // Keep consumed tokens for 1 minute

const TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes (increased for OAuth flow to handle server restarts)

export function generateTempToken(data: any): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + TOKEN_EXPIRY;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Generating temp token:', {
      tokenLength: token.length,
      expiresAt: new Date(expiresAt).toISOString(),
      hasData: !!data,
    });
  }
  
  tempTokenStore.set(token, { data, expiresAt });
  
  // Clean up expired tokens
  setTimeout(() => {
    tempTokenStore.delete(token);
  }, TOKEN_EXPIRY);
  
  return token;
}

export function exchangeTempToken(token: string): any | null {
  if (process.env.NODE_ENV === 'development') {
    console.log('Attempting to exchange token:', {
      tokenLength: token.length,
      storeSize: tempTokenStore.size,
    });
  }
  
  const stored = tempTokenStore.get(token);
  
  if (!stored) {
    // Check if token was recently consumed (duplicate request handling)
    const consumed = consumedTokens.get(token);
    if (consumed) {
      const timeSinceConsumed = Date.now() - consumed.consumedAt;
      if (timeSinceConsumed < CONSUMED_TOKEN_RETENTION) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Token was recently consumed (likely duplicate request), returning consumed data');
        }
        return consumed.data; // Return the data from the consumed token
      } else {
        // Clean up old consumed token
        consumedTokens.delete(token);
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Token not found in store');
    }
    return null; // Token not found
  }
  
  if (Date.now() > stored.expiresAt) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Token expired');
    }
    tempTokenStore.delete(token);
    return null; // Token expired
  }
  
  // Store consumed token data before deleting (to handle duplicate requests)
  consumedTokens.set(token, {
    data: stored.data,
    consumedAt: Date.now()
  });
  
  // Clean up consumed token after retention period
  setTimeout(() => {
    consumedTokens.delete(token);
  }, CONSUMED_TOKEN_RETENTION);
  
  // Delete token after use (one-time use)
  tempTokenStore.delete(token);
  
  return stored.data;
}

// Export function to get store size for debugging
export function getTempTokenStoreSize(): number {
  return tempTokenStore.size;
}

