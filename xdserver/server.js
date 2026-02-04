/**
 * Hidden Calculator Chat - Backend Server
 * 
 * A lightweight Express server for secure paired messaging.
 * Designed for Railway deployment with in-memory storage.
 * 
 * Endpoints:
 * - GET /api/health - Health check
 * - POST /api/pair/generate - Generate a 4-digit pairing code
 * - POST /api/pair/join - Join with a pairing code
 * - GET /api/pair/status - Check pairing status
 * - POST /api/send - Send a message
 * - GET /api/poll - Poll for messages
 * - POST /api/typing - Send typing indicator
 * - POST /api/read - Mark messages as read
 * - POST /api/clear - Clear chat messages
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================
// IN-MEMORY DATA STORAGE
// ============================================================

// Pending pairing codes: { code: { deviceId, expiresAt, pairId? } }
const pendingCodes = new Map();

// Active pairs: { pairId: { device1Id, device2Id, createdAt } }
const pairs = new Map();

// Messages: { pairId: [{ id, senderId, content, timestamp, read }] }
const messages = new Map();

// Typing indicators: { pairId: { deviceId: timestamp } }
const typingIndicators = new Map();

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Generate a random 4-digit code
 */
function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Clean up expired codes (called on each request)
 */
function cleanupExpiredCodes() {
  const now = Date.now();
  for (const [code, data] of pendingCodes.entries()) {
    if (now > data.expiresAt) {
      pendingCodes.delete(code);
    }
  }
}

/**
 * Check if typing indicator is active (within last 3 seconds)
 */
function isTyping(pairId, deviceId) {
  const indicators = typingIndicators.get(pairId);
  if (!indicators) return false;
  
  const timestamp = indicators[deviceId];
  if (!timestamp) return false;
  
  return Date.now() - timestamp < 3000;
}

// ============================================================
// API ENDPOINTS
// ============================================================

/**
 * Health Check
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activePairs: pairs.size,
    pendingCodes: pendingCodes.size
  });
});

/**
 * Generate Pairing Code
 * 
 * Creates a new 4-digit code that expires in 7 minutes.
 * Associates the code with the requesting device.
 */
app.post('/api/pair/generate', (req, res) => {
  cleanupExpiredCodes();
  
  const { deviceId } = req.body;
  
  if (!deviceId) {
    return res.status(400).json({ error: 'Device ID required' });
  }
  
  // Check if device is already paired
  for (const [pairId, pair] of pairs.entries()) {
    if (pair.device1Id === deviceId || pair.device2Id === deviceId) {
      return res.status(400).json({ error: 'Device already paired' });
    }
  }
  
  // Generate unique code
  let code;
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
  } while (pendingCodes.has(code) && attempts < 100);
  
  if (attempts >= 100) {
    return res.status(500).json({ error: 'Failed to generate unique code' });
  }
  
  // Code expires in 7 minutes
  const expiresAt = Date.now() + 7 * 60 * 1000;
  
  pendingCodes.set(code, {
    deviceId,
    expiresAt,
    pairId: null
  });
  
  console.log(`[PAIR] Generated code ${code} for device ${deviceId.substring(0, 8)}...`);
  
  res.json({
    code,
    expiresAt: new Date(expiresAt).toISOString()
  });
});

/**
 * Join with Pairing Code
 * 
 * Second device enters the code to complete pairing.
 * Creates a permanent pair between the two devices.
 */
app.post('/api/pair/join', (req, res) => {
  cleanupExpiredCodes();
  
  const { deviceId, code } = req.body;
  
  if (!deviceId || !code) {
    return res.status(400).json({ error: 'Device ID and code required' });
  }
  
  // Check if device is already paired
  for (const [pairId, pair] of pairs.entries()) {
    if (pair.device1Id === deviceId || pair.device2Id === deviceId) {
      return res.status(400).json({ error: 'Device already paired' });
    }
  }
  
  // Find pending code
  const pendingCode = pendingCodes.get(code);
  
  if (!pendingCode) {
    return res.status(404).json({ error: 'Invalid or expired code' });
  }
  
  // Check expiry
  if (Date.now() > pendingCode.expiresAt) {
    pendingCodes.delete(code);
    return res.status(400).json({ error: 'Code expired' });
  }
  
  // Cannot pair with yourself
  if (pendingCode.deviceId === deviceId) {
    return res.status(400).json({ error: 'Cannot pair with yourself' });
  }
  
  // Create permanent pair
  const pairId = uuidv4();
  
  pairs.set(pairId, {
    device1Id: pendingCode.deviceId,
    device2Id: deviceId,
    createdAt: new Date().toISOString()
  });
  
  // Initialize empty message array for this pair
  messages.set(pairId, []);
  
  // Update pending code with pair ID (for status polling)
  pendingCode.pairId = pairId;
  
  console.log(`[PAIR] Devices paired: ${pendingCode.deviceId.substring(0, 8)}... <-> ${deviceId.substring(0, 8)}...`);
  
  // Clean up code after a short delay (allow status check to see paired state)
  setTimeout(() => {
    pendingCodes.delete(code);
  }, 5000);
  
  res.json({
    pairId,
    deviceId,
    partnerDeviceId: pendingCode.deviceId
  });
});

/**
 * Check Pairing Status
 * 
 * Called by code generator to check if partner joined.
 */
