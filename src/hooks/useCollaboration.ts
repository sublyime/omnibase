import { useEffect, useRef, useState } from 'react';

export function useCollaboration(unitId: string | null, userId: string, userName: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [editingUsers, setEditingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!unitId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', unitId, userId, userName }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'presence':
          if (data.action === 'joined') {
            setActiveUsers(prev => [...new Set([...prev, data.userId])]);
          }
          break;
        case 'new_comment':
          setComments(prev => [...prev, data]);
          break;
        case 'user_editing':
          setEditingUsers(prev => {
            const next = new Set(prev);
            next.add(data.userName);
            return next;
          });
          // Clear after 3 seconds of inactivity
          setTimeout(() => {
            setEditingUsers(prev => {
              const next = new Set(prev);
              next.delete(data.userName);
              return next;
            });
          }, 3000);
          break;
      }
    };

    return () => {
      ws.close();
    };
  }, [unitId, userId, userName]);

  const sendComment = (comment: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ 
        type: 'comment', 
        unitId, 
        comment 
      }));
    }
  };

  const pingEdit = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ 
        type: 'edit_ping', 
        unitId, 
        userId, 
        userName 
      }));
    }
  };

  return { activeUsers, comments, editingUsers, sendComment, pingEdit };
}
