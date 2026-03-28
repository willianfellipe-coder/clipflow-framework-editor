import { useEffect, useState, useCallback } from 'react';
import { wsClient } from '@/lib/ws';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(wsClient.isConnected);

  useEffect(() => {
    wsClient.setConnectionChangeHandler(setIsConnected);

    const wsUrl =
      window.location.protocol === 'https:'
        ? `wss://${window.location.host}/ws`
        : `ws://${window.location.host}/ws`;

    wsClient.connect(wsUrl);

    return () => {
      wsClient.setConnectionChangeHandler(null as unknown as (connected: boolean) => void);
    };
  }, []);

  const subscribe = useCallback((event: string, callback: (data: unknown) => void) => {
    return wsClient.on(event, callback);
  }, []);

  return { isConnected, subscribe };
}
