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
    ArrowLeft
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
                const hasUrl = creds.some((c: any) => c.key_name === 'N8N_WEBHOOK_URL' && c.key_value);
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
    }, [token, selectedInstance, availableInstances]);

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

    const filteredContacts = contacts.filter(contact => {
        if (activeTab === 'all') return true;
        return contact.provider === activeTab;
    });

    return (
        <div className="flex h-[calc(100vh-1rem)] md:h-[calc(100vh-2rem)] m-2 md:m-4 bg-surface rounded-2xl md:rounded-3xl border border-white/5 overflow-hidden relative">
            {/* Contact List */}
            <div className={`${selectedContact ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-white/5 flex-col`}>
                <div className="p-4 border-b border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">{t[lang].title}</h2>
                        {/* <button onClick={fetchChats} className="p-2 hover:bg-white/5 rounded-full"><Clock className="w-4 h-4"/></button> */}
                    </div>

                    {/* Instance Selector (WhatsApp Only) */}
                    {activeTab === 'whatsapp' && availableInstances.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 font-medium">{t[lang].inbox}</label>
                            <select
                                value={selectedInstance}
                                onChange={(e) => setSelectedInstance(e.target.value)}
                                className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="all">{t[lang].allInboxes}</option>
                                {availableInstances.map(inst => (
                                    <option key={inst.id} value={inst.id}>
                                        {inst.displayName}
                                    </option>
                                ))}
                            </select>

                            {/* AI Toggle & Prompt Selector */}
                            {selectedInstance !== 'all' && (
                                <div className="mt-3 p-3 bg-black/20 rounded-lg border border-white/10 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Bot className="w-4 h-4 text-primary" />
                                            <span className="text-sm font-medium">{t[lang].aiAgent}</span>
                                        </div>
                                        <button
                                            title={aiEnabled ? "Disable AI" : "Enable AI"}
                                            onClick={toggleAI}
                                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${aiEnabled ? 'bg-primary' : 'bg-gray-600'
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
                                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${n8nEnabled ? 'bg-orange-500' : 'bg-gray-600'
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
                                            className="w-full px-2 py-1.5 bg-black/30 border border-white/10 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
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
                                        <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">{t[lang].engineModel}</label>
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
                                {tab === 'all' ? t[lang].all : tab}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder={t[lang].searchChats}
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
                                    <div className="flex items-center gap-1">
                                        <p className="font-bold truncate">{contact.name || 'Contato'}</p>
                                        <div className="flex gap-0.5">
                                            {contact.aiEnabled !== false && <span className="text-[10px]" title="IA Ativa">🤖</span>}
                                            {contact.n8nEnabled !== false && <span className="text-[10px]" title="Fluxos Ativos">🔗</span>}
                                            {(contact.aiEnabled === false || contact.n8nEnabled === false) && <span className="text-[10px]" title="Automação Parcialmente Pausada">⏸️</span>}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-gray-500 truncate">{contact.lastMessage || 'Sem mensagens...'}</p>
                                        <span className="text-[10px] text-gray-400">12:30</span>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`${selectedContact ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-background/30`}>
                {selectedContact ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 bg-surface/50 backdrop-blur-sm flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <button 
                                    onClick={() => setSelectedContact(null)}
                                    className="md:hidden p-2 -ml-2 hover:bg-white/5 rounded-full text-gray-400"
                                >
                                    <ArrowLeft size={20} />
                                </button>
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
                                </a>

                                <button
                                    onClick={handleFinishService}
                                    className="flex items-center space-x-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 px-3 py-1.5 rounded-lg transition text-[10px] font-bold"
                                    title="Finalizar e Devolver para Automação"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>FINALIZAR</span>
                                </button>

                                {/* Team Selector */}
                                <select
                                    value={selectedContact.assignedTeamId || ''}
                                    onChange={(e) => handleTeamTransfer(e.target.value || null)}
                                    className="bg-black/20 border border-white/10 rounded-lg text-[10px] px-2 py-1 outline-none focus:border-primary transition max-w-[100px]"
                                    title="Atribuir a uma equipe"
                                >
                                    <option value="">Sem Equipe</option>
                                    {teams.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>

                                {/* Unified Automation Toggle */}
                                <button
                                    onClick={async () => {
                                        const isPaused = contactAiEnabled === false && contactN8nEnabled === false;
                                        const newValue = isPaused ? null : false; // null means inherit/active, false means specifically paused
                                        
                                        // Toggle both at once
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
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg ${
                                        contactAiEnabled === false && contactN8nEnabled === false
                                            ? 'bg-red-600 text-white border-b-4 border-red-800 active:border-b-0 active:translate-y-1'
                                            : 'bg-green-600/20 text-green-500 border border-green-500/30 hover:bg-green-500/30'
                                    }`}
                                >
                                    <Bot className={`w-4 h-4 ${(contactAiEnabled === false && contactN8nEnabled === false) ? 'animate-pulse' : ''}`} />
                                    <span>{(contactAiEnabled === false && contactN8nEnabled === false) ? 'Automação Pausada' : 'Automação Ativa'}</span>
                                </button>
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
                            <div ref={messagesEndRef} />
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
