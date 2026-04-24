'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import {
    Loader2,
    QrCode,
    Trash2,
    CheckCircle2,
    RefreshCw,
    Plus,
    Smartphone,
    XCircle,
    ArrowLeft,
    Phone,
    Link2,
    Bot,
    Save,
    X,
    Terminal,
    Settings
} from 'lucide-react';
import AiModelSelector from '@/components/AiModelSelector';

interface WhatsAppInstance {
    instanceName: string;
    name?: string;
    status?: string;
    connectionStatus?: string;
    profileName?: string;
    profilePicture?: string;
    tenantId?: string;
    instance?: {
        instanceName?: string;
        state?: string;
    };
}

export default function WhatsAppInstancesPage() {
    const { token, user } = useAuth();
    const { lang } = useLanguage();
    const router = useRouter();
    const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newInstanceName, setNewInstanceName] = useState('');
    const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('all');

    // AI Configuration
    const [aiModalInstance, setAiModalInstance] = useState<string | null>(null);
    const [aiConfig, setAiConfig] = useState({ enabled: false, promptId: '', aiModel: 'gemini-1.5-flash', n8nEnabled: false });
    const [isSavingAI, setIsSavingAI] = useState(false);
    const [isToggling, setIsToggling] = useState<string | null>(null);
    const [hasN8nWebhook, setHasN8nWebhook] = useState(false);
    const [savedPrompts, setSavedPrompts] = useState<any[]>([]);
    const [dbIntegrations, setDbIntegrations] = useState<any[]>([]); // DB integrations for AI config


    const t: any = {
        pt_BR: {
            title: 'Instâncias WhatsApp',
            subtitle: 'Gerencie seus números conectados via EvolutionAPI',
            update: 'Atualizar',
            errorConfig: 'A EvolutionAPI ainda não foi configurada no sistema.',
            configNow: 'Configurar Agora',
            serverError: 'Erro no Servidor Evolution: O servidor retornou erro 500. Verifique se a URL e a Chave estão corretas ou se o servidor Evolution está instável.',
            connError: 'Erro de conexão com o servidor',
            newInstance: 'Nova Instância',
            instancePlaceholder: 'Nome da instância (ex: vendas, suporte, marketing)',
            createInstance: 'Criar Instância',
            instanceNote: 'Cada instância representa um número de WhatsApp diferente que será conectado via QR Code.',
            yourInstances: 'Suas Instâncias',
            allUsers: 'Todos os Usuários',
            noInstances: 'Nenhuma instância criada',
            createFirst: 'Crie uma instância acima para conectar seu WhatsApp',
            connected: 'Conectado',
            disconnected: 'Desconectado',
            waiting: 'Aguardando Conexão',
            connectQr: 'Conectar (QR Code)',
            associateCampaign: 'Associar a Campanha',
            configure: 'Configurar',
            delete: 'Excluir',
            deleteConfirm: 'Tem certeza que deseja excluir a instância "{name}"?\n\nIsso irá desconectar o WhatsApp e remover todos os dados.',
            qrCode: 'QR Code',
            generatingQr: 'Gerando QR Code...',
            scanQr: 'Escaneie com seu WhatsApp',
            qrInstructions: 'WhatsApp > Menu > Aparelhos Conectados',
            refreshQr: 'Atualizar QR Code',
            instanceLabel: 'Instância',
            qrLoadError: 'Não foi possível carregar o QR Code',
            qrLoadErrorDesc: 'A API não retornou um código válido.',
            tryAgain: 'Tentar Novamente',
            connectYourWhatsapp: 'Conecte seu WhatsApp',
            connectClick: 'Clique em "Conectar (QR Code)" em uma instância ao lado',
            aiAgent: 'Agente de IA',
            aiToggle: 'Ativar Automação de IA',
            aiDesc: 'O robô responderá automaticamente às mensagens',
            n8nToggle: 'Automação via n8n',
            n8nDesc: 'Fluxos externos e webhooks',
            agentPrompt: 'Prompt do Agente',
            noPrompts: 'Nenhum prompt salvo. Crie prompts em Configurações > Agentes de IA primeiro.',
            selectPrompt: 'Selecione um prompt...',
            aiModel: 'Modelo de IA',
            aiModelDesc: 'Escolha o modelo de IA (Gemini ou OpenRouter).',
            cancel: 'Cancelar',
            saveConfig: 'Salvar Configuração',
            successCreate: 'Instância criada com sucesso!',
            successDelete: 'Instância excluída com sucesso!',
            successConnect: 'WhatsApp conectado com sucesso!',
            successAi: 'Configuração de automação salva com sucesso!',
            alreadyConnected: 'Esta instância já está conectada!',
            n8nNotConfigured: 'Webhook do n8n não configurado. Deseja ir para as configurações agora?',
            loadingInstances: 'Erro ao carregar instâncias',
            fetchCredsError: 'Erro ao buscar credenciais:',
            integrationNotFound: 'Integração não encontrada no banco de dados.',
            toggleError: 'Erro ao alternar automação',
            qrFetchError: 'Erro ao buscar QR Code',
            nameRequired: 'Digite um nome para a instância',
            deactivateAi: 'Desativar IA',
            activateAi: 'Ativar IA',
            deactivateN8n: 'Desativar n8n',
            activateN8n: 'Ativar n8n'
        },
        en_US: {
            title: 'WhatsApp Instances',
            subtitle: 'Manage your connected numbers via EvolutionAPI',
            update: 'Update',
            errorConfig: 'EvolutionAPI has not been configured in the system yet.',
            configNow: 'Configure Now',
            serverError: 'Evolution Server Error: The server returned error 500. Check if the URL and Key are correct or if the Evolution server is unstable.',
            connError: 'Server connection error',
            newInstance: 'New Instance',
            instancePlaceholder: 'Instance name (e.g., sales, support, marketing)',
            createInstance: 'Create Instance',
            instanceNote: 'Each instance represents a different WhatsApp number to be connected via QR Code.',
            yourInstances: 'Your Instances',
            allUsers: 'All Users',
            noInstances: 'No instances created',
            createFirst: 'Create an instance above to connect your WhatsApp',
            connected: 'Connected',
            disconnected: 'Disconnected',
            waiting: 'Waiting for Connection',
            connectQr: 'Connect (QR Code)',
            associateCampaign: 'Associate with Campaign',
            configure: 'Configure',
            delete: 'Delete',
            deleteConfirm: 'Are you sure you want to delete the instance "{name}"?\n\nThis will disconnect WhatsApp and remove all data.',
            qrCode: 'QR Code',
            generatingQr: 'Generating QR Code...',
            scanQr: 'Scan with your WhatsApp',
            qrInstructions: 'WhatsApp > Menu > Linked Devices',
            refreshQr: 'Refresh QR Code',
            instanceLabel: 'Instance',
            qrLoadError: 'Could not load QR Code',
            qrLoadErrorDesc: 'The API did not return a valid code.',
            tryAgain: 'Try Again',
            connectYourWhatsapp: 'Connect your WhatsApp',
            connectClick: 'Click "Connect (QR Code)" on an instance to the left',
            aiAgent: 'AI Agent',
            aiToggle: 'Enable AI Automation',
            aiDesc: 'The bot will automatically respond to messages',
            n8nToggle: 'Automation via n8n',
            n8nDesc: 'External flows and webhooks',
            agentPrompt: 'Agent Prompt',
            noPrompts: 'No prompts saved. Create prompts in Settings > AI Agents first.',
            selectPrompt: 'Select a prompt...',
            aiModel: 'AI Model',
            aiModelDesc: 'Choose the AI model (Gemini or OpenRouter).',
            cancel: 'Cancel',
            saveConfig: 'Save Configuration',
            successCreate: 'Instance created successfully!',
            successDelete: 'Instance deleted successfully!',
            successConnect: 'WhatsApp connected successfully!',
            successAi: 'Automation configuration saved successfully!',
            alreadyConnected: 'This instance is already connected!',
            n8nNotConfigured: 'n8n Webhook not configured. Do you want to go to settings now?',
            loadingInstances: 'Error loading instances',
            fetchCredsError: 'Error fetching credentials:',
            integrationNotFound: 'Integration not found in database.',
            toggleError: 'Error toggling automation',
            qrFetchError: 'Error fetching QR Code',
            nameRequired: 'Enter a name for the instance',
            deactivateAi: 'Deactivate AI',
            activateAi: 'Activate AI',
            deactivateN8n: 'Deactivate n8n',
            activateN8n: 'Activate n8n'
        },
        pt_PT: {
            title: 'Instâncias do WhatsApp',
            subtitle: 'Gerencie os seus números ligados via EvolutionAPI',
            update: 'Atualizar',
            errorConfig: 'A EvolutionAPI ainda não foi configurada no sistema.',
            configNow: 'Configurar Agora',
            serverError: 'Erro no Servidor Evolution: O servidor devolveu erro 500. Verifique se o URL e a Chave estão corretos ou se o servidor Evolution está instável.',
            connError: 'Erro de ligação com o servidor',
            newInstance: 'Nova Instância',
            instancePlaceholder: 'Nome da instância (ex: vendas, suporte, marketing)',
            createInstance: 'Criar Instância',
            instanceNote: 'Cada instância representa um número de WhatsApp diferente que será ligado via QR Code.',
            yourInstances: 'As Suas Instâncias',
            allUsers: 'Todos os Utilizadores',
            noInstances: 'Nenhuma instância criada',
            createFirst: 'Crie uma instância acima para ligar o seu WhatsApp',
            connected: 'Ligado',
            disconnected: 'Desligado',
            waiting: 'A aguardar ligação',
            connectQr: 'Ligar (QR Code)',
            associateCampaign: 'Associar a Campanha',
            configure: 'Configurar',
            delete: 'Eliminar',
            deleteConfirm: 'Tem a certeza que deseja eliminar a instância "{name}"?\n\nIsto irá desligar o WhatsApp e remover todos os dados.',
            qrCode: 'QR Code',
            generatingQr: 'A gerar QR Code...',
            scanQr: 'Digitalize com o seu WhatsApp',
            qrInstructions: 'WhatsApp > Menu > Dispositivos Ligados',
            refreshQr: 'Atualizar QR Code',
            instanceLabel: 'Instância',
            qrLoadError: 'Não foi possível carregar o QR Code',
            qrLoadErrorDesc: 'A API não devolveu um código válido.',
            tryAgain: 'Tentar Novamente',
            connectYourWhatsapp: 'Ligue o seu WhatsApp',
            connectClick: 'Clique em "Ligar (QR Code)" numa instância ao lado',
            aiAgent: 'Agente de IA',
            aiToggle: 'Ativar Automação de IA',
            aiDesc: 'O robô responderá automaticamente às mensagens',
            n8nToggle: 'Automação via n8n',
            n8nDesc: 'Fluxos externos e webhooks',
            agentPrompt: 'Prompt do Agente',
            noPrompts: 'Nenhum prompt guardado. Crie prompts em Definições > Agentes de IA primeiro.',
            selectPrompt: 'Selecione um prompt...',
            aiModel: 'Modelo de IA',
            aiModelDesc: 'Escolha o modelo de IA (Gemini ou OpenRouter).',
            cancel: 'Cancelar',
            saveConfig: 'Guardar Configuração',
            successCreate: 'Instância criada com sucesso!',
            successDelete: 'Instância eliminada com sucesso!',
            successConnect: 'WhatsApp ligado com sucesso!',
            successAi: 'Configuração de automação guardada com sucesso!',
            alreadyConnected: 'Esta instância já está ligada!',
            n8nNotConfigured: 'Webhook do n8n não configurado. Deseja ir para as definições agora?',
            loadingInstances: 'Erro ao carregar instâncias',
            fetchCredsError: 'Erro ao procurar credenciais:',
            integrationNotFound: 'Integração não encontrada na base de dados.',
            toggleError: 'Erro ao alternar automação',
            qrFetchError: 'Erro ao procurar QR Code',
            nameRequired: 'Introduza um nome para a instância',
            deactivateAi: 'Desativar IA',
            activateAi: 'Ativar IA',
            deactivateN8n: 'Desativar n8n',
            activateN8n: 'Ativar n8n'
        },
        it_IT: {
            title: 'Istanze WhatsApp',
            subtitle: 'Gestisci i tuoi numeri collegati tramite EvolutionAPI',
            update: 'Aggiorna',
            errorConfig: 'EvolutionAPI non è ancora stata configurata nel sistema.',
            configNow: 'Configura Ora',
            serverError: 'Errore del Server Evolution: Il server ha restituito l\'errore 500. Controlla se l\'URL e la Chiave sono corretti o se il server Evolution è instabile.',
            connError: 'Errore di connessione al server',
            newInstance: 'Nuova Istanza',
            instancePlaceholder: 'Nome istanza (es: vendite, supporto, marketing)',
            createInstance: 'Crea Istanza',
            instanceNote: 'Ogni istanza rappresenta un numero WhatsApp diverso da collegare tramite QR Code.',
            yourInstances: 'Le Tue Istanze',
            allUsers: 'Tutti gli Utenti',
            noInstances: 'Nessuna istanza creata',
            createFirst: 'Crea un\'istanza sopra per collegare il tuo WhatsApp',
            connected: 'Collegato',
            disconnected: 'Scollegato',
            waiting: 'In attesa di connessione',
            connectQr: 'Collega (QR Code)',
            associateCampaign: 'Associa a Campagna',
            configure: 'Configura',
            delete: 'Elimina',
            deleteConfirm: 'Sei sicuro di voler eliminare l\'istanza "{name}"?\n\nQuesto scollegherà WhatsApp e rimuoverà tutti i dati.',
            qrCode: 'QR Code',
            generatingQr: 'Generazione QR Code...',
            scanQr: 'Scansiona con il tuo WhatsApp',
            qrInstructions: 'WhatsApp > Menu > Dispositivi collegati',
            refreshQr: 'Aggiorna QR Code',
            instanceLabel: 'Istanza',
            qrLoadError: 'Impossibile caricare il QR Code',
            qrLoadErrorDesc: 'L\'API non ha restituito un codice valido.',
            tryAgain: 'Riprova',
            connectYourWhatsapp: 'Collega il tuo WhatsApp',
            connectClick: 'Clicca su "Collega (QR Code)" su un\'istanza a sinistra',
            aiAgent: 'Agente IA',
            aiToggle: 'Attiva Automazione IA',
            aiDesc: 'Il robot risponderà automaticamente ai messaggi',
            n8nToggle: 'Automazione tramite n8n',
            n8nDesc: 'Flussi esterni e webhook',
            agentPrompt: 'Prompt dell\'Agente',
            noPrompts: 'Nessun prompt salvato. Crea prima i prompt in Impostazioni > Agenti IA.',
            selectPrompt: 'Seleziona un prompt...',
            aiModel: 'Modello IA',
            aiModelDesc: 'Scegli il modello IA (Gemini o OpenRouter).',
            cancel: 'Annulla',
            saveConfig: 'Salva Configurazione',
            successCreate: 'Istanza creata con successo!',
            successDelete: 'Istanza eliminata con successo!',
            successConnect: 'WhatsApp collegato con successo!',
            successAi: 'Configurazione automazione salvata con successo!',
            alreadyConnected: 'Questa istanza è già collegata!',
            n8nNotConfigured: 'Webhook n8n non configurato. Vuoi andare alle impostazioni ora?',
            loadingInstances: 'Errore nel caricamento delle istanze',
            fetchCredsError: 'Errore nel recupero delle credenziali:',
            integrationNotFound: 'Integrazione non trovata nel database.',
            toggleError: 'Errore nell\'attivazione dell\'automazione',
            qrFetchError: 'Errore nel recupero del QR Code',
            nameRequired: 'Inserisci un nome per l\'istanza',
            deactivateAi: 'Disattiva IA',
            activateAi: 'Attiva IA',
            deactivateN8n: 'Disattiva n8n',
            activateN8n: 'Attiva n8n'
        }
    };

    // Language sync handled by useLanguage()


    useEffect(() => {
        if (token) {
            fetchInstances();
            fetchPrompts();
            fetchDbIntegrations();
            fetchCredentials();
        }
    }, [token]);

    const fetchCredentials = async () => {
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
            console.error(t[lang].fetchCredsError, err);
        }
    };

    const fetchPrompts = async () => {
        try {
            const res = await fetch('/api/ai/prompts', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setSavedPrompts(data);
            }
        } catch (e) { console.error('Failed to fetch prompts', e); }
    };

    const fetchDbIntegrations = async () => {
        try {
            const res = await fetch('/api/integrations', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setDbIntegrations(data.filter((i: any) => i.provider === 'evolution'));
            }
        } catch (e) { console.error('Failed to fetch db integrations', e); }
    };

    const openAiModal = (instanceName: string) => {
        const dbInt = dbIntegrations.find((i: any) =>
            i.credentials?.instanceName === instanceName ||
            i.settings?.instanceName === instanceName ||
            i.instanceName === instanceName
        );
        setAiModalInstance(instanceName);
        setAiConfig({
            enabled: dbInt?.aiEnabled || false,
            promptId: dbInt?.aiPromptId || '',
            aiModel: dbInt?.aiModel || 'gemini-1.5-flash',
            n8nEnabled: dbInt?.n8nEnabled || false
        });
    };

    const handleSaveAI = async () => {
        if (!aiModalInstance) return;
        setIsSavingAI(true);
        try {
            // Find DB integration for this instance to get the integration ID
            const dbInt = dbIntegrations.find((i: any) =>
                i.credentials?.instanceName === aiModalInstance ||
                i.settings?.instanceName === aiModalInstance ||
                i.instanceName === aiModalInstance
            );

            // Use the integration ID if found, otherwise use the instanceName (controller will create one)
            const integrationId = dbInt?.id || aiModalInstance;

            const res = await fetch(`/api/ai/integration/${integrationId}/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    enabled: aiConfig.enabled,
                    n8nEnabled: aiConfig.n8nEnabled,
                    promptId: aiConfig.promptId || undefined,
                    aiModel: aiConfig.aiModel
                })
            });

            if (res.ok) {
                setSuccessMessage(t[lang].successAi);
                setAiModalInstance(null);
                await fetchDbIntegrations(); // Refresh to show updated state
            } else {
                const err = await res.json();
                setError(`${t[lang].toggleError}: ${err.message || JSON.stringify(err)}`);
            }
        } catch (e: any) {
            setError(`${t[lang].toggleError}: ${e.message}`);
        } finally {
            setIsSavingAI(false);
        }
    };

    const toggleAutomation = async (instanceName: string, type: 'ai' | 'n8n', currentState: boolean) => {
        if (type === 'n8n' && !hasN8nWebhook) {
            if (confirm(t[lang].n8nNotConfigured)) {
                router.push('/dashboard/settings/api');
            }
            return;
        }

        setIsToggling(instanceName + type);
        try {
            const dbInt = dbIntegrations.find((i: any) =>
                i.credentials?.instanceName === instanceName ||
                i.settings?.instanceName === instanceName ||
                i.instanceName === instanceName
            );

            if (!dbInt) throw new Error(t[lang].integrationNotFound);

            const res = await fetch(`/api/ai/integration/${dbInt.id}/toggle`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    enabled: type === 'ai' ? !currentState : false,
                    n8nEnabled: type === 'n8n' ? !currentState : false,
                    promptId: dbInt.aiPromptId,
                    aiModel: dbInt.aiModel
                })
            });

            if (res.ok) {
                await fetchDbIntegrations();
            } else {
                setError(t[lang].toggleError);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsToggling(null);
        }
    };

    const fetchInstances = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/integrations/evolution/instances', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInstances(data);
            } else if (res.status === 401) {
                router.push('/auth/login');
            } else {
                const errData = await res.json();
                const errorMessage = errData.message || t[lang].loadingInstances;

                // Handle "EvolutionAPI not configured" vs Server Error
                if (errorMessage.includes('EvolutionAPI não configurada') || errorMessage.includes('not configured')) {
                    setError(t[lang].errorConfig);
                } else if (res.status === 500) {
                    setError(t[lang].serverError);
                } else {
                    setError(errorMessage);
                }
            }
        } catch (err: any) {
            setError(err.message || t[lang].connError);
        } finally {
            setIsLoading(false);
        }
    };

    const createInstance = async () => {
        if (!newInstanceName.trim()) {
            setError(t[lang].nameRequired);
            return;
        }
        setIsCreating(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const sanitizedName = newInstanceName.trim().replace(/\s+/g, '_').toLowerCase();
            const res = await fetch('/api/integrations/evolution/instance', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ instanceName: sanitizedName })
            });
            if (res.ok) {
                const data = await res.json();
                setNewInstanceName('');
                setSuccessMessage(t[lang].successCreate);
                await fetchInstances();
                await fetchInstances();
                // If QR code was returned, show it
                if (data.qrcode?.base64 || data.base64 || data.qrcode) {
                    const instanceName = data.instance?.instanceName || data.instanceName || `tenant_${user?.tenantId}_${sanitizedName}`;
                    setSelectedInstance(instanceName);
                    // Check if qrcode is object or string
                    const qr = data.qrcode?.base64 || data.base64 || (typeof data.qrcode === 'string' ? data.qrcode : null);
                    if (qr) setQrCode(qr);
                } else {
                    // Automatically try to fetch QR code if not returned (triggering backend auto-retry)
                    const instanceName = data.instance?.instanceName || data.instanceName || `tenant_${user?.tenantId}_${sanitizedName}`;
                    console.log("Auto-fetching QR code for:", instanceName);
                    setSelectedInstance(instanceName);
                    fetchQrCode(instanceName);
                }
            } else {
                const errData = await res.json();
                setError(errData.message || t[lang].newInstance + ' error');
            }
        } catch (err: any) {
            setError(err.message || t[lang].newInstance + ' error');
        } finally {
            setIsCreating(false);
        }
    };

    // Polling for status update when QR code is active
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (selectedInstance && qrCode) {
            interval = setInterval(async () => {
                try {
                    // Check specific instance status
                    const res = await fetch(`/api/integrations/evolution/status/${selectedInstance}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const statusData = await res.json();
                        // Evolution return like { instance: { state: 'open' } } or just { state: 'open' }
                        const state = statusData?.instance?.state || statusData?.state || 'unknown';

                        if (state === 'open' || state === 'connected') {
                            setQrCode(null); // Hide QR code
                            setSuccessMessage(t[lang].successConnect);
                            await fetchInstances(); // Refresh main list
                        }
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 3000); // Check every 3 seconds
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [selectedInstance, qrCode, token]);

    const fetchQrCode = async (instanceName: string) => {
        setQrLoading(true);
        setSelectedInstance(instanceName);
        setQrCode(null);
        setError(null);
        try {
            const res = await fetch(`/api/integrations/evolution/qrcode/${encodeURIComponent(instanceName)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.base64) {
                    setQrCode(data.base64);
                } else if (data.state === 'open' || data.status === 'open') {
                    setSuccessMessage(t[lang].alreadyConnected);
                    setQrCode(null);
                    await fetchInstances();
                } else if (data.code) {
                    // Some versions return code instead of base64
                    setQrCode(data.code);
                }
            } else {
                const errData = await res.json();
                setError(errData.message || t[lang].qrFetchError);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setQrLoading(false);
        }
    };

    const deleteInstance = async (instanceName: string) => {
        if (!confirm(t[lang].deleteConfirm.replace('{name}', getDisplayName(instanceName)))) return;
        setError(null);
        try {
            const res = await fetch(`/api/integrations/evolution/instance/${encodeURIComponent(instanceName)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSuccessMessage(t[lang].successDelete);
                await fetchInstances();
                if (selectedInstance === instanceName) {
                    setSelectedInstance(null);
                    setQrCode(null);
                }
            } else {
                const errData = await res.json();
                setError(errData.message || t[lang].delete + ' error');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getDisplayName = (instanceName: string) => {
        // Remove tenant prefix: tenant_<uuid>_<name> -> <name>
        const parts = instanceName.split('_');
        if (parts.length >= 3) {
            return parts.slice(2).join('_');
        }
        return instanceName;
    };

    const getStatus = (instance: WhatsAppInstance) => {
        const state = instance.instance?.state || instance.connectionStatus || instance.status || 'unknown';
        return state.toLowerCase();
    };

    const getStatusBadge = (instance: WhatsAppInstance) => {
        const status = getStatus(instance);
        if (status === 'open' || status === 'connected') {
            return (
                <span className="flex items-center space-x-1.5 px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t[lang].connected}</span>
                </span>
            );
        } else if (status === 'close' || status === 'disconnected' || status === 'closed') {
            return (
                <span className="flex items-center space-x-1.5 px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-xs font-bold">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t[lang].disconnected}</span>
                </span>
            );
        }
        return (
            <span className="flex items-center space-x-1.5 px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-bold">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t[lang].waiting}</span>
            </span>
        );
    };

    return (
        <div className="p-8 text-white pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.push('/dashboard/integrations')}
                        className="p-2 hover:bg-white/10 rounded-xl transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight flex items-center space-x-3">
                            <Smartphone className="w-8 h-8 text-primary" />
                            <span>{t[lang].title}</span>
                        </h1>
                        <p className="text-gray-400 mt-1">{t[lang].subtitle}</p>
                    </div>
                </div>
                <button
                    onClick={fetchInstances}
                    className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 transition font-bold text-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t[lang].update}</span>
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span>{error}</span>
                        {error.includes('configurada') && (
                            <button
                                onClick={() => router.push('/dashboard/settings/api')}
                                className="underline font-bold hover:text-red-300 ml-2"
                            >
                                {t[lang].configNow}
                            </button>
                        )}
                    </div>
                    <button onClick={() => setError(null)} className="hover:text-red-300">✕</button>
                </div>
            )}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center justify-between">
                    <span>{successMessage}</span>
                    <button onClick={() => setSuccessMessage(null)} className="hover:text-green-300">✕</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Create & List */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Create New Instance */}
                    <div className="bg-surface border border-white/10 rounded-2xl p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center space-x-2">
                            <Plus className="w-5 h-5 text-primary" />
                            <span>{t[lang].newInstance}</span>
                        </h2>
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                            <input
                                type="text"
                                value={newInstanceName}
                                onChange={(e) => setNewInstanceName(e.target.value)}
                                placeholder={t[lang].instancePlaceholder}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
                                onKeyDown={(e) => e.key === 'Enter' && createInstance()}
                            />
                            <button
                                onClick={createInstance}
                                disabled={isCreating}
                                className="bg-primary hover:bg-primary-dark px-8 py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition whitespace-nowrap"
                            >
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                <span>{t[lang].createInstance}</span>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            {t[lang].instanceNote}
                        </p>
                    </div>

                    {/* Instances List */}
                    <div className="bg-surface border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold flex items-center space-x-2">
                                <Phone className="w-5 h-5 text-primary" />
                                <span>{t[lang].yourInstances} ({instances.filter(inst => {
                                    if (user?.role !== 'superadmin' || selectedTenantFilter === 'all') return true;
                                    return inst.tenantId === selectedTenantFilter;
                                }).length})</span>
                            </h2>

                            {/* SuperAdmin Filter */}
                            {user?.role === 'superadmin' && instances.length > 0 && (() => {
                                // Get unique tenants from instances
                                const tenants = Array.from(new Set(instances.map(i => i.tenantId).filter(Boolean)));

                                if (tenants.length > 0) {
                                    return (
                                        <select
                                            value={selectedTenantFilter}
                                            onChange={(e) => setSelectedTenantFilter(e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition"
                                        >
                                            <option value="all">{t[lang].allUsers} ({instances.length})</option>
                                            {tenants.map(tenantId => {
                                                const count = instances.filter(i => i.tenantId === tenantId).length;
                                                return (
                                                    <option key={tenantId} value={tenantId || ''}>
                                                        Tenant: {tenantId?.substring(0, 8)}... ({count})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    );
                                }
                                return null;
                            })()}
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : instances.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Smartphone className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                <p className="text-lg font-bold">{t[lang].noInstances}</p>
                                <p className="text-sm mt-2">{t[lang].createFirst}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {instances.map((instance: any) => {
                                    const instanceName = instance.name || instance.instance?.instanceName || instance.instanceName;
                                    const isSelected = selectedInstance === instanceName;
                                    const status = getStatus(instance);
                                    const isConnected = status === 'open' || status === 'connected';

                                    return (
                                        <div
                                            key={instanceName}
                                            className={`p-4 border rounded-xl transition ${isSelected
                                                ? 'border-primary bg-primary/10'
                                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`p-3 rounded-xl ${isConnected ? 'bg-green-500/20' : 'bg-white/5'}`}>
                                                        <Smartphone className={`w-6 h-6 ${isConnected ? 'text-green-500' : 'text-gray-400'}`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-lg">{getDisplayName(instanceName)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    {getStatusBadge(instance)}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                                                {!isConnected && (
                                                    <button
                                                        onClick={() => fetchQrCode(instanceName)}
                                                        className="flex items-center space-x-2 bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg text-sm font-bold transition"
                                                    >
                                                        <QrCode className="w-4 h-4" />
                                                        <span>{t[lang].connectQr}</span>
                                                    </button>
                                                )}
                                                {isConnected && (() => {
                                                    const dbInt = dbIntegrations.find((i: any) =>
                                                        i.credentials?.instanceName === instanceName ||
                                                        i.settings?.instanceName === instanceName ||
                                                        i.instanceName === instanceName
                                                    );
                                                    const aiIsActive = dbInt?.aiEnabled;
                                                    const n8nIsActive = dbInt?.n8nEnabled;

                                                    return (
                                                        <>
                                                            <button
                                                                onClick={() => router.push(`/dashboard/crm/campaigns?instance=${instanceName}`)}
                                                                className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-bold transition border border-white/10"
                                                            >
                                                                <Link2 className="w-4 h-4" />
                                                                <span>{t[lang].associateCampaign}</span>
                                                            </button>

                                                            {/* quick automation toggles */}
                                                            <div className="flex items-center bg-black/20 rounded-lg p-1 border border-white/5 space-x-1">
                                                                <button
                                                                    title={aiIsActive ? t[lang].deactivateAi : t[lang].activateAi}
                                                                    disabled={isToggling !== null}
                                                                    onClick={() => toggleAutomation(instanceName, 'ai', aiIsActive)}
                                                                    className={`p-1.5 rounded-md transition-all flex items-center space-x-1 ${aiIsActive ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-gray-500 opacity-60'}`}
                                                                >
                                                                    <Bot className="w-4 h-4" />
                                                                    <span className="text-[10px] font-bold">IA</span>
                                                                </button>
                                                                <button
                                                                    title={n8nIsActive ? t[lang].deactivateN8n : t[lang].activateN8n}
                                                                    disabled={isToggling !== null}
                                                                    onClick={() => toggleAutomation(instanceName, 'n8n', n8nIsActive)}
                                                                    className={`p-1.5 rounded-md transition-all flex items-center space-x-1 ${n8nIsActive ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'bg-white/5 text-gray-500 opacity-60'}`}
                                                                >
                                                                    <Terminal className="w-4 h-4" />
                                                                    <span className="text-[10px] font-bold">n8n</span>
                                                                </button>
                                                            </div>

                                                            <button
                                                                onClick={() => openAiModal(instanceName)}
                                                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition border ${aiIsActive || n8nIsActive
                                                                    ? 'bg-primary/20 border-primary/40 text-primary'
                                                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                                                                    }`}
                                                            >
                                                                <Settings className="w-4 h-4" />
                                                                <span>{t[lang].configure}</span>
                                                            </button>
                                                        </>
                                                    );
                                                })()}
                                                <button
                                                    onClick={() => deleteInstance(instanceName)}
                                                    className="flex items-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg text-sm font-bold transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>{t[lang].delete}</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - QR Code */}
                <div className="lg:col-span-1">
                    <div className="bg-surface border border-white/10 rounded-2xl p-6 sticky top-8">
                        <h2 className="text-lg font-bold mb-4 flex items-center space-x-2">
                            <QrCode className="w-5 h-5 text-primary" />
                            <span>{t[lang].qrCode}</span>
                        </h2>

                        <div className="flex flex-col items-center justify-center min-h-[350px]">
                            {qrLoading ? (
                                <div className="text-center space-y-3">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                                    <p className="text-gray-400 text-sm">{t[lang].generatingQr}</p>
                                </div>
                            ) : qrCode ? (
                                <div className="text-center space-y-4">
                                    <div className="bg-white p-4 rounded-2xl inline-block shadow-xl">
                                        <img src={qrCode} alt="QR Code" className="w-56 h-56" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold">{t[lang].scanQr}</p>
                                        <p className="text-gray-400 text-xs">
                                            {t[lang].qrInstructions}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => selectedInstance && fetchQrCode(selectedInstance)}
                                        className="text-primary text-sm flex items-center space-x-1 mx-auto hover:underline"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        <span>{t[lang].refreshQr}</span>
                                    </button>
                                    <p className="text-gray-500 text-xs">
                                        {t[lang].instanceLabel}: {selectedInstance && getDisplayName(selectedInstance)}
                                    </p>
                                </div>
                            ) : selectedInstance && instances.find(i => (i.instance?.instanceName || i.instanceName || i.name) === selectedInstance && (getStatus(i) === 'open' || getStatus(i) === 'connected')) ? (
                                <div className="text-center space-y-4">
                                    <div className="p-4 bg-green-500/20 rounded-full inline-block">
                                        <CheckCircle2 className="w-16 h-16 text-green-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-green-500 font-bold text-lg">{t[lang].connected}!</p>
                                        <p className="text-gray-400 text-sm">{t[lang].alreadyConnected}</p>
                                    </div>
                                </div>
                            ) : selectedInstance ? (
                                <div className="text-center space-y-4 text-gray-500">
                                    <XCircle className="w-12 h-12 mx-auto opacity-30 text-red-400" />
                                    <div className="space-y-1">
                                        <p className="font-bold text-red-400">{t[lang].qrLoadError}</p>
                                        <p className="text-xs">{t[lang].qrLoadErrorDesc}</p>
                                        <button
                                            onClick={() => selectedInstance && fetchQrCode(selectedInstance)}
                                            className="text-primary text-sm flex items-center space-x-1 mx-auto hover:underline mt-2"
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            <span>{t[lang].tryAgain}</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-4 text-gray-500">
                                    <QrCode className="w-16 h-16 mx-auto opacity-30" />
                                    <div className="space-y-1">
                                        <p className="font-bold">{t[lang].connectYourWhatsapp}</p>
                                        <p className="text-sm">{t[lang].connectClick}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* AI Configuration Modal */}
                {aiModalInstance && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-surface border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 bg-primary/5 flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <div className="p-3 bg-white/5 rounded-2xl">
                                        <Bot className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black">{t[lang].aiAgent}</h2>
                                        <p className="text-gray-400 text-xs">{getDisplayName(aiModalInstance)}</p>
                                    </div>
                                </div>
                                <button onClick={() => setAiModalInstance(null)} className="p-2 hover:bg-white/10 rounded-xl transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-5">
                                {/* Toggle */}
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div>
                                        <p className="font-bold">{t[lang].aiToggle}</p>
                                        <p className="text-xs text-gray-400">{t[lang].aiDesc}</p>
                                    </div>
                                    <button
                                        onClick={() => setAiConfig({ ...aiConfig, enabled: !aiConfig.enabled, n8nEnabled: false })}
                                        className={`w-14 h-8 rounded-full transition-all relative ${aiConfig.enabled ? 'bg-primary' : 'bg-gray-600'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${aiConfig.enabled ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                {/* n8n Toggle in Modal */}
                                <div className={`flex flex-col p-4 rounded-2xl border transition-all ${aiConfig.n8nEnabled ? 'bg-orange-500/10 border-orange-500/40' : 'bg-white/5 border-white/5 opacity-60'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Terminal className={`w-5 h-5 ${aiConfig.n8nEnabled ? 'text-orange-500' : 'text-gray-500'}`} />
                                            <div>
                                                <p className="font-bold">{t[lang].n8nToggle}</p>
                                                <p className="text-[10px] text-gray-400">{t[lang].n8nDesc}</p>
                                            </div>
                                        </div>
                                        <button
                                            title={aiConfig.n8nEnabled ? t[lang].deactivateN8n : t[lang].activateN8n}
                                            onClick={() => {
                                                if (!hasN8nWebhook && !aiConfig.n8nEnabled) {
                                                    if (confirm(t[lang].n8nNotConfigured)) {
                                                        router.push('/dashboard/settings/api');
                                                    }
                                                    return;
                                                }
                                                setAiConfig({ ...aiConfig, n8nEnabled: !aiConfig.n8nEnabled, enabled: false });
                                            }}
                                            className={`w-12 h-6 rounded-full transition-all relative ${aiConfig.n8nEnabled ? 'bg-orange-500' : 'bg-gray-600'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${aiConfig.n8nEnabled ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Prompt Selector */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">{t[lang].agentPrompt}</label>
                                    {savedPrompts.length === 0 ? (
                                        <p className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                                            {t[lang].noPrompts}
                                        </p>
                                    ) : (
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-xl text-sm px-4 py-3 text-white outline-none focus:border-primary transition"
                                            value={aiConfig.promptId}
                                            onChange={(e) => setAiConfig({ ...aiConfig, promptId: e.target.value })}
                                        >
                                            <option value="">{t[lang].selectPrompt}</option>
                                            {savedPrompts.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    )}
                                    {aiConfig.promptId && (() => {
                                        const p = savedPrompts.find(x => x.id === aiConfig.promptId);
                                        return p ? (
                                            <p className="text-xs text-gray-400 bg-white/5 border border-white/10 rounded-xl p-3 line-clamp-3">{p.content}</p>
                                        ) : null;
                                    })()}
                                </div>

                                {/* Gemini Model Selector */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">{t[lang].aiModel}</label>
                                    <AiModelSelector
                                        value={aiConfig.aiModel}
                                        token={token || ''}
                                        className="w-full"
                                        onChange={(newModel) => setAiConfig({ ...aiConfig, aiModel: newModel })}
                                    />
                                    <p className="text-[10px] text-gray-500">{t[lang].aiModelDesc}</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 bg-white/5 flex space-x-3">
                                <button
                                    onClick={() => setAiModalInstance(null)}
                                    className="flex-1 px-4 py-3 rounded-2xl border border-white/10 font-bold hover:bg-white/5 transition text-sm"
                                >
                                    {t[lang].cancel}
                                </button>
                                <button
                                    onClick={handleSaveAI}
                                    disabled={isSavingAI || (aiConfig.enabled && !aiConfig.promptId)}
                                    className="flex-[2] bg-primary hover:bg-primary-dark text-white px-4 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {isSavingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    <span>{t[lang].saveConfig}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
