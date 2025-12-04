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
  
  console.log('Generating temp token:', {
    tokenLength: token.length,
    tokenPreview: token.substring(0, 20) + '...',
    expiresAt: new Date(expiresAt).toISOString(),
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : []
  });
  
  tempTokenStore.set(token, { data, expiresAt });
  
  console.log('Temp token stored. Store size:', tempTokenStore.size);
  
  // Clean up expired tokens
  setTimeout(() => {
    tempTokenStore.delete(token);
  }, TOKEN_EXPIRY);
  
  return token;
}

export function exchangeTempToken(token: string): any | null {
  console.log('Attempting to exchange token:', {
    tokenLength: token.length,
    tokenPreview: token.substring(0, 20) + '...',
    tokenFull: token, // Log full token for debugging
    storeSize: tempTokenStore.size,
    currentTime: new Date().toISOString()
  });
  
  // Log all tokens in store for debugging
  if (tempTokenStore.size > 0) {
    const storeKeys = Array.from(tempTokenStore.keys());
    console.log('Tokens in store:', {
      count: storeKeys.length,
      keys: storeKeys.map(k => ({
        preview: k.substring(0, 20) + '...',
        full: k,
        length: k.length
      }))
    });
    
    // Check if any token matches (case-sensitive)
    const exactMatch = tempTokenStore.has(token);
    console.log('Exact token match found:', exactMatch);
    
    // Check for similar tokens (in case of encoding issues)
    const similarTokens = storeKeys.filter(k => k.substring(0, 20) === token.substring(0, 20));
    if (similarTokens.length > 0) {
      console.log('Found similar tokens (first 20 chars match):', similarTokens.length);
      similarTokens.forEach(similar => {
        console.log('Similar token:', {
          stored: similar.substring(0, 40) + '...',
          received: token.substring(0, 40) + '...',
          match: similar === token
        });
      });
    }
  } else {
    console.log('Token store is empty! This might mean the server restarted or tokens were cleared.');
  }
  
  const stored = tempTokenStore.get(token);
  
  if (!stored) {
    // Check if token was recently consumed (duplicate request handling)
    const consumed = consumedTokens.get(token);
    if (consumed) {
      const timeSinceConsumed = Date.now() - consumed.consumedAt;
      if (timeSinceConsumed < CONSUMED_TOKEN_RETENTION) {
        console.log('Token was recently consumed (likely duplicate request), returning consumed data');
        console.log('Time since consumed:', timeSinceConsumed, 'ms');
        return consumed.data; // Return the data from the consumed token
      } else {
        // Clean up old consumed token
        consumedTokens.delete(token);
      }
    }
    
    console.error('Token not found in store');
    console.error('Received token:', token);
    console.error('Token store contents:', Array.from(tempTokenStore.entries()).map(([k, v]) => ({
      key: k,
      keyLength: k.length,
      expiresAt: new Date(v.expiresAt).toISOString()
    })));
    return null; // Token not found
  }
  
  console.log('Token found, checking expiry:', {
    expiresAt: new Date(stored.expiresAt).toISOString(),
    currentTime: new Date().toISOString(),
    isExpired: Date.now() > stored.expiresAt,
    timeUntilExpiry: stored.expiresAt - Date.now()
  });
  
  if (Date.now() > stored.expiresAt) {
    console.error('Token expired');
    tempTokenStore.delete(token);
    return null; // Token expired
  }
  
  console.log('Token valid, returning data');
  
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

