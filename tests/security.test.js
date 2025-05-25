const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const http = require('http');

describe('WebSocket Security Tests', () => {
  let server;
  let wss;
  const JWT_SECRET = 'test-secret-key';
  const PORT = 8080;

  beforeAll((done) => {
    server = http.createServer();
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
      // Verificar token en la query string
      const url = new URL(req.url, 'ws://localhost');
      const token = url.searchParams.get('token');
      if (!token) {
        console.log('Conexión rechazada: Token no proporcionado en query string');
        ws.close(1008, 'Token no proporcionado');
        return;
      }
      console.log('Nueva conexión WebSocket establecida');
      
      // Enviar mensaje de bienvenida inmediatamente
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Conexión establecida'
      }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log('Mensaje recibido:', data);
          
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (error) {
          console.error('Error al procesar mensaje:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Formato de mensaje inválido'
          }));
        }
      });
    });

    server.listen(PORT, () => {
      console.log(`Servidor WebSocket iniciado en puerto ${PORT}`);
      done();
    });
  });

  afterAll((done) => {
    console.log('Cerrando servidor WebSocket...');
    
    // Cerrar todas las conexiones WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });

    // Cerrar el servidor WebSocket
    wss.close(() => {
      console.log('Servidor WebSocket cerrado');
      
      // Cerrar el servidor HTTP
      server.close(() => {
        console.log('Servidor HTTP cerrado');
        done();
      });
    });
  });

  test('should reject connection without authentication', (done) => {
    const ws = new WebSocket(`ws://localhost:${PORT}`);
    let closed = false;
    let timeout = setTimeout(() => {
      if (!closed) {
        done(new Error('Timeout: la conexión no fue rechazada a tiempo'));
      }
    }, 3000);

    ws.on('open', () => {
      console.log('Conexión abierta sin autenticación, esperando cierre inmediato...');
    });

    ws.on('close', (code, reason) => {
      closed = true;
      clearTimeout(timeout);
      console.log('Conexión cerrada por el servidor (sin autenticación)');
      expect(code).toBeGreaterThanOrEqual(1000); // Cualquier código de cierre válido
      done();
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      console.error('Error en conexión:', error);
      // Si hay error, también consideramos que fue rechazada
      done();
    });
  });

  test('should validate message format', (done) => {
    const token = jwt.sign({ userId: 'test' }, JWT_SECRET);
    const ws = new WebSocket(`ws://localhost:${PORT}?token=${token}`);
    let welcomeReceived = false;

    ws.on('open', () => {
      console.log('Conexión abierta con autenticación');
      // Enviar mensaje con formato inválido
      ws.send('mensaje inválido');
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data);
      console.log('Mensaje recibido:', message);
      
      if (message.type === 'welcome') {
        console.log('Mensaje de bienvenida recibido');
        welcomeReceived = true;
        return;
      }
      
      if (message.type === 'error') {
        expect(message.message).toContain('Formato de mensaje inválido');
        expect(welcomeReceived).toBe(true);
        ws.close();
        done();
      }
    });

    ws.on('error', (error) => {
      console.error('Error en conexión:', error);
      done(error);
    });
  });
}); 