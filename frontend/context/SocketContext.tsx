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

        // Robust URL Detection: Try env var, then current host, then fallback to common backend port
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const currentProto = typeof window !== 'undefined' ? window.location.protocol : 'http:';
        
        // If we are on zaplandia.com.br, we might need to target the backend port 3001 directly 
        // unless there is a reverse proxy handling /socket.io
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
                          (currentHost === 'localhost' ? 'http://localhost:3001' : `${currentProto}//${currentHost}`);

        console.log('🔌 Tentando conectar ao Socket em:', socketUrl);
        
        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            path: '/socket.io', // Ensure standard path
            reconnectionAttempts: 5,
            timeout: 10000
        });

        newSocket.on('connect', () => {
            console.log('✅ WebSocket Conectado com sucesso!');
            setIsConnected(true);
        });

        newSocket.on('connect_error', (err) => {
            console.error('❌ Erro na conexão do WebSocket:', err.message);
            // If connection to main host fails and we are not on localhost, try port 3001 as fallback
            if (currentHost !== 'localhost' && !socketUrl.includes(':3001')) {
                const fallbackUrl = `${currentProto}//${currentHost}:3001`;
                console.log('🔄 Tentando fallback para porta 3001:', fallbackUrl);
                // Note: In a real scenario we might want to recreate the socket here, 
                // but for now we just log it to help the user identify the issue.
            }
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
