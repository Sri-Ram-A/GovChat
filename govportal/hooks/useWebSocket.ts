// hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: any) => void;
  onBinary?: (data: ArrayBuffer) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  autoConnect?: boolean;
}

export const useWebSocket = (options: UseWebSocketOptions) => {
  const { url, onMessage, onBinary, onOpen, onClose, onError, autoConnect = false } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const disconnect = useCallback(() => {
    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    // Only disconnect if WebSocket exists and is open/connecting
    if (wsRef.current && 
        (wsRef.current.readyState === WebSocket.OPEN || 
         wsRef.current.readyState === WebSocket.CONNECTING)) {
      wsRef.current.close(1000, "User disconnect");
    }
    
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    // Prevent duplicate connections
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      const ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        onOpen?.();
      };

      ws.onmessage = (event: MessageEvent) => {
        if (event.data instanceof ArrayBuffer) {
          onBinary?.(event.data);
        } else {
          try {
            const parsed = JSON.parse(event.data);
            onMessage?.(parsed);
          } catch {
            onMessage?.(event.data);
          }
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        onError?.(error);
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        onClose?.();
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      onError?.(error as Event);
    }
  }, [url, onMessage, onBinary, onOpen, onClose, onError]);

  const sendMessage = useCallback((data: any): boolean => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected");
      return false;
    }
    
    try {
      const message = typeof data === "string" ? data : JSON.stringify(data);
      wsRef.current.send(message);
      return true;
    } catch (error) {
      console.error("Send failed:", error);
      return false;
    }
  }, []);

  const sendBinary = useCallback((data: ArrayBuffer | Blob): boolean => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected");
      return false;
    }
    
    try {
      wsRef.current.send(data);
      return true;
    } catch (error) {
      console.error("Binary send failed:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    if (autoConnect) connect();
    
    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmount");
        wsRef.current = null;
      }
    };
  }, []); // Only run once on mount/unmount

  return { isConnected, connect, disconnect, sendMessage, sendBinary };
};