app.get('/api/pair/status', (req, res) => {
  cleanupExpiredCodes();
  
  const { deviceId, code } = req.query;
  
  if (!deviceId || !code) {
    return res.status(400).json({ error: 'Device ID and code required' });
  }
  
  const pendingCode = pendingCodes.get(code);
  
  if (!pendingCode) {
    return res.status(404).json({ error: 'Code not found' });
  }
  
  // Verify ownership
  if (pendingCode.deviceId !== deviceId) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  // Check if paired
  if (pendingCode.pairId) {
    const pair = pairs.get(pendingCode.pairId);
    if (pair) {
      return res.json({
        status: 'paired',
        pairId: pendingCode.pairId,
        partnerDeviceId: pair.device2Id
      });
    }
  }
  
  res.json({ status: 'pending' });
});

/**
 * Send Message
 * 
 * Send a message to the paired partner.
 */
app.post('/api/send', (req, res) => {
  const { pairId, deviceId, content } = req.body;
  
  if (!pairId || !deviceId || !content) {
    return res.status(400).json({ error: 'Pair ID, device ID, and content required' });
  }
  
  // Verify pair exists and device is part of it
  const pair = pairs.get(pairId);
  if (!pair) {
    return res.status(404).json({ error: 'Pair not found' });
  }
  
  if (pair.device1Id !== deviceId && pair.device2Id !== deviceId) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  // Create message
  const message = {
    id: uuidv4(),
    senderId: deviceId,
    content: content.substring(0, 1000), // Limit message length
    timestamp: new Date().toISOString(),
    read: false
  };
  
  // Add to messages
  let pairMessages = messages.get(pairId);
  if (!pairMessages) {
    pairMessages = [];
    messages.set(pairId, pairMessages);
  }
  
  pairMessages.push(message);
  
  // Keep only last 500 messages per pair
  if (pairMessages.length > 500) {
    pairMessages.splice(0, pairMessages.length - 500);
  }
  
  console.log(`[MSG] Message sent in pair ${pairId.substring(0, 8)}...`);
  
  res.json({
    messageId: message.id,
    timestamp: message.timestamp
  });
});

/**
 * Poll Messages
 * 
 * Get all messages for a pair and partner's typing status.
 */
app.get('/api/poll', (req, res) => {
  const { pairId, deviceId } = req.query;
  
  if (!pairId || !deviceId) {
    return res.status(400).json({ error: 'Pair ID and device ID required' });
  }
  
  // Verify pair exists and device is part of it
  const pair = pairs.get(pairId);
  if (!pair) {
    return res.status(404).json({ error: 'Pair not found' });
  }
  
  if (pair.device1Id !== deviceId && pair.device2Id !== deviceId) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  // Get partner device ID
  const partnerDeviceId = pair.device1Id === deviceId ? pair.device2Id : pair.device1Id;
  
  // Get messages
  const pairMessages = messages.get(pairId) || [];
  
  // Check if partner is typing
  const partnerTyping = isTyping(pairId, partnerDeviceId);
  
  res.json({
    messages: pairMessages,
    partnerTyping
  });
});

/**
 * Typing Indicator
 * 
 * Update typing status for a device.
 */
app.post('/api/typing', (req, res) => {
  const { pairId, deviceId, isTyping } = req.body;
  
  if (!pairId || !deviceId) {
    return res.status(400).json({ error: 'Pair ID and device ID required' });
  }
  
  // Verify pair exists and device is part of it
  const pair = pairs.get(pairId);
  if (!pair) {
    return res.status(404).json({ error: 'Pair not found' });
  }
  
  if (pair.device1Id !== deviceId && pair.device2Id !== deviceId) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  // Update typing indicator
  let indicators = typingIndicators.get(pairId);
  if (!indicators) {
    indicators = {};
    typingIndicators.set(pairId, indicators);
  }
  
  if (isTyping) {
    indicators[deviceId] = Date.now();
  } else {
    delete indicators[deviceId];
  }
  
  res.json({ success: true });
});

/**
 * Mark Messages as Read
 * 
 * Mark specified messages as read.
 */
app.post('/api/read', (req, res) => {
  const { pairId, deviceId, messageIds } = req.body;
  
  if (!pairId || !deviceId || !messageIds || !Array.isArray(messageIds)) {
    return res.status(400).json({ error: 'Pair ID, device ID, and message IDs required' });
  }
  
  // Verify pair exists and device is part of it
  const pair = pairs.get(pairId);
  if (!pair) {
    return res.status(404).json({ error: 'Pair not found' });
  }
  
  if (pair.device1Id !== deviceId && pair.device2Id !== deviceId) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  // Mark messages as read
  const pairMessages = messages.get(pairId) || [];
  const messageIdSet = new Set(messageIds);
  
  for (const message of pairMessages) {
    if (messageIdSet.has(message.id) && message.senderId !== deviceId) {
      message.read = true;
    }
  }
  
  res.json({ success: true });
});

/**
 * Clear Chat
 * 
 * Permanently delete all messages for a pair.
 */
app.post('/api/clear', (req, res) => {
  const { pairId, deviceId } = req.body;
  
  if (!pairId || !deviceId) {
    return res.status(400).json({ error: 'Pair ID and device ID required' });
  }
  
  // Verify pair exists and device is part of it
  const pair = pairs.get(pairId);
  if (!pair) {
    return res.status(404).json({ error: 'Pair not found' });
  }
  
  if (pair.device1Id !== deviceId && pair.device2Id !== deviceId) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  // Clear messages
  messages.set(pairId, []);
  
  console.log(`[CHAT] Messages cleared for pair ${pairId.substring(0, 8)}...`);
  
  res.json({ success: true });
});

// ============================================================
// ERROR HANDLING
// ============================================================

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================
// SERVER STARTUP
// ============================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Hidden Calculator Chat backend running on port ${PORT}`);
  console.log(`[SERVER] Health check: http://localhost:${PORT}/api/health`);
});
