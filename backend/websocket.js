const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ 
    server,
    path: '/ws'
  });

  // Definir función global para emitir mensajes WebSocket
  global.broadcastUpdate = (type, data) => {
    console.log('Iniciando broadcast de actualización...');
    console.log('Tipo de mensaje:', type);
    console.log('Datos a enviar:', data);
    console.log('Número de clientes conectados:', wss.clients.size);
    
    const message = JSON.stringify({ type, data });
    let clientsCount = 0;
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        console.log('Enviando mensaje a cliente en estado OPEN');
        client.send(message);
        clientsCount++;
      } else {
        console.log('Cliente en estado:', client.readyState);
      }
    });
    
    console.log(`Mensaje enviado a ${clientsCount} clientes`);
  };

  wss.on('connection', (ws, req) => {
    console.log('Nueva conexión WebSocket');
    const { query } = url.parse(req.url, true);
    const queryToken = query.token;

    if (!queryToken) {
      console.log('Conexión rechazada: Token no proporcionado en query string');
      ws.send(JSON.stringify({ type: 'error', message: 'Token no proporcionado' }), () => {
        ws.close(4001, 'Token requerido');
      });
      return;
    }

    try {
      const decoded = jwt.verify(queryToken, process.env.JWT_SECRET || 'test-secret-key');
      ws.user = decoded;
      ws.isAuthenticated = true;
      console.log('Conexión autenticada por query string:', ws.user.email);
      
      // Enviar mensaje de bienvenida inmediatamente
      console.log('Enviando mensaje de bienvenida...');
      const welcomeMessage = JSON.stringify({
        type: 'welcome',
        message: 'Bienvenido a la conexión WebSocket del Digital Twin'
      });
      
      // Asegurarnos de que el mensaje se envíe
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(welcomeMessage, (err) => {
          if (err) {
            console.error('Error enviando mensaje de bienvenida:', err);
          } else {
            console.log('Mensaje de bienvenida enviado correctamente');
          }
        });
      } else {
        console.error('WebSocket no está abierto para enviar mensaje de bienvenida');
      }

      // Manejo de mensajes
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log('Mensaje recibido:', data);

          // Validar formato del mensaje
          if (!data.type) {
            const errorMessage = {
              type: 'error',
              message: 'Formato de mensaje inválido'
            };
            ws.send(JSON.stringify(errorMessage));
            return;
          }

          // Procesar mensaje según su tipo
          switch (data.type) {
            case 'sensor_update':
              // Broadcast a todos los clientes conectados
              const broadcastMessage = {
                type: 'sensor_update',
                data: data.data
              };
              
              wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(broadcastMessage));
                }
              });
              break;

            case 'ping':
              ws.send(JSON.stringify({ type: 'pong' }));
              break;

            default:
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Tipo de mensaje no soportado'
              }));
          }
        } catch (error) {
          console.error('Error al procesar mensaje:', error);
          const errorMessage = { type: 'error', message: 'Error al procesar mensaje' };
          console.log('Enviando mensaje de error:', errorMessage);
          ws.send(JSON.stringify(errorMessage));
        }
      });

      // Manejo de desconexión
      ws.on('close', () => {
        if (ws.user) {
          console.log('Cliente desconectado:', ws.user.email);
        }
      });

      // Manejo de errores
      ws.on('error', (error) => {
        console.error('Error en WebSocket:', error.message);
      });
    } catch (error) {
      console.log('Conexión rechazada: Token inválido');
      ws.send(JSON.stringify({ type: 'error', message: 'Token inválido' }), () => {
        ws.close(4002, 'Token inválido');
      });
    }
  });

  return wss;
}

module.exports = setupWebSocket; 