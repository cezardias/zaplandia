'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    Search,
    Send,
    User,
    MoreVertical,
    Phone,
    Instagram,
    Facebook,
    Zap,
    MessageCircle,
    Clock
} from 'lucide-react';

interface Contact {
    id: string;
    name: string;
    phoneNumber?: string;
    externalId?: string;
    lastMessage?: string;
    updatedAt: string;
    provider: string;
}

interface Message {
    id: string;
    content: string;
    direction: 'inbound' | 'outbound';
    createdAt: string;
}

export default function OmniInboxPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        if (token) {
            fetch('/api/crm/chats', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setContacts(data))
                .catch(err => console.error('Erro ao carregar chats:', err));
        }
    }, [token]);

    useEffect(() => {
        if (selectedContact && token) {
            fetch(`/api/crm/chats/${selectedContact.id}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setMessages(data))
                .catch(err => console.error('Erro ao carregar mensagens:', err));
        }
    }, [selectedContact, token]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;

        try {
            const res = await fetch('/api/crm/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    contactId: selectedContact.id,
                    content: newMessage,
                    provider: selectedContact.provider
                })
            });

            const data = await res.json();
            setMessages([...messages, data]);
            setNewMessage('');
        } catch (err) {
            console.error('Erro ao enviar mensagem:', err);
        }
    };

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'whatsapp': return <Zap className="w-4 h-4 text-green-500" />;
            case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
            case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
            default: return <MessageCircle className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] m-4 bg-surface rounded-3xl border border-white/5 overflow-hidden">
            {/* Contact List */}
            <div className="w-80 border-r border-white/5 flex flex-col">
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-xl font-bold mb-4">Omni Inbox</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar conversas..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-primary transition"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {contacts.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            Nenhuma conversa encontrada.
                        </div>
                    ) : (
                        contacts.map((contact) => (
                            <button
                                key={contact.id}
                                onClick={() => setSelectedContact(contact)}
                                className={`w-full flex items-center space-x-3 p-4 hover:bg-white/5 transition border-b border-white/5 ${selectedContact?.id === contact.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                                    }`}
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 flex items-center justify-center font-bold text-primary">
                                        {contact.name?.charAt(0) || 'C'}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-surface p-1 rounded-full shadow-lg">
                                        {getProviderIcon(contact.provider)}
                                    </div>
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold truncate">{contact.name || 'Contato'}</p>
                                        <span className="text-[10px] text-gray-500">12:30</span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{contact.lastMessage || 'Sem mensagens...'}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-background/30">
                {selectedContact ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 bg-surface/50 backdrop-blur-sm flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                                    {selectedContact.name?.charAt(0) || 'C'}
                                </div>
                                <div>
                                    <h3 className="font-bold">{selectedContact.name || 'Contato'}</h3>
                                    <div className="flex items-center space-x-2 text-xs text-green-500">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span>Online via {selectedContact.provider}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 text-gray-400">
                                <button className="hover:text-white transition"><Phone className="w-5 h-5" /></button>
                                <button className="hover:text-white transition"><MoreVertical className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${msg.direction === 'outbound'
                                            ? 'bg-primary text-white rounded-br-none'
                                            : 'bg-surface border border-white/5 text-gray-200 rounded-bl-none'
                                        }`}>
                                        {msg.content}
                                        <div className={`text-[10px] mt-2 opacity-50 ${msg.direction === 'outbound' ? 'text-right' : 'text-left'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-surface/50 border-t border-white/5">
                            <form onSubmit={handleSend} className="flex items-center space-x-4">
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center focus-within:border-primary transition">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Digite sua mensagem..."
                                        className="flex-1 bg-transparent outline-none text-sm placeholder-gray-500"
                                    />
                                    <button type="button" className="text-gray-500 hover:text-primary transition mx-2">📎</button>
                                    <button type="button" className="text-gray-500 hover:text-primary transition mx-2">😊</button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="bg-primary hover:bg-primary-dark text-white p-4 rounded-2xl transition shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <MessageCircle className="w-10 h-10 opacity-20" />
                        </div>
                        <p className="font-medium">Selecione uma conversa para começar</p>
                        <p className="text-sm">Seu Omni Inbox centraliza todas as redes sociais aqui.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
