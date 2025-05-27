import { useEffect, useRef, useState } from 'react';

/**
 * Hook para gestionar una conexión WebSocket y recibir mensajes en tiempo real.
 * @param {string} url - URL del servidor WebSocket
 * @param {function} onMessage - Callback para manejar mensajes recibidos
 * @returns {object} { connected, sendMessage, lastMessage, error }
 */
export function useWebSocket(url, onMessage) {
  const ws = useRef(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    ws.current = new window.WebSocket(url);

    ws.current.onopen = () => setConnected(true);
    ws.current.onclose = () => setConnected(false);
    ws.current.onerror = (e) => setError(e);
    ws.current.onmessage = (event) => {
      setLastMessage(event.data);
      if (onMessage) onMessage(event.data);
    };

    return () => {
      ws.current && ws.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const sendMessage = (msg) => {
    if (ws.current && connected) {
      ws.current.send(msg);
    }
  };

  return { connected, sendMessage, lastMessage, error };
} 