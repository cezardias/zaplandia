'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext'; // Assuming AuthContext provides the token

interface SocketContextData {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextData>({ socket: null, isConnected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token, user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!token) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
        
        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
            console.log('✅ WebSocket Connected');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('❌ WebSocket Disconnected');
            setIsConnected(false);
        });

        newSocket.on('authenticated', (data) => {
            console.log('🔑 WebSocket Authenticated:', data);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [token]);

    // Notification Logic
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg: any) => {
            // Only notify for inbound messages from other people
            if (msg.direction === 'inbound') {
                playNotificationSound();
                showBrowserNotification(msg);
            }
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('new_message', handleNewMessage);
        };
    }, [socket]);

    const playNotificationSound = () => {
        const audio = new Audio('/sounds/notification.mp3'); // Need to ensure this exists or use a CDN link
        audio.play().catch(e => console.warn('Sound play blocked:', e));
    };

    const showBrowserNotification = (msg: any) => {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            new Notification(`Nova mensagem de ${msg.contact?.name || 'Contato'}`, {
                body: msg.content,
                icon: '/logo.png', // Adjust
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
