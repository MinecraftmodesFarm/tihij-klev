'use strict';
/* Тихий клёв — онлайн-сервер (Express + Socket.IO) для Render Web Service */
const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT) || 10000;               // Render передаёт PORT сам
const MAX_PLAYERS = Number(process.env.MAX_PLAYERS) || 100;
const ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim()).filter(Boolean);
const ANY = ORIGINS.includes('*');

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {                                  // CORS для обычных HTTP-запросов
  const o = req.headers.origin;
  if (o && (ANY || ORIGINS.includes(o))) { res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary', 'Origin'); }
  next();
});
const players = new Map();                                     // socket.id -> { id, p, t, tc, ta }
app.get('/health', (req, res) => res.json({ ok: true, online: players.size, uptime: Math.round(process.uptime()) }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '5m' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ANY ? true : ORIGINS, methods: ['GET', 'POST'] },   // CORS для Socket.IO
  pingInterval: 10000, pingTimeout: 15000, maxHttpBufferSize: 1e4
});

const STATES = new Set(['idle', 'charge', 'cast', 'wait', 'bite', 'fight', 'catch']);
const NULLABLE = new Set(['bx', 'by', 'bz', 'dp']);
const NUM = [['c', 0, 360], ['l', 0, 2], ['x', -400, 400], ['z', -400, 400], ['b', -100, 100], ['bx', -400, 400], ['by', -5, 40], ['bz', -400, 400], ['dp', 0, 1]];
const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, n);
function clean(d) {                                            // проверка и ограничение всех входящих полей
  const o = {};
  if (!d || typeof d !== 'object') return o;
  if ('n' in d) { const n = str(d.n, 16); if (n) o.n = n; }
  if ('k' in d) { const k = str(d.k, 2).toUpperCase(); if (/^[A-Z]{2}$/.test(k)) o.k = k; }
  for (const [k, a, b] of NUM) {
    if (!(k in d)) continue;
    if (d[k] === null && NULLABLE.has(k)) { o[k] = null; continue; }
    const v = Number(d[k]);
    if (Number.isFinite(v)) o[k] = k === 'l' ? Math.round(Math.min(b, Math.max(a, v))) : Math.min(b, Math.max(a, v));
  }
  if (typeof d.s === 'string' && STATES.has(d.s)) o.s = d.s;
  return o;
}
function merge(base, patch) { for (const k in patch) { if (patch[k] === null) delete base[k]; else base[k] = patch[k]; } }
const history = [];

io.on('connection', socket => {
  socket.on('join', d => {
    if (players.has(socket.id)) return;
    if (players.size >= MAX_PLAYERS) { socket.emit('full'); socket.disconnect(true); return; }
    const p = clean(d);
    if (!p.n) p.n = 'Рыбак' + (100 + Math.floor(Math.random() * 900));
    const me = { id: socket.id, p, t: 0, tc: 0, ta: 0 };
    const others = [...players.values()].map(x => ({ id: x.id, p: x.p }));
    players.set(socket.id, me);
    socket.emit('welcome', { id: socket.id, peers: others, history: history.slice(-30) });
    socket.broadcast.emit('peer:join', { id: socket.id, p });
  });

  socket.on('state', d => {                                    // позиция, состояние рыбалки, поплавок
    const me = players.get(socket.id); if (!me) return;
    const now = Date.now(); if (now - me.t < 40) return; me.t = now;
    const patch = clean(d); if (!Object.keys(patch).length) return;
    merge(me.p, patch);
    socket.volatile.broadcast.emit('peer:state', { id: socket.id, p: patch });
  });

  socket.on('chat', d => {                                     // общий чат
    const me = players.get(socket.id); if (!me) return;
    const now = Date.now(); if (now - me.tc < 700) return; me.tc = now;
    const t = str(d && d.t, 160); if (!t) return;
    const m = { id: socket.id, n: me.p.n, k: me.p.k || '', c: me.p.c || 0, t, ts: now };
    history.push({ n: m.n, k: m.k, c: m.c, t: m.t }); if (history.length > 40) history.shift();
    io.emit('chat', m);
  });

  socket.on('announce', d => {                                 // трофеи и редкие уловы
    const me = players.get(socket.id); if (!me || !d) return;
    const now = Date.now(); if (now - me.ta < 3000) return; me.ta = now;
    const sp = str(d.sp, 24), w = Number(d.w), tier = Math.round(Number(d.tier));
    if (!sp || !Number.isFinite(w) || w <= 0 || w > 400) return;
    io.emit('announce', { n: me.p.n, k: me.p.k || '', sp, w, tier: tier === 2 ? 2 : tier === 1 ? 1 : 0 });
  });

  socket.on('disconnect', () => {
    if (players.delete(socket.id)) socket.broadcast.emit('peer:leave', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => console.log('Тихий клёв: сервер запущен, порт ' + PORT));
const stop = () => { io.close(); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 3000).unref(); };
process.on('SIGTERM', stop); process.on('SIGINT', stop);
