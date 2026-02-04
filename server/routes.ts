import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { v4 as uuidv4 } from "uuid";

// ============================================================
// IN-MEMORY DATA STORAGE
// ============================================================

interface PendingCode {
  deviceId: string;
  expiresAt: number;
  pairId: string | null;
}

interface Pair {
  device1Id: string;
  device2Id: string;
  createdAt: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

// Pending pairing codes
const pendingCodes = new Map<string, PendingCode>();

// Active pairs
const pairs = new Map<string, Pair>();

// Messages per pair
const messages = new Map<string, Message[]>();

// Typing indicators: { pairId: { deviceId: timestamp } }
const typingIndicators = new Map<string, Record<string, number>>();

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function cleanupExpiredCodes(): void {
  const now = Date.now();
  for (const [code, data] of pendingCodes.entries()) {
    if (now > data.expiresAt) {
      pendingCodes.delete(code);
    }
  }
}

function isTyping(pairId: string, deviceId: string): boolean {
  const indicators = typingIndicators.get(pairId);
  if (!indicators) return false;

  const timestamp = indicators[deviceId];
  if (!timestamp) return false;

  return Date.now() - timestamp < 3000;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================================
  // API ENDPOINTS
  // ============================================================

  // Health Check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      activePairs: pairs.size,
      pendingCodes: pendingCodes.size,
    });
  });

  // Generate Pairing Code
  app.post("/api/pair/generate", (req: Request, res: Response) => {
    cleanupExpiredCodes();

    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: "Device ID required" });
    }

    // Check if device is already paired
    for (const [, pair] of pairs.entries()) {
      if (pair.device1Id === deviceId || pair.device2Id === deviceId) {
        return res.status(400).json({ error: "Device already paired" });
      }
    }

    // Generate unique code
    let code: string;
    let attempts = 0;
    do {
      code = generateCode();
      attempts++;
    } while (pendingCodes.has(code) && attempts < 100);

    if (attempts >= 100) {
      return res.status(500).json({ error: "Failed to generate unique code" });
    }

    // Code expires in 7 minutes
    const expiresAt = Date.now() + 7 * 60 * 1000;

    pendingCodes.set(code, {
      deviceId,
      expiresAt,
      pairId: null,
    });

    console.log(
      `[PAIR] Generated code ${code} for device ${deviceId.substring(0, 8)}...`
    );

    res.json({
      code,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  });

  // Join with Pairing Code
  app.post("/api/pair/join", (req: Request, res: Response) => {
    cleanupExpiredCodes();

    const { deviceId, code } = req.body;

    if (!deviceId || !code) {
      return res.status(400).json({ error: "Device ID and code required" });
    }

    // Check if device is already paired
    for (const [, pair] of pairs.entries()) {
      if (pair.device1Id === deviceId || pair.device2Id === deviceId) {
        return res.status(400).json({ error: "Device already paired" });
      }
    }

    // Find pending code
    const pendingCode = pendingCodes.get(code);

    if (!pendingCode) {
      return res.status(404).json({ error: "Invalid or expired code" });
    }

    // Check expiry
    if (Date.now() > pendingCode.expiresAt) {
      pendingCodes.delete(code);
      return res.status(400).json({ error: "Code expired" });
    }

    // Cannot pair with yourself
    if (pendingCode.deviceId === deviceId) {
      return res.status(400).json({ error: "Cannot pair with yourself" });
    }

    // Create permanent pair
    const pairId = uuidv4();

    pairs.set(pairId, {
      device1Id: pendingCode.deviceId,
      device2Id: deviceId,
      createdAt: new Date().toISOString(),
    });

    // Initialize empty message array for this pair
    messages.set(pairId, []);

    // Update pending code with pair ID (for status polling)
    pendingCode.pairId = pairId;

    console.log(
      `[PAIR] Devices paired: ${pendingCode.deviceId.substring(0, 8)}... <-> ${deviceId.substring(0, 8)}...`
    );

    // Clean up code after a short delay
    setTimeout(() => {
      pendingCodes.delete(code);
    }, 5000);

    res.json({
      pairId,
      deviceId,
      partnerDeviceId: pendingCode.deviceId,
    });
  });

  // Check Pairing Status
  app.get("/api/pair/status", (req: Request, res: Response) => {
    cleanupExpiredCodes();

    const { deviceId, code } = req.query;

    if (!deviceId || !code) {
      return res.status(400).json({ error: "Device ID and code required" });
    }

    const pendingCode = pendingCodes.get(code as string);

    if (!pendingCode) {
      return res.status(404).json({ error: "Code not found" });
    }

    // Verify ownership
    if (pendingCode.deviceId !== deviceId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Check if paired
    if (pendingCode.pairId) {
      const pair = pairs.get(pendingCode.pairId);
      if (pair) {
        return res.json({
          status: "paired",
          pairId: pendingCode.pairId,
          partnerDeviceId: pair.device2Id,
        });
      }
    }

    res.json({ status: "pending" });
  });

  // Send Message
  app.post("/api/send", (req: Request, res: Response) => {
    const { pairId, deviceId, content } = req.body;

    if (!pairId || !deviceId || !content) {
      return res
        .status(400)
        .json({ error: "Pair ID, device ID, and content required" });
    }

    // Verify pair exists and device is part of it
    const pair = pairs.get(pairId);
    if (!pair) {
      return res.status(404).json({ error: "Pair not found" });
    }

    if (pair.device1Id !== deviceId && pair.device2Id !== deviceId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Create message
    const message: Message = {
      id: uuidv4(),
      senderId: deviceId,
      content: content.substring(0, 1000),
      timestamp: new Date().toISOString(),
      read: false,
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
      timestamp: message.timestamp,
    });
  });

  // Poll Messages
  app.get("/api/poll", (req: Request, res: Response) => {
    const { pairId, deviceId } = req.query;

    if (!pairId || !deviceId) {
      return res.status(400).json({ error: "Pair ID and device ID required" });
    }

    // Verify pair exists and device is part of it
    const pair = pairs.get(pairId as string);
    if (!pair) {
      return res.status(404).json({ error: "Pair not found" });
    }

    if (pair.device1Id !== deviceId && pair.device2Id !== deviceId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Get partner device ID
    const partnerDeviceId =
      pair.device1Id === deviceId ? pair.device2Id : pair.device1Id;

    // Get messages
    const pairMessages = messages.get(pairId as string) || [];

    // Check if partner is typing
    const partnerTyping = isTyping(pairId as string, partnerDeviceId);

    res.json({
      messages: pairMessages,
      partnerTyping,
    });
  });

  // Typing Indicator
  app.post("/api/typing", (req: Request, res: Response) => {
    const { pairId, deviceId, isTyping: typing } = req.body;

    if (!pairId || !deviceId) {
      return res.status(400).json({ error: "Pair ID and device ID required" });
    }

    // Verify pair exists and device is part of it
    const pair = pairs.get(pairId);
    if (!pair) {
      return res.status(404).json({ error: "Pair not found" });
    }

    if (pair.device1Id !== deviceId && pair.device2Id !== deviceId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Update typing indicator
    let indicators = typingIndicators.get(pairId);
    if (!indicators) {
      indicators = {};
      typingIndicators.set(pairId, indicators);
    }

    if (typing) {
      indicators[deviceId] = Date.now();
    } else {
      delete indicators[deviceId];
    }

    res.json({ success: true });
  });

  // Mark Messages as Read
  app.post("/api/read", (req: Request, res: Response) => {
    const { pairId, deviceId, messageIds } = req.body;

    if (!pairId || !deviceId || !messageIds || !Array.isArray(messageIds)) {
      return res
        .status(400)
        .json({ error: "Pair ID, device ID, and message IDs required" });
    }

    // Verify pair exists and device is part of it
    const pair = pairs.get(pairId);
    if (!pair) {
      return res.status(404).json({ error: "Pair not found" });
    }

    if (pair.device1Id !== deviceId && pair.device2Id !== deviceId) {
      return res.status(403).json({ error: "Not authorized" });
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

  // Clear Chat
  app.post("/api/clear", (req: Request, res: Response) => {
    const { pairId, deviceId } = req.body;

    if (!pairId || !deviceId) {
      return res.status(400).json({ error: "Pair ID and device ID required" });
    }

    // Verify pair exists and device is part of it
    const pair = pairs.get(pairId);
    if (!pair) {
      return res.status(404).json({ error: "Pair not found" });
    }

    if (pair.device1Id !== deviceId && pair.device2Id !== deviceId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Clear messages
    messages.set(pairId, []);

    console.log(`[CHAT] Messages cleared for pair ${pairId.substring(0, 8)}...`);

    res.json({ success: true });
  });

  const httpServer = createServer(app);

  return httpServer;
}
