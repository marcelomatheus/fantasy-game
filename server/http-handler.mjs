import fs from 'node:fs';
import path from 'node:path';
import { TokenBucket, remoteAddress } from './ws-security.mjs';

const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2' };
const csp = "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://raw.githubusercontent.com; media-src 'self'; connect-src 'self' ws: wss:";

export const securityHeaders = (production = true) => ({
  'Content-Security-Policy': csp,
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  ...(production ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' } : {}),
});

export function createStaticHandler(dist, { production = true, trustProxy = false, requestsPerMinute = 300 } = {}) {
  const root = path.resolve(dist);
  const limits = new Map();
  const sweep = setInterval(() => { if (limits.size > 10_000) limits.clear(); }, 300_000); sweep.unref();
  return (req, res) => {
    const headers = securityHeaders(production);
    const ip = remoteAddress(req, trustProxy);
    let limiter = limits.get(ip); if (!limiter) { limiter = new TokenBucket(Math.max(30, requestsPerMinute / 2), requestsPerMinute / 60); limits.set(ip, limiter); }
    if (!limiter.take()) { res.writeHead(429, { ...headers, 'Content-Type':'text/plain; charset=utf-8', 'Retry-After':'1' }); res.end('Too many requests'); return; }
    if (req.url === '/healthz') { res.writeHead(200, { ...headers, 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' }); res.end('{"ok":true}'); return; }
    if (!['GET','HEAD'].includes(req.method || '')) { res.writeHead(405, { ...headers, Allow:'GET, HEAD' }); res.end(); return; }
    let url;
    try { url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`); } catch { res.writeHead(400, headers); res.end(); return; }
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400, headers); res.end(); return; }
    if (pathname.includes('\0') || pathname.includes('\\')) { res.writeHead(400, headers); res.end(); return; }
    const requested = path.resolve(root, `.${pathname}`);
    if (requested !== root && !requested.startsWith(root + path.sep)) { res.writeHead(403, headers); res.end(); return; }
    let target = requested;
    try { if (fs.statSync(target).isDirectory()) target = path.join(target, 'index.html'); }
    catch { target = path.extname(pathname) ? requested : path.join(root, 'index.html'); }
    if (target !== root && !target.startsWith(root + path.sep)) { res.writeHead(403, headers); res.end(); return; }
    try {
      const stat = fs.statSync(target); if (!stat.isFile()) throw new Error('Not a file');
      const ext = path.extname(target).toLowerCase();
      const cache = production ? (ext === '.html' ? 'no-cache' : 'public, max-age=86400') : 'no-store';
      res.writeHead(200, { ...headers, 'Content-Type':mime[ext] || 'application/octet-stream', 'Content-Length':stat.size, 'Cache-Control':cache });
      if (req.method === 'HEAD') res.end(); else fs.createReadStream(target).on('error', () => res.destroy()).pipe(res);
    } catch { res.writeHead(404, { ...headers, 'Content-Type':'text/plain; charset=utf-8' }); res.end('Not found'); }
  };
}
