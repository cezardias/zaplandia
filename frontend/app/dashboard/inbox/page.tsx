'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
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
    Store,
    Bot,
    Terminal,
    CheckCircle,
    ArrowLeft,
    Users,
    Paperclip,
    Smile,
    X,
    ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useSocket } from '@/context/SocketContext';
import AiModelSelector from '@/components/AiModelSelector';

interface Contact {
    id: string;
    name: string;
    phoneNumber?: string;
    externalId?: string;
    lastMessage?: string;
    updatedAt: string;
    provider: string;
    aiEnabled?: boolean | null;
    n8nEnabled?: boolean | null;
    assignedTeamId?: string | null;
    assignedUserId?: string | null;
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
    const { lang } = useLanguage();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);


    const t: any = {
        pt_BR: {
            title: 'Omni Inbox',
            inbox: 'Caixa de Entrada',
            allInboxes: 'Todas as Caixas',
            aiAgent: 'IA do Agente',
            n8nFlow: 'Fluxo n8n',
            selectPrompt: 'Selecione um prompt...',
            engineModel: 'Modelo do Motor',
            all: 'Todos',
            searchChats: 'Pesquisar conversas...',
            noConversations: 'Nenhuma conversa encontrada nesta conta.',
            generateTestData: 'Gerar Dados de Teste',
            seedConfirm: 'Gerar dados de demonstração para o Inbox?',
            seedSuccess: 'Dados gerados! Recarregando...',
            seedError: 'Erro ao gerar dados.',
            uploadError: 'Erro ao enviar arquivo. Tente novamente.',
            sendError: 'Falha ao enviar mensagem',
            finishService: 'Finalizar Atendimento',
            finishConfirm: 'Deseja finalizar este atendimento e devolver para a Automação?',
            transferTeam: 'Transferir Equipe',
            noPrompt: 'Sem Prompt',
            waitingAi: 'Aguardando IA...',
            typeMessage: 'Digite uma mensagem...',
            online: 'Online',
            offline: 'Offline',
            details: 'Detalhes do Contato',
            phone: 'Telefone',
            provider: 'Provedor',
            instance: 'Instância',
            aiControl: 'Controle de IA',
            aiActive: 'IA Ativa',
            aiPaused: 'IA Pausada',
            n8nActive: 'n8n Ativo',
            n8nPaused: 'n8n Pausado',
            transferSuccess: 'Transferido com sucesso!',
            transferError: 'Erro ao transferir.',
            now: 'Agora'
        },
        en_US: {
            title: 'Omni Inbox',
            inbox: 'Inbox',
            allInboxes: 'All Inboxes',
            aiAgent: 'Agent AI',
            n8nFlow: 'n8n Flow',
            selectPrompt: 'Select a prompt...',
            engineModel: 'Engine Model',
            all: 'All',
            searchChats: 'Search chats...',
            noConversations: 'No conversations found in this account.',
            generateTestData: 'Generate Test Data',
            seedConfirm: 'Generate demo data for the Inbox?',
            seedSuccess: 'Data generated! Reloading...',
            seedError: 'Error generating data.',
            uploadError: 'Error uploading file. Try again.',
            sendError: 'Failed to send message',
            finishService: 'Finish Service',
            finishConfirm: 'Do you want to finish this service and return to Automation?',
            transferTeam: 'Transfer Team',
            noPrompt: 'No Prompt',
            waitingAi: 'Waiting for AI...',
            typeMessage: 'Type a message...',
            online: 'Online',
            offline: 'Offline',
            details: 'Contact Details',
            phone: 'Phone',
            provider: 'Provider',
            instance: 'Instance',
            aiControl: 'AI Control',
            aiActive: 'AI Active',
            aiPaused: 'AI Paused',
            n8nActive: 'n8n Active',
            n8nPaused: 'n8n Paused',
            transferSuccess: 'Transferred successfully!',
            transferError: 'Transfer error.',
            now: 'Now'
        },
        pt_PT: {
            title: 'Omni Inbox',
            inbox: 'Caixa de Entrada',
            allInboxes: 'Todas as Caixas',
            aiAgent: 'IA do Agente',
            n8nFlow: 'Fluxo n8n',
            selectPrompt: 'Selecione um prompt...',
            engineModel: 'Modelo do Motor',
            all: 'Todos',
            searchChats: 'Pesquisar conversas...',
            noConversations: 'Nenhuma conversa encontrada nesta conta.',
            generateTestData: 'Gerar Dados de Teste',
            seedConfirm: 'Gerar dados de demonstração para o Inbox?',
            seedSuccess: 'Dados gerados! Recarregando...',
            seedError: 'Erro ao gerar dados.',
            uploadError: 'Erro ao enviar ficheiro. Tente novamente.',
            sendError: 'Falha ao enviar mensagem',
            finishService: 'Finalizar Atendimento',
            finishConfirm: 'Deseja finalizar este atendimento e devolver para a Automação?',
            transferTeam: 'Transferir Equipa',
            noPrompt: 'Sem Prompt',
            waitingAi: 'A aguardar IA...',
            typeMessage: 'Digite uma mensagem...',
            online: 'Online',
            offline: 'Offline',
            details: 'Detalhes do Contacto',
            phone: 'Telefone',
            provider: 'Provedor',
            instance: 'Instância',
            aiControl: 'Controlo de IA',
            aiActive: 'IA Ativa',
            aiPaused: 'IA Pausada',
            n8nActive: 'n8n Ativo',
            n8nPaused: 'n8n Pausado',
            transferSuccess: 'Transferido com sucesso!',
            transferError: 'Erro ao transferir.',
            now: 'Agora'
        },
        it_IT: {
            title: 'Omni Inbox',
            inbox: 'Casella di posta',
            allInboxes: 'Tutte le caselle',
            aiAgent: 'IA Agente',
            n8nFlow: 'Flusso n8n',
            selectPrompt: 'Seleziona un prompt...',
            engineModel: 'Modello del Motore',
            all: 'Tutti',
            searchChats: 'Cerca conversazioni...',
            noConversations: 'Nessuna conversazione trovata in questo account.',
            generateTestData: 'Genera Dati di Test',
            seedConfirm: 'Generare dati demo per l\'Inbox?',
            seedSuccess: 'Dati generati! Ricaricamento...',
            seedError: 'Errore durante la generazione dei dati.',
            uploadError: 'Errore durante il caricamento del file. Riprova.',
            sendError: 'Invio messaggio fallito',
            finishService: 'Concludi Servizio',
            finishConfirm: 'Vuoi concludere questo servizio e tornare all\'automazione?',
            transferTeam: 'Trasferisci Team',
            noPrompt: 'Nessun Prompt',
            waitingAi: 'In attesa dell\'IA...',
            typeMessage: 'Scrivi un messaggio...',
            online: 'Online',
            offline: 'Offline',
            details: 'Dettagli Contatto',
            phone: 'Telefono',
            provider: 'Provider',
            instance: 'Istanza',
            aiControl: 'Controllo IA',
            aiActive: 'IA Attiva',
            aiPaused: 'IA in Pausa',
            n8nActive: 'n8n Attivo',
            n8nPaused: 'n8n in Pausa',
            transferSuccess: 'Trasferito con successo!',
            transferError: 'Errore durante il trasferimento.',
            now: 'Adesso'
        }
    };
    const { user, token } = useAuth();
    const { socket } = useSocket();
    const router = useRouter();

    // Media Upload State
    const [uploadedMedia, setUploadedMedia] = useState<{ url: string, mimetype: string, filename: string } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const [activeTab, setActiveTab] = useState('all');
    const [selectedInstance, setSelectedInstance] = useState<string>('all');
    const [availableInstances, setAvailableInstances] = useState<any[]>([]);

    // AI & n8n Agent State
    const [aiEnabled, setAiEnabled] = useState(false);
    const [n8nEnabled, setN8nEnabled] = useState(false);
    const [hasN8nWebhook, setHasN8nWebhook] = useState(false);
    const [aiPrompts, setAiPrompts] = useState<any[]>([]);
    const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
    const [selectedAiModel, setSelectedAiModel] = useState<string>('gemini-1.5-flash');
    const [contactAiEnabled, setContactAiEnabled] = useState<boolean | null>(null);
    const [contactN8nEnabled, setContactN8nEnabled] = useState<boolean | null>(null);
    const [teams, setTeams] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchInstances = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/integrations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter connected instances (Evolution and Meta)
                const activeIntegrations = data.filter((i: any) =>
                    (i.provider === 'evolution' && (i.status === 'CONNECTED' || i.status === 'connected')) ||
                    ((i.provider === 'meta' || i.provider === 'whatsapp') && (i.status === 'CONNECTED' || i.status === 'connected'))
                );

                // Ensure we have a consistent name and identifier for filtering
                const formatted = activeIntegrations.map((i: any) => {
                    const nameInCreds = i.credentials?.instanceName || i.credentials?.name;
                    const phoneId = i.credentials?.META_PHONE_NUMBER_ID; // Fallback if name is missing
                    
                    return {
                        ...i,
                        displayName: i.name || nameInCreds || (i.provider === 'meta' || i.provider === 'whatsapp' ? 'Meta Oficial' : i.id),
                        instanceName: i.instanceName || nameInCreds || phoneId || i.id
                    };
                });

                setAvailableInstances(formatted);
            }
        } catch (err) {
            console.error('Erro ao carregar instâncias:', err);
        }
    };

    // Language sync handled by useLanguage()


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

    const fetchCredentials = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/integrations/credentials', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const creds = await res.json();
                const hasUrl = creds.some((c: any) => (c.key_name === 'N8N_WEBHOOK_URL' || c.key_name === 'N8N_PROVIDER_CONFIG') && c.key_value);
                setHasN8nWebhook(hasUrl);
            }
        } catch (err) {
            console.error('Erro ao buscar credenciais:', err);
        }
    };

    const fetchChats = async () => {
        if (!token) return;
        try {
            console.log('Buscando chats...');
            // Get instance name from ID for filtering
            const instanceName = (selectedInstance === 'all' || activeTab !== 'whatsapp')
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

    const fetchTeams = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/teams', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setTeams(await res.json());
        } catch (err) {
            console.error('Erro ao carregar equipes:', err);
        }
    };

    useEffect(() => {
        fetchInstances();
        fetchAiPrompts();
        fetchCredentials();
        fetchTeams();
    }, [token]);

    useEffect(() => {
        fetchChats();
        
        // Sync AI state for the newly selected instance
        if (selectedInstance !== 'all') {
            const inst = availableInstances.find(i => i.id === selectedInstance);
            if (inst) {
                setAiEnabled(inst.aiEnabled || false);
                setN8nEnabled(inst.n8nEnabled || false);
                setSelectedPromptId(inst.aiPromptId || null);
                setSelectedAiModel(inst.aiModel || 'gemini-1.5-flash');
            }
        } else {
            setAiEnabled(false);
            setN8nEnabled(false);
            setSelectedPromptId(null);
            setSelectedAiModel('gemini-1.5-flash');
        }
    }, [token, selectedInstance, availableInstances, activeTab]);

    // ✅ WebSocket Real-time Updates (REPLACES POLLING)
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg: any) => {
            console.log('📬 Nova mensagem recebida via Socket:', msg);
            
            // 1. Update Contacts List
            setContacts(prev => {
                const existing = prev.find(c => c.id === msg.contactId);
                const updatedContact = existing 
                    ? { ...existing, lastMessage: msg.content, updatedAt: new Date().toISOString() }
                    : { ...msg.contact, lastMessage: msg.content, updatedAt: new Date().toISOString(), provider: msg.provider };
                
                const filtered = prev.filter(c => c.id !== msg.contactId);
                return [updatedContact as Contact, ...filtered];
            });

            // 2. Update messages if current contact is selected
            if (selectedContact && msg.contactId === selectedContact.id) {
                setMessages(prev => {
                    const exists = prev.find(m => m.id === msg.id);
                    if (exists) return prev;
                    return [...prev, msg];
                });
            }
        };

        const handleContactUpdate = (data: any) => {
            console.log('👤 Contato atualizado via Socket:', data);
            setContacts(prev => prev.map(c => c.id === data.contactId ? { ...c, ...data } : c));
            
            if (selectedContact && data.contactId === selectedContact.id) {
                setContactAiEnabled(data.aiEnabled ?? null);
                setContactN8nEnabled(data.n8nEnabled ?? null);
            }
        };

        const handleMessageStatus = (data: any) => {
            setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, status: data.status } : m));
        };

        socket.on('new_message', handleNewMessage);
        socket.on('contact_transferred', handleContactUpdate);
        socket.on('contact_updated', handleContactUpdate);
        socket.on('message_status', handleMessageStatus);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('contact_transferred', handleContactUpdate);
            socket.off('contact_updated', handleContactUpdate);
            socket.off('message_status', handleMessageStatus);
        };
    }, [socket, selectedContact]);


    const handleSeed = async () => {
        if (!confirm(t[lang].seedConfirm)) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/seed', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert(t[lang].seedSuccess);
                fetchChats();
            }
        } catch (err) {
            alert(t[lang].seedError);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async () => {
        if (!selectedContact || !token) return;
        try {
            const res = await fetch(`/api/crm/chats/${selectedContact.id}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Only update if message count changed or we have new IDs to avoid unnecessary re-renders
                setMessages(prev => {
                    if (prev.length !== data.length || (data.length > 0 && prev[prev.length-1]?.id !== data[data.length-1]?.id)) {
                        return data;
                    }
                    return prev;
                });
            }
        } catch (err) {
            console.error('Erro ao carregar mensagens:', err);
        }
    };

    useEffect(() => {
        if (selectedContact && token) {
            console.log(`Iniciando chat: ${selectedContact.id}`);

            // Sync AI state for the newly selected contact
            setContactAiEnabled(selectedContact.aiEnabled ?? null);
            setContactN8nEnabled(selectedContact.n8nEnabled ?? null);

            // Initial load
            fetchMessages();
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
            alert(t[lang].uploadError);
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
                alert(data.message || t[lang].sendError);
                throw new Error(data.message || t[lang].sendError);
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
                    n8nEnabled: false, // Mutual exclusivity
                    promptId: selectedPromptId,
                    aiModel: selectedAiModel
                })
            });

            if (res.ok) {
                const data = await res.json();
                setAiEnabled(data.integration?.aiEnabled ?? !aiEnabled);
                setN8nEnabled(false);
                // Update availableInstances local state to keep it in sync
                setAvailableInstances(prev => prev.map(i =>
                    i.id === selectedInstance
                        ? {
                            ...i,
                            aiEnabled: data.integration?.aiEnabled ?? !aiEnabled,
                            n8nEnabled: false,
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

    const toggleN8n = async () => {
        if (!token || selectedInstance === 'all') return;

        if (!hasN8nWebhook) {
            if (confirm('Webhook do n8n não configurado. Deseja ir para as configurações agora?')) {
                router.push('/dashboard/settings/api');
            }
            return;
        }

        try {
            const res = await fetch(`/api/ai/integration/${selectedInstance}/toggle`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    enabled: false, // Mutual exclusivity
                    n8nEnabled: !n8nEnabled,
                    promptId: selectedPromptId,
                    aiModel: selectedAiModel
                })
            });

            if (res.ok) {
                const data = await res.json();
                setN8nEnabled(data.integration?.n8nEnabled ?? !n8nEnabled);
                setAiEnabled(false);
                // Update availableInstances local state to keep it in sync
                setAvailableInstances(prev => prev.map(i =>
                    i.id === selectedInstance
                        ? {
                            ...i,
                            n8nEnabled: data.integration?.n8nEnabled ?? !n8nEnabled,
                            aiEnabled: false
                        }
                        : i
                ));
            }
        } catch (err) {
            console.error('Erro ao alternar n8n:', err);
        }
    };

    const toggleContactAi = async () => {
        if (!token || !selectedContact) return;
        try {
            const newValue = contactAiEnabled === false ? null : false;
            const res = await fetch(`/api/crm/chats/${selectedContact.id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ aiEnabled: newValue })
            });
            if (res.ok) {
                const data = await res.json();
                setContactAiEnabled(data.aiEnabled);
                setContacts(prev => prev.map(c => c.id === selectedContact.id ? { ...c, aiEnabled: data.aiEnabled } : c));
            }
        } catch (err) { console.error('Erro ao alternar IA do contato:', err); }
    };

    const toggleContactN8n = async () => {
        if (!token || !selectedContact) return;
        try {
            const newValue = contactN8nEnabled === false ? null : false;
            const res = await fetch(`/api/crm/chats/${selectedContact.id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ n8nEnabled: newValue })
            });
            if (res.ok) {
                const data = await res.json();
                setContactN8nEnabled(data.n8nEnabled);
                setContacts(prev => prev.map(c => c.id === selectedContact.id ? { ...c, n8nEnabled: data.n8nEnabled } : c));
            }
        } catch (err) { console.error('Erro ao alternar n8n do contato:', err); }
    };

    const handleTeamTransfer = async (teamId: string | null) => {
        if (!token || !selectedContact) return;
        try {
            const res = await fetch('/api/teams/transfer', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contactId: selectedContact.id,
                    teamId: teamId
                })
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedContact({ ...selectedContact, assignedTeamId: teamId, aiEnabled: data.aiEnabled, n8nEnabled: data.n8nEnabled });
                setContacts(prev => prev.map(c => c.id === selectedContact.id ? { ...c, assignedTeamId: teamId, aiEnabled: data.aiEnabled, n8nEnabled: data.n8nEnabled } : c));
                setContactAiEnabled(data.aiEnabled);
                setContactN8nEnabled(data.n8nEnabled);
            }
        } catch (err) {
            console.error('Erro ao transferir equipe:', err);
        }
    };

    const handleFinishService = async () => {
        if (!token || !selectedContact) return;
        if (!confirm(t[lang].finishConfirm)) return;
        
        try {
            const res = await fetch(`/api/crm/chats/${selectedContact.id}/finish`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // Refresh contacts to show the updated status
                fetchChats();
                setSelectedContact(null); // Close the chat
            }
        } catch (err) {
            console.error('Erro ao finalizar atendimento:', err);
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

    const formatTime = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
        } catch (e) {
            return '';
        }
    };

    const filteredContacts = contacts.filter(contact => {
        if (activeTab === 'all') return true;
        return contact.provider === activeTab;
    });

    return (
        <div className="flex h-[calc(100vh-1rem)] md:h-[calc(100vh-2rem)] m-2 md:m-4 rounded-xl border border-gray-200 overflow-hidden relative shadow-sm" style={{ backgroundColor: '#ffffff', color: '#1a202c' }}>
            {/* Contact List */}
            <div className={`${selectedContact ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-gray-200 flex-col`} style={{ backgroundColor: '#ffffff' }}>
                <div className="p-5 border-b border-gray-200 space-y-4" style={{ backgroundColor: '#ffffff' }}>
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold" style={{ color: '#111827' }}>{t[lang].title}</h2>
                    </div>

                    {/* Instance Selector (WhatsApp Only) */}
                    {activeTab === 'whatsapp' && availableInstances.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t[lang].inbox}</label>
                            <div className="relative group/select">
                                <button
                                    onClick={() => document.getElementById('instance-dropdown')?.classList.toggle('hidden')}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary font-bold transition-all flex justify-between items-center"
                                    style={{ backgroundColor: '#ffffff', color: '#374151' }}
                                >
                                    <span>{selectedInstance === 'all' ? t[lang].allInboxes : availableInstances.find(i => i.id === selectedInstance)?.displayName}</span>
                                    <ChevronDown size={14} className="text-gray-400" />
                                </button>
                                <div id="instance-dropdown" className="hidden absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
                                    <button
                                        onClick={() => { setSelectedInstance('all'); document.getElementById('instance-dropdown')?.classList.add('hidden'); }}
                                        className={`w-full px-4 py-2 text-left text-sm font-bold transition-colors ${selectedInstance === 'all' ? 'bg-[#ef4444] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        {t[lang].allInboxes}
                                    </button>
                                    {availableInstances.map(inst => (
                                        <button
                                            key={inst.id}
                                            onClick={() => { setSelectedInstance(inst.id); document.getElementById('instance-dropdown')?.classList.add('hidden'); }}
                                            className={`w-full px-4 py-2 text-left text-sm font-bold transition-colors ${selectedInstance === inst.id ? 'bg-[#ef4444] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            {inst.displayName}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* AI Toggle & Prompt Selector */}
                            {selectedInstance !== 'all' && (
                                <div className="mt-3 p-3 rounded-xl border border-gray-200 space-y-2 shadow-sm" style={{ backgroundColor: '#ffffff', color: '#1f2937' }}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Bot className="w-4 h-4 text-primary" />
                                            <span className="text-sm font-medium">{t[lang].aiAgent}</span>
                                        </div>
                                        <button
                                            title={aiEnabled ? "Disable AI" : "Enable AI"}
                                            onClick={toggleAI}
                                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${aiEnabled ? 'bg-primary' : 'bg-gray-400'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${aiEnabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Terminal className="w-4 h-4 text-orange-500" />
                                            <span className="text-sm font-medium">{t[lang].n8nFlow}</span>
                                        </div>
                                        <button
                                            title={n8nEnabled ? "Disable n8n" : "Enable n8n"}
                                            onClick={toggleN8n}
                                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${n8nEnabled ? 'bg-orange-500' : 'bg-gray-400'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${n8nEnabled ? 'translate-x-6' : 'translate-x-1'
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
                                            className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 text-gray-700 font-medium"
                                        >
                                            <option value="">{t[lang].selectPrompt}</option>
                                            {aiPrompts.map(prompt => (
                                                <option key={prompt.id} value={prompt.id}>
                                                    {prompt.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {/* Gemini Model Selector */}
                                    {aiEnabled && <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{t[lang].engineModel}</label>
                                        <AiModelSelector
                                            value={selectedAiModel}
                                            token={token || ''}
                                            className="w-full text-white py-3 border-white/5"
                                            onChange={async (newModel) => {
                                                setSelectedAiModel(newModel);
                                                // Save immediately to backend
                                                if (token && selectedInstance !== 'all') {
                                                    await fetch(`/api/ai/integration/${selectedInstance}/toggle`, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${token}`
                                                        },
                                                        body: JSON.stringify({
                                                            enabled: aiEnabled,
                                                            promptId: selectedPromptId,
                                                            aiModel: newModel
                                                        })
                                                    });
                                                }
                                            }}
                                        />
                                    </div>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex p-1 rounded-xl overflow-x-auto no-scrollbar gap-1 border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
                        {['all', 'whatsapp', 'instagram', 'facebook'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-200 whitespace-nowrap`}
                                style={{ 
                                    backgroundColor: activeTab === tab ? '#ef4444' : 'transparent',
                                    color: activeTab === tab ? '#ffffff' : '#9ca3af'
                                }}
                            >
                                {tab === 'all' ? t[lang].all : tab}
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder={t[lang].searchChats}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition text-gray-700"
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
                            <p className="text-gray-500 text-sm mb-6">{t[lang].noConversations}</p>

                            {user?.role === 'superadmin' && (
                                <button
                                    onClick={handleSeed}
                                    className="w-full flex items-center justify-center space-x-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 py-3 rounded-xl transition font-bold text-xs uppercase tracking-widest"
                                >
                                    <Database className="w-4 h-4" />
                                    <span>{t[lang].generateTestData}</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredContacts.map((contact) => (
                            <button
                                key={contact.id}
                                onClick={() => setSelectedContact(contact)}
                                className={`w-full flex items-center space-x-3 p-4 transition-all duration-200 border-b border-gray-50`}
                                style={{ 
                                    backgroundColor: selectedContact?.id === contact.id ? '#ef4444' : '#ffffff'
                                }}
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
                                    <div className="flex items-center gap-1">
                                        <p className="font-bold truncate" style={{ color: selectedContact?.id === contact.id ? '#ffffff' : '#1f2937' }}>{contact.name || 'Contato'}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[11px] truncate" style={{ color: selectedContact?.id === contact.id ? '#ffffff' : '#6b7280', opacity: selectedContact?.id === contact.id ? 0.8 : 1 }}>{contact.lastMessage || 'Sem mensagens...'}</p>
                                        <span className="text-[10px] font-bold" style={{ color: selectedContact?.id === contact.id ? '#ffffff' : '#9ca3af', opacity: selectedContact?.id === contact.id ? 0.6 : 1 }}>{formatTime(contact.updatedAt)}</span>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`${selectedContact ? 'flex' : 'hidden md:flex'} flex-1 flex-col`} style={{ backgroundColor: '#f3f4f6' }}>
                {selectedContact ? (
                    <>
                        {/* Header */}
                        <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10 border-b border-gray-200" style={{ backgroundColor: '#ffffff' }}>
                            <div className="flex items-center space-x-3 w-full md:w-auto">
                                <button 
                                    onClick={() => setSelectedContact(null)}
                                    className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-500"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-400 shrink-0 border border-gray-200">
                                    {selectedContact.name?.charAt(0) || 'C'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold leading-tight truncate" style={{ color: '#111827' }}>{selectedContact.name || 'Contato'}</h3>
                                    <span className="text-[10px] font-bold uppercase" style={{ color: '#9ca3af' }}>
                                        {selectedContact.provider}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto p-1 rounded-xl" style={{ backgroundColor: '#ffffff' }}>
                                <button
                                    onClick={handleFinishService}
                                    className="flex items-center space-x-1 text-white px-3 py-1.5 rounded-lg transition-all font-bold text-[10px]"
                                    style={{ backgroundColor: '#ef4444' }}
                                >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>CONCLUIR</span>
                                </button>

                                {/* Team Selector */}
                                <div className="relative group/team">
                                    <button
                                        onClick={() => document.getElementById('team-dropdown')?.classList.toggle('hidden')}
                                        className="border border-gray-200 rounded-lg text-[10px] px-3 py-1.5 outline-none font-bold hover:border-primary transition-colors flex items-center gap-2"
                                        style={{ backgroundColor: '#ffffff', color: '#374151' }}
                                    >
                                        <span>{selectedContact.assignedTeamId ? teams.find(tm => tm.id === selectedContact.assignedTeamId)?.name : 'Equipe: Nenhuma'}</span>
                                        <ChevronDown size={12} className="text-gray-400" />
                                    </button>
                                    <div id="team-dropdown" className="hidden absolute top-full right-0 mt-1 w-48 border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
                                        <button
                                            onClick={() => { handleTeamTransfer(null); document.getElementById('team-dropdown')?.classList.add('hidden'); }}
                                            className={`w-full px-4 py-2 text-left text-[11px] font-bold transition-colors ${!selectedContact.assignedTeamId ? 'bg-[#ef4444] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            Equipe: Nenhuma
                                        </button>
                                        {teams.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => { handleTeamTransfer(t.id); document.getElementById('team-dropdown')?.classList.add('hidden'); }}
                                                className={`w-full px-4 py-2 text-left text-[11px] font-bold transition-colors ${selectedContact.assignedTeamId === t.id ? 'bg-[#ef4444] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Automation Toggle */}
                                <button
                                    onClick={async () => {
                                        const isPaused = contactAiEnabled === false && contactN8nEnabled === false;
                                        const newValue = isPaused ? null : false;
                                        const res = await fetch(`/api/crm/chats/${selectedContact.id}`, {
                                            method: 'PATCH',
                                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ aiEnabled: newValue, n8nEnabled: newValue })
                                        });
                                        if (res.ok) {
                                            const data = await res.json();
                                            setContactAiEnabled(data.aiEnabled);
                                            setContactN8nEnabled(data.n8nEnabled);
                                            setContacts(prev => prev.map(c => c.id === selectedContact.id ? { ...c, aiEnabled: data.aiEnabled, n8nEnabled: data.n8nEnabled } : c));
                                        }
                                    }}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold border ${
                                        contactAiEnabled === false && contactN8nEnabled === false
                                            ? 'bg-red-500 text-white'
                                            : 'bg-primary text-white'
                                    }`}
                                >
                                    <Bot className="w-3.5 h-3.5" />
                                    <span>{(contactAiEnabled === false && contactN8nEnabled === false) ? 'PAUSADO' : 'ATIVO'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ backgroundColor: '#ffffff' }}>
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-xl text-sm shadow-sm`} 
                                        style={{ 
                                            borderRadius: '15px',
                                            backgroundColor: msg.direction === 'outbound' ? '#ef4444' : '#f3f4f6',
                                            color: msg.direction === 'outbound' ? '#ffffff' : '#1f2937'
                                        }}>

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
                                        <div className={`text-[10px] mt-2 font-medium ${msg.direction === 'outbound' ? 'text-white/70 text-right' : 'text-gray-400 text-left'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-100 relative">
                            {/* File Upload Preview */}
                            {uploadedMedia && (
                                <div className="mb-3 flex items-center bg-slate-50 p-2 rounded-xl w-fit relative group border border-slate-100">
                                    {uploadedMedia.mimetype.startsWith('image/') ? (
                                        <img src={uploadedMedia.url} className="h-16 w-16 object-cover rounded-lg" />
                                    ) : (
                                        <div className="h-16 w-16 flex items-center justify-center bg-white rounded-lg text-slate-400 font-bold border border-slate-100 text-[10px]">FILE</div>
                                    )}
                                    <button
                                        onClick={() => setUploadedMedia(null)}
                                        className="absolute -top-1.5 -right-1.5 bg-slate-400 rounded-full p-1 shadow-sm hover:bg-slate-600 transition-colors"
                                    >
                                        <X size={10} className="text-white" />
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleSend} className="flex items-center gap-3">
                                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 flex items-center focus-within:border-slate-300 focus-within:bg-white transition-all">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Digite aqui..."
                                        className="flex-1 bg-transparent outline-none text-[13px] text-slate-700 placeholder-slate-400 font-medium"
                                    />
                                    <div className="flex items-center gap-2 ml-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <Paperclip size={18} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <Smile size={18} />
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={(!newMessage.trim() && !uploadedMedia) || isUploading}
                                    className="bg-primary hover:opacity-90 text-white p-3 rounded-xl transition-all disabled:opacity-30"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="font-semibold text-slate-600">Omni Inbox</p>
                        <p className="text-xs text-slate-400 mt-1">Selecione uma conversa para começar</p>
                    </div>
                )}
            </div>
        </div >
    );
}
