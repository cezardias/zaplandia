'use client';

import React, { useState, useEffect } from 'react';
import { 
    FileText, 
    Shield, 
    Lock, 
    Eye, 
    Scale, 
    UserCheck, 
    Database, 
    Globe, 
    AlertCircle, 
    ChevronRight,
    Server,
    ExternalLink,
    CheckCircle2
} from 'lucide-react';

export default function TermsPage() {
    const [lang, setLang] = useState('pt_BR');
    const [activeSection, setActiveSection] = useState('privacy');

    useEffect(() => {
        const saved = localStorage.getItem('zap_lang');
        if (saved) setLang(saved);
        
        const handleLangChange = () => {
            const current = localStorage.getItem('zap_lang');
            if (current) setLang(current);
        };
        window.addEventListener('languageChange', handleLangChange);
        return () => window.removeEventListener('languageChange', handleLangChange);
    }, []);

    const pt_BR = {
        header: {
            title: 'Governança, Privacidade e Termos',
            subtitle: 'Manual de Conformidade LGPD & Segurança de Dados - Zaplândia v2.0',
            update: 'Última Revisão Auditada: 24 de Abril de 2026',
        },
        tabs: {
            privacy: 'Política de Privacidade',
            terms: 'Termos de Serviço',
            security: 'Segurança & Infra',
            lgpd: 'Direitos do Titular'
        },
        content: {
            privacy: {
                title: 'Política de Privacidade e Tratamento de Dados',
                intro: 'Esta política descreve como a Plataforma Zaplândia (daqui em diante "Nós", "Operador") coleta e processa dados pessoais em nome de nossos clientes ("Controladores") e usuários finais ("Titulares").',
                sections: [
                    {
                        title: '1. Agentes de Tratamento',
                        text: 'Nos termos da Lei 13.709/2018 (LGPD), o Zaplândia atua predominantemente como OPERADOR de dados, processando informações sob as instruções do CLIENTE (Controlador).',
                        items: [
                            'Controlador: Empresa contratante da plataforma Zaplândia.',
                            'Operador: Zaplândia (Tecnologia e Automação).',
                            'Encarregado (DPO): dpo@zaplandia.com.br'
                        ]
                    },
                    {
                        title: '2. Dados Coletados e Finalidade',
                        text: 'Processamos dados necessários para a execução do contrato de automação de mensagens e CRM:',
                        items: [
                            'Dados de Cadastro: Nome, e-mail, telefone, CPF/CNPJ para faturamento.',
                            'Dados de Integração: Tokens de acesso Meta (WhatsApp/Instagram), IDs de WABA e IDs de contas empresariais.',
                            'Dados de Comunicação: Conteúdo de mensagens enviadas/recebidas via APIs oficiais para fins de histórico e automação.',
                            'Logs de Acesso: IP, navegador e geolocalização aproximada para fins de segurança e prevenção a fraudes.'
                        ]
                    },
                    {
                        title: '3. Compartilhamento com Terceiros',
                        text: 'Os dados podem ser compartilhados apenas com parceiros essenciais para o funcionamento do serviço:',
                        items: [
                            'Meta Platforms Inc.: Para processamento de mensagens via Cloud API.',
                            'Provedores de Nuvem (AWS/Google): Para armazenamento criptografado.',
                            'Processadores de Pagamento: Apenas dados financeiros necessários para cobrança.',
                            'Órgãos Judiciais: Quando exigido por ordem judicial ou obrigação legal.'
                        ]
                    },
                    {
                        title: '4. Retenção de Dados',
                        text: 'Mantemos os dados pelo tempo necessário para cumprir as finalidades descritas:',
                        items: [
                            'Dados de Chat: Mantidos conforme configuração do cliente (padrão 12 meses).',
                            'Dados Cadastrais: Mantidos por até 5 anos após o fim do contrato para fins fiscais.',
                            'Logs de Acesso: Retidos por 6 meses conforme Marco Civil da Internet.'
                        ]
                    }
                ]
            },
            terms: {
                title: 'Termos de Serviço e Uso da Plataforma',
                intro: 'Ao utilizar o Zaplândia, o usuário declara estar ciente das regras de utilização das APIs oficiais e das responsabilidades sobre o conteúdo trafegado.',
                sections: [
                    {
                        title: '1. Uso das APIs Oficiais da Meta',
                        text: 'O Zaplândia utiliza integrações oficiais via Cloud API. O cliente é responsável por manter a conformidade com as Políticas Comerciais do WhatsApp e do Instagram.',
                        items: [
                            'É proibido o envio de SPAM ou mensagens em massa sem opt-in.',
                            'A manutenção das credenciais (API Keys) é de responsabilidade do cliente.',
                            'Bloqueios por parte da Meta por uso indevido não geram direito a reembolso.'
                        ]
                    },
                    {
                        title: '2. Responsabilidade sobre IA e Automação',
                        text: 'O uso de Agentes de IA (Gemini/OpenRouter) é de inteira responsabilidade do Controlador.',
                        items: [
                            'O Controlador deve revisar as instruções (prompts) dadas à IA.',
                            'O Zaplândia não se responsabiliza por respostas geradas pela IA que possam ser consideradas ofensivas ou incorretas.',
                            'É obrigatório informar ao Titular que ele está interagindo com uma inteligência artificial.'
                        ]
                    },
                    {
                        title: '3. Disponibilidade e SLA',
                        text: 'Buscamos uma disponibilidade de 99.9%. No entanto, falhas nas APIs de terceiros (Meta, Google, etc.) estão fora do nosso controle direto.',
                        items: [
                            'Manutenções programadas serão informadas com 24h de antecedência.',
                            'O suporte técnico opera em regime 8x5 ou 24x7 conforme o plano contratado.'
                        ]
                    }
                ]
            },
            security: {
                title: 'Arquitetura de Segurança e Proteção',
                intro: 'Nossa infraestrutura segue os mais rígidos padrões de segurança digital para garantir a integridade e confidencialidade dos dados.',
                sections: [
                    {
                        title: 'Criptografia e Armazenamento',
                        text: 'Todos os dados sensíveis (tokens e chaves) são criptografados em repouso usando AES-256 e em trânsito via TLS 1.3.',
                        items: [
                            'Backups automáticos diários criptografados.',
                            'Isolamento de dados por Tenant (Multitenancy Seguro).',
                            'Monitoramento em tempo real de tentativas de intrusão.'
                        ]
                    },
                    {
                        title: 'Transferência Internacional',
                        text: 'Como utilizamos servidores em nuvem (AWS/Google Cloud) e integramos com a Meta, dados podem ser processados fora do território nacional, sempre sob cláusulas contratuais padrão de proteção.',
                        items: []
                    }
                ]
            },
            lgpd: {
                title: 'Portal do Titular (LGPD)',
                intro: 'Garantimos aos titulares dos dados o pleno exercício de seus direitos previstos nos Artigos 17 a 22 da LGPD.',
                sections: [
                    {
                        title: 'Como exercer seus direitos?',
                        text: 'O usuário ou seu cliente final pode solicitar a qualquer momento:',
                        items: [
                            'Confirmação da existência de tratamento.',
                            'Acesso e Correção de dados incompletos ou inexatos.',
                            'Anonimização ou bloqueio de dados desnecessários.',
                            'Portabilidade dos dados para outro fornecedor.',
                            'Eliminação dos dados (exceto quando necessário por lei).'
                        ]
                    }
                ]
            }
        }
    };

    const en_US = {
        header: {
            title: 'Governance, Privacy & Terms',
            subtitle: 'LGPD Compliance & Data Security Manual - Zaplândia v2.0',
            update: 'Last Audited Revision: April 24, 2026',
        },
        tabs: {
            privacy: 'Privacy Policy',
            terms: 'Terms of Service',
            security: 'Security & Infra',
            lgpd: 'Subject Rights'
        },
        content: {
            privacy: {
                title: 'Privacy Policy and Data Processing',
                intro: 'This policy describes how the Zaplândia Platform (hereinafter "We", "Processor") collects and processes personal data on behalf of our clients ("Controllers") and end-users ("Data Subjects").',
                sections: [
                    {
                        title: '1. Processing Agents',
                        text: 'Under Law 13.709/2018 (LGPD), Zaplândia acts predominantly as a DATA PROCESSOR, processing information under the CLIENT\'S instructions (Controller).',
                        items: [
                            'Controller: Company contracting the Zaplândia platform.',
                            'Processor: Zaplândia (Technology and Automation).',
                            'DPO: dpo@zaplandia.com.br'
                        ]
                    },
                    {
                        title: '2. Data Collected and Purpose',
                        text: 'We process data necessary for the execution of the message automation and CRM contract:',
                        items: [
                            'Registration Data: Name, email, phone, Tax ID for billing.',
                            'Integration Data: Meta access tokens (WhatsApp/Instagram), WABA IDs, and business account IDs.',
                            'Communication Data: Content of messages sent/received via official APIs for history and automation purposes.',
                            'Access Logs: IP, browser, and approximate geolocation for security and fraud prevention.'
                        ]
                    },
                    {
                        title: '3. Sharing with Third Parties',
                        text: 'Data may be shared only with partners essential for the operation of the service:',
                        items: [
                            'Meta Platforms Inc.: For message processing via Cloud API.',
                            'Cloud Providers (AWS/Google): For encrypted storage.',
                            'Payment Processors: Only financial data necessary for billing.',
                            'Judicial Bodies: When required by court order or legal obligation.'
                        ]
                    }
                ]
            },
            terms: {
                title: 'Terms of Service',
                intro: 'By using Zaplândia, the user declares to be aware of the rules for using official APIs and responsibilities over the transmitted content.',
                sections: [
                    {
                        title: '1. Use of Official Meta APIs',
                        text: 'Zaplândia uses official integrations via Cloud API. The client is responsible for maintaining compliance with WhatsApp and Instagram Commercial Policies.',
                        items: [
                            'SPAM or mass messaging without opt-in is prohibited.',
                            'Maintenance of credentials (API Keys) is the client\'s responsibility.',
                            'Blocks by Meta for misuse do not grant a right to a refund.'
                        ]
                    },
                    {
                        title: '2. AI and Automation Responsibility',
                        text: 'The use of AI Agents (Gemini/OpenRouter) is the sole responsibility of the Controller.',
                        items: [
                            'The Controller must review instructions (prompts) given to the AI.',
                            'Zaplândia is not responsible for AI-generated responses that may be considered offensive or incorrect.',
                            'It is mandatory to inform the Data Subject that they are interacting with an artificial intelligence.'
                        ]
                    }
                ]
            },
            security: {
                title: 'Security Architecture',
                intro: 'Our infrastructure follows the strictest digital security standards to ensure data integrity and confidentiality.',
                sections: [
                    {
                        title: 'Encryption and Storage',
                        text: 'All sensitive data (tokens and keys) are encrypted at rest using AES-256 and in transit via TLS 1.3.',
                        items: [
                            'Encrypted daily automatic backups.',
                            'Data isolation by Tenant (Secure Multitenancy).',
                            'Real-time intrusion attempt monitoring.'
                        ]
                    }
                ]
            },
            lgpd: {
                title: 'Data Subject Portal (LGPD/GDPR)',
                intro: 'We guarantee data subjects the full exercise of their rights as provided in the applicable data protection laws.',
                sections: [
                    {
                        title: 'Exercising your rights',
                        text: 'The user or their final customer can request at any time:',
                        items: [
                            'Confirmation of processing existence.',
                            'Access and correction of incomplete or inaccurate data.',
                            'Anonymization or blocking of unnecessary data.',
                            'Data portability to another provider.',
                            'Data deletion (except when required by law).'
                        ]
                    }
                ]
            }
        }
    };

    const it_IT = {
        header: {
            title: 'Governance, Privacy e Termini',
            subtitle: 'Manuale di Conformità LGPD & Sicurezza dei Dati - Zaplândia v2.0',
            update: 'Ultima Revisione Auditata: 24 Aprile 2026',
        },
        tabs: {
            privacy: 'Informativa Privacy',
            terms: 'Termini di Servizio',
            security: 'Sicurezza & Infra',
            lgpd: 'Diritti dell\'Interessato'
        },
        content: {
            privacy: {
                title: 'Informativa sulla Privacy e Trattamento dei Dati',
                intro: 'Questa informativa descrive come la Piattaforma Zaplândia (di seguito "Noi", "Responsabile") raccoglie e tratta i dati personali per conto dei nostri clienti ("Titolari") e degli utenti finali ("Interessati").',
                sections: [
                    {
                        title: '1. Agenti del Trattamento',
                        text: 'Ai sensi della normativa sulla protezione dei dati, Zaplândia opera prevalentemente come RESPONSABILE del trattamento, elaborando le informazioni secondo le istruzioni del CLIENTE (Titolare).',
                        items: [
                            'Titolare: Azienda che contratta la piattaforma Zaplândia.',
                            'Responsabile: Zaplândia (Tecnologia e Automazione).',
                            'DPO: dpo@zaplandia.com.br'
                        ]
                    },
                    {
                        title: '2. Dati Raccolti e Finalità',
                        text: 'Trattiamo i dati necessari per l\'esecuzione del contratto di automazione dei messaggi e CRM:',
                        items: [
                            'Dati di Registrazione: Nome, e-mail, telefono, ID fiscale per la fatturazione.',
                            'Dati di Integrazione: Token di accesso Meta (WhatsApp/Instagram), ID WABA e ID account aziendali.',
                            'Dati di Comunicazione: Contenuto dei messaggi inviati/ricevuti tramite API ufficiali.',
                            'Log di Accesso: IP, browser e geolocalizzazione approssimativa per sicurezza.'
                        ]
                    },
                    {
                        title: '3. Condivisione con Terze Parti',
                        text: 'I dati possono essere condivisi solo con partner essenziali per il funzionamento del servizio:',
                        items: [
                            'Meta Platforms Inc.: Per l\'elaborazione dei messaggi tramite Cloud API.',
                            'Provider Cloud (AWS/Google): Per l\'archiviazione crittografata.',
                            'Processori di Pagamento: Solo i dati finanziari necessari.'
                        ]
                    }
                ]
            },
            terms: {
                title: 'Termini di Servizio',
                intro: 'Utilizzando Zaplândia, l\'utente dichiara di essere a conoscenza delle regole per l\'utilizzo delle API ufficiali e delle responsabilità sui contenuti trasmessi.',
                sections: [
                    {
                        title: '1. Uso delle API Ufficiali Meta',
                        text: 'Zaplândia utilizza integrazioni ufficiali tramite Cloud API. Il cliente è responsabile del mantenimento della conformità con le Politiche Commerciali di WhatsApp e Instagram.',
                        items: [
                            'È vietato l\'invio di SPAM o messaggi di massa senza opt-in.',
                            'La manutenzione delle credenziali (API Keys) è responsabilità del cliente.',
                            'Blocchi da parte di Meta per uso improprio non danno diritto a rimborso.'
                        ]
                    },
                    {
                        title: '2. Responsabilità AI e Automazione',
                        text: 'L\'uso di Agenti AI (Gemini/OpenRouter) è di esclusiva responsabilità del Titolare.',
                        items: [
                            'Il Titolare deve revisionare le istruzioni (prompt) fornite all\'AI.',
                            'Zaplândia non è responsabile per le risposte generate dall\'AI.',
                            'È obbligatorio informare l\'Interessato che sta interagendo con un\'intelligenza artificiale.'
                        ]
                    }
                ]
            },
            security: {
                title: 'Architettura di Sicurezza',
                intro: 'La nostra infrastruttura segue i più severi standard di sicurezza digitale per garantire l\'integrità e la riservatezza dei dati.',
                sections: [
                    {
                        title: 'Crittografia e Archiviazione',
                        text: 'Tutti i dati sensibili sono crittografati a riposo tramite AES-256 e in transito tramite TLS 1.3.',
                        items: [
                            'Backup automatici giornalieri crittografati.',
                            'Isolamento dei dati per Tenant (Multitenancy Sicuro).',
                            'Monitoraggio in tempo reale dei tentativi di intrusione.'
                        ]
                    }
                ]
            },
            lgpd: {
                title: 'Portale dell\'Interessato (GDPR/LGPD)',
                intro: 'Garantiamo agli interessati il pieno esercizio dei loro diritti come previsto dalle leggi applicabili sulla protezione dei dati.',
                sections: [
                    {
                        title: 'Esercitare i propri diritti',
                        text: 'L\'utente o il suo cliente finale può richiedere in qualsiasi momento:',
                        items: [
                            'Conferma dell\'esistenza del trattamento.',
                            'Accesso e rettifica dei dati incompleti o inesatti.',
                            'Anonimizzazione o blocco dei dati non necessari.',
                            'Portabilità dei dati verso un altro fornitore.',
                            'Cancellazione dei dati (salvo quando richiesto dalla legge).'
                        ]
                    }
                ]
            }
        }
    };

    const pt_PT = {
        header: {
            title: 'Governação, Privacidade e Termos',
            subtitle: 'Manual de Conformidade LGPD & Segurança de Dados - Zaplândia v2.0',
            update: 'Última Revisão Auditada: 24 de Abril de 2026',
        },
        tabs: {
            privacy: 'Política de Privacidade',
            terms: 'Termos de Serviço',
            security: 'Segurança & Infra',
            lgpd: 'Direitos do Titular'
        },
        content: {
            privacy: {
                title: 'Política de Privacidade e Tratamento de Dados',
                intro: 'Esta política descreve como a Plataforma Zaplândia (doravante "Nós", "Operador") recolhe e processa dados pessoais em nome dos nossos clientes ("Controladores") e utilizadores finais ("Titulares").',
                sections: [
                    {
                        title: '1. Agentes de Tratamento',
                        text: 'Nos termos da lei, o Zaplândia atua predominantemente como OPERADOR de dados, processando informações sob as instruções do CLIENTE (Controlador).',
                        items: [
                            'Controlador: Empresa contratante da plataforma Zaplândia.',
                            'Operador: Zaplândia (Tecnologia e Automação).',
                            'Encarregado (DPO): dpo@zaplandia.com.br'
                        ]
                    },
                    {
                        title: '2. Dados Recolhidos e Finalidade',
                        text: 'Processamos dados necessários para a execução do contrato de automação de mensagens e CRM:',
                        items: [
                            'Dados de Registo: Nome, e-mail, telefone, NIF para faturação.',
                            'Dados de Integração: Tokens de acesso Meta (WhatsApp/Instagram), IDs de WABA e IDs de contas empresariais.',
                            'Dados de Comunicação: Conteúdo de mensagens enviadas/recebidas via APIs oficiais para fins de histórico e automação.',
                            'Logs de Acesso: IP, navegador e geolocalização aproximada para fins de segurança.'
                        ]
                    },
                    {
                        title: '3. Partilha com Terceiros',
                        text: 'Os dados podem ser partilhados apenas com parceiros essenciais para o funcionamento do serviço:',
                        items: [
                            'Meta Platforms Inc.: Para processamento de mensagens via Cloud API.',
                            'Provedores de Nuvem (AWS/Google): Para armazenamento encriptado.',
                            'Processadores de Pagamento: Apenas dados financeiros necessários.'
                        ]
                    }
                ]
            },
            terms: {
                title: 'Termos de Serviço',
                intro: 'Ao utilizar o Zaplândia, o utilizador declara estar ciente das regras de utilização das APIs oficiais e das responsabilidades sobre o conteúdo trafegado.',
                sections: [
                    {
                        title: '1. Uso das APIs Oficiais da Meta',
                        text: 'O Zaplândia utiliza integrações oficiais via Cloud API. O cliente é responsável por manter a conformidade com as Políticas Comerciais do WhatsApp e do Instagram.',
                        items: [
                            'É proibido o envio de SPAM ou mensagens em massa sem opt-in.',
                            'A manutenção das credenciais (API Keys) é de responsabilidade do cliente.',
                            'Bloqueios por parte da Meta por uso indevido não geram direito a reembolso.'
                        ]
                    },
                    {
                        title: '2. Responsabilidade sobre IA e Automação',
                        text: 'O uso de Agentes de IA (Gemini/OpenRouter) é de inteira responsabilidade do Controlador.',
                        items: [
                            'O Controlador deve rever as instruções (prompts) dadas à IA.',
                            'O Zaplândia não se responsabiliza por respostas geradas pela IA que possam ser consideradas ofensivas ou incorretas.',
                            'É obrigatório informar ao Titular que está a interagir com uma inteligência artificial.'
                        ]
                    }
                ]
            },
            security: {
                title: 'Arquitetura de Segurança',
                intro: 'A nossa infraestrutura segue os mais rígidos padrões de segurança digital para garantir a integridade e confidencialidade dos dados.',
                sections: [
                    {
                        title: 'Encriptação e Armazenamento',
                        text: 'Todos os dados sensíveis são encriptados em repouso usando AES-256 e em trânsito via TLS 1.3.',
                        items: [
                            'Backups automáticos diários encriptados.',
                            'Isolamento de dados por Tenant (Multitenancy Seguro).',
                            'Monitorização em tempo real de tentativas de intrusão.'
                        ]
                    }
                ]
            },
            lgpd: {
                title: 'Portal do Titular',
                intro: 'Garantimos aos titulares dos dados o pleno exercício dos seus direitos previstos na lei.',
                sections: [
                    {
                        title: 'Como exercer os seus direitos?',
                        text: 'O utilizador ou o seu cliente final pode solicitar a qualquer momento:',
                        items: [
                            'Confirmação da existência de tratamento.',
                            'Acesso e Correção de dados incompletos ou inexatos.',
                            'Anonimização ou bloqueio de dados desnecessários.',
                            'Portabilidade dos dados para outro fornecedor.',
                            'Eliminação dos dados (exceto quando necessário por lei).'
                        ]
                    }
                ]
            }
        }
    };

    const dictionary: any = { pt_BR, en_US, it_IT, pt_PT };
    const t = dictionary[lang] || pt_BR;
    const currentContent = (t.content as any)[activeSection];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
            {/* Header Section */}
            <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-md">
                    <div className="flex items-center space-x-6">
                        <div className="p-5 bg-primary/20 rounded-[28px] shadow-lg shadow-primary/10">
                            <Scale className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">{t.header.title}</h1>
                            <p className="text-gray-400 font-medium mt-1">{t.header.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Status: COMPLIANT</span>
                        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t.header.update}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-3 space-y-3 animate-in fade-in slide-in-from-left-4 duration-700 delay-150">
                    {Object.entries(t.tabs).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setActiveSection(key)}
                            className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl transition-all duration-300 font-bold text-sm ${
                                activeSection === key 
                                ? 'bg-primary text-white shadow-xl shadow-primary/20 translate-x-2' 
                                : 'bg-surface/60 border border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                            }`}
                        >
                            <div className="flex items-center space-x-4">
                                {key === 'privacy' && <Lock className="w-5 h-5" />}
                                {key === 'terms' && <FileText className="w-5 h-5" />}
                                {key === 'security' && <Shield className="w-5 h-5" />}
                                {key === 'lgpd' && <UserCheck className="w-5 h-5" />}
                                <span>{label}</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${activeSection === key ? 'rotate-90 opacity-100' : 'opacity-0'}`} />
                        </button>
                    ))}

                    <div className="mt-8 p-6 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-3xl">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-blue-500/20 rounded-xl">
                                <AlertCircle className="w-5 h-5 text-blue-400" />
                            </div>
                            <h4 className="text-sm font-bold text-blue-400">Audit Ready</h4>
                        </div>
                        <p className="text-xs text-blue-300/60 leading-relaxed font-medium">
                            Este documento foi estruturado para atender auditorias de conformidade Meta e órgãos reguladores de proteção de dados.
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-9 animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
                    <div className="bg-surface/40 border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl backdrop-blur-md min-h-[600px] flex flex-col">
                        <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-8">
                                <h2 className="text-3xl font-black text-white tracking-tight">{currentContent.title}</h2>
                                <div className="h-[2px] flex-1 bg-gradient-to-r from-primary/40 to-transparent rounded-full" />
                            </div>

                            <p className="text-gray-400 leading-relaxed mb-10 text-lg font-light">
                                {currentContent.intro}
                            </p>

                            <div className="space-y-12">
                                {currentContent.sections.map((section: any, idx: number) => (
                                    <div key={idx} className="group">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-4 mb-5 transition-transform duration-300 group-hover:translate-x-1">
                                            <div className="w-2 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                                            {section.title}
                                        </h3>
                                        <p className="text-gray-400 leading-relaxed font-light pl-6 mb-6">
                                            {section.text}
                                        </p>
                                        
                                        {section.items.length > 0 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                                                {section.items.map((item: string, i: number) => (
                                                    <div key={i} className="flex items-start space-x-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-colors duration-300">
                                                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                        <span className="text-sm text-gray-300 font-medium">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary Badges Footer */}
                        <div className="mt-16 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex items-center space-x-3 text-xs font-bold text-gray-500">
                                <Database className="w-4 h-4" />
                                <span>AES-256 Storage</span>
                            </div>
                            <div className="flex items-center space-x-3 text-xs font-bold text-gray-500">
                                <Server className="w-4 h-4" />
                                <span>Multi-Tenant Isolation</span>
                            </div>
                            <div className="flex items-center space-x-3 text-xs font-bold text-gray-500">
                                <Globe className="w-4 h-4" />
                                <span>AWS/GCP Hosting</span>
                            </div>
                            <div className="flex items-center space-x-3 text-xs font-bold text-gray-500">
                                <ExternalLink className="w-4 h-4" />
                                <span>Official Meta API</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="mt-10 text-center py-8">
                <p className="text-sm text-gray-600 font-medium">
                    &copy; 2026 Zaplândia Platform. Todos os direitos reservados. Conformidade auditada por Zaplândia Compliance Team.
                </p>
            </footer>
        </div>
    );
}
