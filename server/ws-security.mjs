import crypto from 'node:crypto';

const decoder = new TextDecoder('utf-8', { fatal: true });

export class TokenBucket {
  constructor(capacity, refillPerSecond) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillPerMs = refillPerSecond / 1000;
    this.updatedAt = Date.now();
  }
  take(cost = 1) {
    const stamp = Date.now();
    this.tokens = Math.min(this.capacity, this.tokens + (stamp - this.updatedAt) * this.refillPerMs);
    this.updatedAt = stamp;
    if (this.tokens < cost) return false;
    this.tokens -= cost;
    return true;
  }
}

export const remoteAddress = (request, trustProxy = false) => {
  const forwarded = trustProxy ? String(request.headers['x-forwarded-for'] || '').split(',')[0].trim() : '';
  return (forwarded || request.socket.remoteAddress || 'unknown').replace(/^::ffff:/, '');
};

export const isAllowedOrigin = (request, allowedOrigins, allowMissingOrigin = false, trustProxy = false) => {
  const origin = request.headers.origin;
  if (!origin) return allowMissingOrigin;
  try {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    if (allowedOrigins.size) return allowedOrigins.has(parsed.origin);
    const host = String((trustProxy && request.headers['x-forwarded-host']) || request.headers.host || '').split(',')[0].trim().toLowerCase();
    return parsed.host.toLowerCase() === host;
  } catch {
    return false;
  }
};

const closePayload = (code, reason) => {
  const text = Buffer.from(String(reason).slice(0, 80));
  const payload = Buffer.alloc(2 + text.length);
  payload.writeUInt16BE(code, 0);
  text.copy(payload, 2);
  return payload;
};

export class SecureWsPeer {
  constructor(socket, onMessage, onClose, { maxPayloadBytes = 4096, messageBurst = 150, messagesPerSecond = 90 } = {}) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.closed = false;
    this.closeNotified = false;
    this.maxPayloadBytes = maxPayloadBytes;
    this.limiter = new TokenBucket(messageBurst, messagesPerSecond);
    this.lastPongAt = Date.now();
    this.lastPingAt = 0;
    socket.setNoDelay(true);
    socket.setKeepAlive(true, 30_000);
    socket.on('data', chunk => this.feed(chunk, onMessage));
    socket.on('close', () => {
      this.closed = true;
      if (!this.closeNotified) { this.closeNotified = true; onClose(); }
    });
    socket.on('error', () => socket.destroy());
  }

  frame(opcode, payload = Buffer.alloc(0)) {
    let header;
    if (payload.length < 126) header = Buffer.from([0x80 | opcode, payload.length]);
    else if (payload.length < 65536) { header = Buffer.alloc(4); header[0] = 0x80 | opcode; header[1] = 126; header.writeUInt16BE(payload.length, 2); }
    else { header = Buffer.alloc(10); header[0] = 0x80 | opcode; header[1] = 127; header.writeBigUInt64BE(BigInt(payload.length), 2); }
    return Buffer.concat([header, payload]);
  }

  send(value) {
    if (this.closed || this.socket.destroyed) return;
    if (this.socket.writableLength > 1_048_576) { this.close(1009, 'Backpressure limit'); return; }
    const payload = Buffer.from(JSON.stringify(value));
    if (payload.length > 65_535) { this.close(1009, 'Server message too large'); return; }
    this.socket.write(this.frame(0x1, payload));
  }
  ping() { if (!this.closed) this.socket.write(this.frame(0x9)); }
  pong(payload) { if (!this.closed) this.socket.write(this.frame(0xa, payload)); }
  close(code = 1000, reason = '') {
    if (this.closed) return;
    this.closed = true;
    try { this.socket.end(this.frame(0x8, closePayload(code, reason))); } catch { this.socket.destroy(); }
  }
  fail(code, reason) { this.close(code, reason); }

  feed(chunk, onMessage) {
    if (this.closed) return;
    if (this.buffer.length + chunk.length > this.maxPayloadBytes + 32) { this.fail(1009, 'Payload too large'); return; }
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (!this.closed && this.buffer.length >= 2) {
      const b0 = this.buffer[0], b1 = this.buffer[1];
      const fin = (b0 & 0x80) !== 0, rsv = b0 & 0x70, opcode = b0 & 0x0f, masked = (b1 & 0x80) !== 0;
      if (!fin || rsv || !masked || ![0x1, 0x8, 0x9, 0xa].includes(opcode)) { this.fail(1002, 'Invalid frame'); return; }
      let length = b1 & 0x7f, offset = 2;
      if (length === 126) { if (this.buffer.length < 4) return; length = this.buffer.readUInt16BE(2); offset = 4; }
      else if (length === 127) {
        if (this.buffer.length < 10) return;
        const large = this.buffer.readBigUInt64BE(2);
        if (large > BigInt(this.maxPayloadBytes)) { this.fail(1009, 'Payload too large'); return; }
        length = Number(large); offset = 10;
      }
      if (length > this.maxPayloadBytes || ((opcode & 0x8) && length > 125)) { this.fail(1009, 'Payload too large'); return; }
      if (this.buffer.length < offset + 4 + length) return;
      const mask = this.buffer.subarray(offset, offset + 4); offset += 4;
      const payload = Buffer.from(this.buffer.subarray(offset, offset + length));
      this.buffer = this.buffer.subarray(offset + length);
      for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4];
      if (opcode === 0x8) { this.close(); return; }
      if (opcode === 0x9) { this.pong(payload); continue; }
      if (opcode === 0xa) { this.lastPongAt = Date.now(); continue; }
      if (!this.limiter.take()) { this.fail(1008, 'Rate limit exceeded'); return; }
      try {
        const value = JSON.parse(decoder.decode(payload));
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid message');
        onMessage(value);
      } catch { this.fail(1007, 'Invalid JSON'); return; }
    }
  }
}

export const validWebSocketKey = value => {
  if (typeof value !== 'string') return false;
  try { return Buffer.from(value, 'base64').length === 16 && /^[A-Za-z0-9+/]{22}==$/.test(value); } catch { return false; }
};

export const websocketAccept = key => crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
