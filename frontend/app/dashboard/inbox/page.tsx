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
    Clock,
    Database,
    Loader2,
    ShoppingBag,
    Store
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface Contact {
    id: string;
    name: string;
    phoneNumber?: string;
    externalId?: string;
    lastMessage?: string;
    updatedAt: string;
    provider: string;
    aiEnabled?: boolean | null;
}

interface Message {
    id: string;
    content: string;
    direction: 'inbound' | 'outbound';
    createdAt: string;
    mediaUrl?: string;
    mediaType?: string;
    mediaMimeType?: string;
    mediaFileName?: string;
}

export default function OmniInboxPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { user, token } = useAuth();
    const router = useRouter();

    // Media Upload State
    const [uploadedMedia, setUploadedMedia] = useState<{ url: string, mimetype: string, filename: string } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const [activeTab, setActiveTab] = useState('all');
    const [selectedInstance, setSelectedInstance] = useState<string>('all');
    const [availableInstances, setAvailableInstances] = useState<any[]>([]);

    // AI Agent State
    const [aiEnabled, setAiEnabled] = useState(false);
    const [aiPrompts, setAiPrompts] = useState<any[]>([]);
    const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
    const [selectedAiModel, setSelectedAiModel] = useState<string>('gemini-1.5-flash');
    const [contactAiEnabled, setContactAiEnabled] = useState<boolean | null>(null);

    const fetchInstances = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/integrations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter only Evolution instances that are connected
                const evolutionInstances = data.filter((i: any) =>
                    i.provider === 'evolution' && (i.status === 'CONNECTED' || i.status === 'connected')
                );
                setAvailableInstances(evolutionInstances);
            }
        } catch (err) {
            console.error('Erro ao carregar instâncias:', err);
        }
    };

    const fetchAiPrompts = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/ai/prompts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log('Prompts carregados:', data);
                setAiPrompts(data);
            }
        } catch (err) {
            console.error('Erro ao carregar prompts:', err);
        }
    };

    const fetchChats = async () => {
        if (!token) return;
        try {
            console.log('Buscando chats...');
            // Get instance name from ID for filtering
            const instanceName = selectedInstance === 'all'
                ? 'all'
                : availableInstances.find(i => i.id === selectedInstance)?.instanceName || selectedInstance;

            const url = instanceName === 'all'
                ? '/api/crm/chats'
                : `/api/crm/chats?instance=${instanceName}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Chats Status:', res.status);
            if (res.status === 401) router.push('/auth/login');
            if (res.ok) {
                const data = await res.json();
                console.log('Chats recebidos:', data);
                setContacts(data);
            }
        } catch (err) {
            console.error('Erro ao carregar chats:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInstances();
        fetchAiPrompts();
    }, [token]);

    useEffect(() => {
        fetchChats();
        // Sync AI state for the newly selected instance
        if (selectedInstance !== 'all') {
            const inst = availableInstances.find(i => i.id === selectedInstance);
            if (inst) {
                setAiEnabled(inst.aiEnabled || false);
                setSelectedPromptId(inst.aiPromptId || null);
                setSelectedAiModel(inst.aiModel || 'gemini-2.5-flash-lite');
            }
        } else {
            setAiEnabled(false);
            setSelectedPromptId(null);
            setSelectedAiModel('gemini-2.5-flash-lite');
        }
    }, [token, selectedInstance, availableInstances]);

    const handleSeed = async () => {
        if (!confirm('Gerar dados de demonstração para o Inbox?')) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/seed', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('Dados gerados! Recarregando...');
                fetchChats();
            }
        } catch (err) {
            alert('Erro ao gerar dados.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedContact && token) {
            console.log(`Buscando mensagens do contato: ${selectedContact.id}`);

            // Sync AI state for the newly selected contact
            setContactAiEnabled(selectedContact.aiEnabled ?? null);

            fetch(`/api/crm/chats/${selectedContact.id}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    console.log('Mensagens recebidas:', data);
                    setMessages(data);
                })
                .catch(err => console.error('Erro ao carregar mensagens:', err));
        }
    }, [selectedContact, token]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/uploads', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Falha no upload');

            const data = await res.json();
            console.log('Upload concluído:', data);

            setUploadedMedia({
                url: data.url,
                mimetype: data.mimetype,
                filename: data.filename // Using the generic filename from server
            });
        } catch (err) {
            console.error('Erro ao fazer upload:', err);
            alert('Erro ao enviar arquivo. Tente novamente.');
        } finally {
            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleEmojiClick = (emojiData: any) => {
        setNewMessage(prev => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !uploadedMedia) || !selectedContact) return;

        try {
            const payload: any = {
                contactId: selectedContact.id,
                content: newMessage,
                provider: selectedContact.provider
            };

            if (uploadedMedia) {
                payload.media = {
                    url: uploadedMedia.url,
                    mimetype: uploadedMedia.mimetype,
                    fileName: uploadedMedia.filename,
                    type: uploadedMedia.mimetype.startsWith('image/') ? 'image' :
                        uploadedMedia.mimetype.startsWith('video/') ? 'video' : 'document'
                };
            }

            const res = await fetch('/api/crm/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || 'Falha ao enviar mensagem');
                throw new Error(data.message || 'Falha ao enviar');
            }

            setMessages([...messages, data]);
            setNewMessage('');
            setUploadedMedia(null);
        } catch (err) {
            console.error('Erro ao enviar mensagem:', err);
        }
    };

    // AI Control Functions
    const toggleAI = async () => {
        if (!token || selectedInstance === 'all') return;

        try {
            const res = await fetch(`/api/ai/integration/${selectedInstance}/toggle`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    enabled: !aiEnabled,
                    promptId: selectedPromptId,
                    aiModel: selectedAiModel
                })
            });

            if (res.ok) {
                const data = await res.json();
                setAiEnabled(data.integration?.aiEnabled ?? !aiEnabled);
                // Update availableInstances local state to keep it in sync
                setAvailableInstances(prev => prev.map(i =>
                    i.id === selectedInstance
                        ? {
                            ...i,
                            aiEnabled: data.integration?.aiEnabled ?? !aiEnabled,
                            aiPromptId: data.integration?.aiPromptId,
                            aiModel: data.integration?.aiModel
                        }
                        : i
                ));
            }
        } catch (err) {
            console.error('Erro ao alternar IA:', err);
        }
    };

    const toggleContactAI = async () => {
        if (!token || !selectedContact) return;

        try {
            // 3-state cycle logic:
            // 1. null (follow global) -> click -> false (strictly disabled)
            // 2. false (strictly disabled) -> click -> true (strictly enabled)
            // 3. true (strictly enabled) -> click -> null (follow global)
            let newValue: boolean | null;
            if (contactAiEnabled === null) newValue = false;
            else if (contactAiEnabled === false) newValue = true;
            else newValue = null;

            const res = await fetch(`/api/ai/contact/${selectedContact.id}/toggle`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    enabled: newValue
                })
            });

            if (res.ok) {
                setContactAiEnabled(newValue);
                // Update local contacts list to stay in sync
                setContacts(prev => prev.map(c =>
                    c.id === selectedContact.id
                        ? { ...c, aiEnabled: newValue }
                        : c
                ));
            }
        } catch (err) {
            console.error('Erro ao alternar IA do contato:', err);
        }
    };

    const fetchAIPrompts = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/ai/prompts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAiPrompts(data.prompts || []);
            }
        } catch (err) {
            console.error('Erro ao carregar prompts:', err);
        }
    };

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'whatsapp': return <Zap className="w-4 h-4 text-green-500" />;
            case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
            case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
            case 'mercadolivre': return <ShoppingBag className="w-4 h-4 text-yellow-500" />;
            case 'olx': return <Store className="w-4 h-4 text-orange-600" />;
            default: return <MessageCircle className="w-4 h-4 text-gray-400" />;
        }
    };

    const filteredContacts = contacts.filter(contact => {
        if (activeTab === 'all') return true;
        return contact.provider === activeTab;
    });

    return (
        <div className="flex h-[calc(100vh-2rem)] m-4 bg-surface rounded-3xl border border-white/5 overflow-hidden">
            {/* Contact List */}
            <div className="w-80 border-r border-white/5 flex flex-col">
                <div className="p-4 border-b border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Omni Inbox</h2>
                        {/* <button onClick={fetchChats} className="p-2 hover:bg-white/5 rounded-full"><Clock className="w-4 h-4"/></button> */}
                    </div>

                    {/* Instance Selector (WhatsApp Only) */}
                    {activeTab === 'whatsapp' && availableInstances.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 font-medium">Caixa de Entrada</label>
                            <select
                                value={selectedInstance}
                                onChange={(e) => setSelectedInstance(e.target.value)}
                                className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="all">Todas as Caixas</option>
                                {availableInstances.map(inst => (
                                    <option key={inst.id} value={inst.id}>
                                        {inst.name}
                                    </option>
                                ))}
                            </select>

                            {/* AI Toggle & Prompt Selector */}
                            {selectedInstance !== 'all' && (
                                <div className="mt-3 p-3 bg-black/20 rounded-lg border border-white/10 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">🤖 IA Ativa</span>
                                        </div>
                                        <button
                                            onClick={toggleAI}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${aiEnabled ? 'bg-primary' : 'bg-gray-600'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiEnabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>

                                    {aiEnabled && (
                                        <select
                                            value={selectedPromptId || ''}
                                            onChange={async (e) => {
                                                const newPromptId = e.target.value;
                                                setSelectedPromptId(newPromptId);
                                                // Save immediately to backend
                                                if (token && selectedInstance !== 'all') {
                                                    try {
                                                        await fetch(`/api/ai/integration/${selectedInstance}/toggle`, {
                                                            method: 'POST',
                                                            headers: {
                                                                'Authorization': `Bearer ${token}`,
                                                                'Content-Type': 'application/json'
                                                            },
                                                            body: JSON.stringify({
                                                                enabled: true,
                                                                promptId: newPromptId
                                                            })
                                                        });
                                                    } catch (err) {
                                                        console.error('Erro ao salvar prompt:', err);
                                                    }
                                                }
                                            }}
                                            className="w-full px-2 py-1.5 bg-black/30 border border-white/10 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        >
                                            <option value="">Selecione um prompt...</option>
                                            {aiPrompts.map(prompt => (
                                                <option key={prompt.id} value={prompt.id}>
                                                    {prompt.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {/* Gemini Model Selector */}
                                    {aiEnabled && (
                                        <div className="mt-2">
                                            <label className="text-xs text-gray-400 block mb-1">Modelo de IA</label>
                                            <select
                                                value={selectedAiModel}
                                                onChange={async (e) => {
                                                    const newModel = e.target.value;
                                                    setSelectedAiModel(newModel);
                                                    // Save immediately to backend
                                                    if (token && selectedInstance !== 'all') {
                                                        try {
                                                            await fetch(`/api/ai/integration/${selectedInstance}/toggle`, {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Authorization': `Bearer ${token}`,
                                                                    'Content-Type': 'application/json'
                                                                },
                                                                body: JSON.stringify({
                                                                    enabled: true,
                                                                    promptId: selectedPromptId,
                                                                    aiModel: newModel
                                                                })
                                                            });
                                                        } catch (err) {
                                                            console.error('Erro ao salvar modelo:', err);
                                                        }
                                                    }
                                                }}
                                                className="w-full px-2 py-1.5 bg-black/30 border border-white/10 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                                            >
                                                <option value="gemini-2.5-flash-lite">⭐ 2.5 Flash Lite (Mais Novo)</option>
                                                <option value="gemini-1.5-flash">⚡ 1.5 Flash (Recomendado)</option>
                                                <option value="gemini-1.5-pro">🚀 1.5 Pro (Mais Inteligente)</option>
                                                <option value="gemini-2.0-flash-exp">🔬 2.0 Flash (Experimental)</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex bg-black/20 p-1 rounded-xl overflow-x-auto no-scrollbar gap-1">
                        {['all', 'whatsapp', 'instagram', 'facebook'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition whitespace-nowrap ${activeTab === tab
                                    ? 'bg-primary text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tab === 'all' ? 'Todos' : tab}
                            </button>
                        ))}
                    </div>

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
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="p-8 text-center">
                            <Clock className="w-12 h-12 mx-auto mb-4 opacity-10 text-gray-500" />
                            <p className="text-gray-500 text-sm mb-6">Nenhuma conversa encontrada na conta atual.</p>

                            {user?.role === 'superadmin' && (
                                <button
                                    onClick={handleSeed}
                                    className="w-full flex items-center justify-center space-x-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 py-3 rounded-xl transition font-bold text-xs uppercase tracking-widest"
                                >
                                    <Database className="w-4 h-4" />
                                    <span>Gerar Dados de Teste</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredContacts.map((contact) => (
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
                                        <div className="flex items-center gap-1">
                                            <p className="font-bold truncate">{contact.name || 'Contato'}</p>
                                            {aiEnabled && contact.aiEnabled !== false && (
                                                <span className="text-xs">🤖</span>
                                            )}
                                        </div>
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
                                <a
                                    href={`tel:${selectedContact.phoneNumber || selectedContact.externalId?.replace(/\D/g, '')}`}
                                    className="hover:text-white transition"
                                    title="Ligar para o contato"
                                >
                                    <Phone className="w-5 h-5" />
                                </a>
                                {/* AI Toggle for this conversation */}
                                {aiEnabled && (
                                    <button
                                        onClick={toggleContactAI}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${contactAiEnabled === false
                                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                            : contactAiEnabled === true
                                                ? 'bg-primary text-white hover:bg-primary/80 shadow-lg shadow-primary/20'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                        title={
                                            contactAiEnabled === false
                                                ? 'IA Forçada: OFF (Clique para ON)'
                                                : contactAiEnabled === true
                                                    ? 'IA Forçada: ON (Clique para PADRÃO)'
                                                    : 'IA Modo: PADRÃO (Clique para OFF)'
                                        }
                                    >
                                        <span>🤖</span>
                                        {contactAiEnabled === false ? (
                                            <span className="font-bold">OFF</span>
                                        ) : contactAiEnabled === true ? (
                                            <span className="font-bold">ON</span>
                                        ) : (
                                            <span>AUTO</span>
                                        )}
                                    </button>
                                )}
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

                                        {/* Media Rendering */}
                                        {msg.mediaUrl && (
                                            <div className="mb-2 rounded-lg overflow-hidden">
                                                {msg.mediaMimeType?.startsWith('image/') || (msg.mediaUrl.match(/\.(jpeg|jpg|gif|png)$/) != null) ? (
                                                    <img src={msg.mediaUrl} alt="Media" className="max-w-full h-auto" />
                                                ) : msg.mediaMimeType?.startsWith('video/') ? (
                                                    <video src={msg.mediaUrl} controls className="max-w-full h-auto" />
                                                ) : (
                                                    <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 bg-black/20 p-2 rounded hover:bg-black/30 transition">
                                                        <span>📎 Anexo: {msg.mediaFileName || 'Arquivo'}</span>
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {msg.content}
                                        <div className={`text-[10px] mt-2 opacity-50 ${msg.direction === 'outbound' ? 'text-right' : 'text-left'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-surface/50 border-t border-white/5 relative">
                            {/* File Upload Preview */}
                            {uploadedMedia && (
                                <div className="mb-4 flex items-center bg-white/5 p-2 rounded-xl w-fit relative group">
                                    {uploadedMedia.mimetype.startsWith('image/') ? (
                                        <img src={uploadedMedia.url} className="h-16 w-16 object-cover rounded-lg" />
                                    ) : (
                                        <div className="h-16 w-16 flex items-center justify-center bg-gray-700 rounded-lg">📎</div>
                                    )}
                                    <button
                                        onClick={() => setUploadedMedia(null)}
                                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg hover:bg-red-600 transition"
                                    >
                                        <div className="w-3 h-3 flex items-center justify-center text-white text-[10px] font-bold">✕</div>
                                    </button>
                                </div>
                            )}

                            {/* Hidden Input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                            />

                            {/* Emoji Picker */}
                            {showEmojiPicker && (
                                <div className="absolute bottom-20 right-4 z-50 shadow-2xl rounded-2xl overflow-hidden">
                                    <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.DARK} width={300} height={400} />
                                </div>
                            )}

                            <form onSubmit={handleSend} className="flex items-center space-x-4">
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center focus-within:border-primary transition">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Digite sua mensagem..."
                                        className="flex-1 bg-transparent outline-none text-sm placeholder-gray-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-gray-500 hover:text-primary transition mx-2 relative"
                                        disabled={isUploading}
                                    >
                                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : '📎'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className={`text-gray-500 hover:text-primary transition mx-2 ${showEmojiPicker ? 'text-primary' : ''}`}
                                    >
                                        😊
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={(!newMessage.trim() && !uploadedMedia) || isUploading}
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
        </div >
    );
}
