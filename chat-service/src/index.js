// Placeholder entrypoint.
//
// Owner: Цьопич Андрій (CH-001..CH-016 in tech doc).
// This file exists ONLY so that docker-compose can build the image and the
// reverse proxy contract is exercised end-to-end. Real implementation lives
// on the chat-service feature branches.
//
// Contract surface (must be preserved when you replace this file):
//   - HTTP server bound on $PORT (default 3001)
//   - GET /healthz -> 200 "ok"     (used by docker-compose healthcheck + nginx)
//   - Socket.io path: /socket.io   (default; nginx forwards /socket.io/* here)
//   - Auth: read JWT from `auth.token` on connect, verify with $JWT_SECRET
//   - Verify endpoint dependency: $CORE_API_URL/api/v1/auth/verify

import http from 'node:http';

const PORT = process.env.PORT ?? 3001;

const server = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('ok');
    return;
  }
  res.writeHead(501, { 'content-type': 'application/json' });
  res.end(JSON.stringify({
    error: 'NOT_IMPLEMENTED',
    message: 'chat-service placeholder — owned by Цьопич Андрій',
  }));
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[chat-service] placeholder listening on :${PORT}`);
});
