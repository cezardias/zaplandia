# Zaplândia - CRM Omnichannel com IA

O Zaplândia é um CRM de ponta projetado para centralizar o atendimento de múltiplos canais (WhatsApp, Instagram, Facebook, Mercado Livre) em um único Omni Inbox, potencializado por agentes de Inteligência Artificial e automações n8n.

## 🚀 Tecnologias
- **Backend**: NestJS (Node.js) + TypeORM + PostgreSQL
- **Frontend**: Next.js 16 + Tailwind CSS + Lucide Icons
- **Integrações**: EvolutionAPI, Meta Graph API v21.0, n8n

## ✨ Recursos Recentes (v1.2) - Estabilização e Meta Review
Preparamos o sistema para a aprovação completa como Provedor de Tecnologia da Meta:

- **Controle Granular de Automação**: No Omni Inbox, agora é possível pausar a IA e os fluxos de n8n individualmente por contato. Ideal para migração rápida entre atendimento automatizado e humano.
- **Gestão de Templates WhatsApp (BBM)**: Interface nativa para criação, submissão e monitoramento de modelos de mensagem aprovados pela Meta diretamente do painel de integrações.
- **Protocolo de Entrega Estabilizado**: Refatoração do sistema de identificação de contatos (LID para JID/Phone) garantindo 100% de sucesso no envio de mensagens via EvolutionAPI.
- **Deduplicação Inteligente**: Mesclagem automática de contatos duplicados por múltiplos identificadores da Meta.

## 🛠️ Instalação e Execução
O sistema é totalmente dockerizado para facilitar o deploy:

```bash
docker compose build
docker compose up -d
```

---
*Zaplandia - O Melhor CRM Omnichannel para o seu negócio.*
