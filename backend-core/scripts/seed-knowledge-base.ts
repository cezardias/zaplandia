import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SupportService } from '../src/support/support.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const logger = new Logger('SeedKnowledgeBase');
    logger.log('Starting Knowledge Base Seed...');

    const app = await NestFactory.createApplicationContext(AppModule);
    const supportService = app.get(SupportService);

    const articles = [
        {
            title: 'Conexão WhatsApp (Instância Local)',
            category: 'onboarding',
            tags: ['whatsapp', 'conexão', 'qrcode'],
            content: `
# Como Conectar seu WhatsApp (Instância Local)

Este procedimento explica como conectar seu WhatsApp usando o método de Instância Local (WhatsApp Manager).

### Passo a Passo:
1. Acesse o menu **Conexões** no painel lateral.
2. Clique em **Nova Instância**.
3. Escolha um nome para sua conexão (ex: "WhatsApp Comercial").
4. Clique em **Gerar QR Code**.
5. Abra o WhatsApp no seu celular, vá em **Aparelhos Conectados** e leia o QR Code exibido na tela.

### Dicas:
- Mantenha o celular com internet estável para a primeira sincronização.
- Você pode desconectar e reconectar a qualquer momento se houver perda de sinal.
            `
        },
        {
            title: 'Conexão Meta API (WhatsApp Oficial)',
            category: 'onboarding',
            tags: ['meta', 'api', 'oficial'],
            content: `
# Configurando o WhatsApp Oficial (Meta API)

Para empresas que precisam de escala e verificação, recomendamos a API Oficial da Meta.

### Requisitos:
- Conta no **Meta Business Suite**.
- **Access Token** permanente.
- **Phone Number ID** e **WABA ID**.

### Configuração:
1. Vá em **Integrações > Meta API**.
2. Insira as credenciais obtidas no Portal do Desenvolvedor da Meta.
3. Salve e valide a conexão.
4. Para criar modelos de mensagem (Templates), acesse a aba **Templates BBM**.

*Nota: Mensagens enviadas pela API oficial possuem custos por conversa definidos pela Meta.*
            `
        },
        {
            title: 'CRM: Gerenciando seu Funil de Vendas',
            category: 'crm',
            tags: ['pipeline', 'funil', 'leads'],
            content: `
# Como Criar e Gerenciar seu Funil no Zaplandia CRM

O CRM permite que você visualize o progresso dos seus clientes em tempo real.

### Etapas do Pipeline:
1. Vá em **CRM > Pipeline**.
2. Clique em **Configurar Etapas**.
3. Crie etapas como: "Novo Lead", "Em Atendimento", "Proposta Enviada", "Fechado".
4. Arraste os cards dos clientes entre as colunas para atualizar o status.

### Automação de Funil:
Você pode configurar palavras-chave para mover o cliente automaticamente. Ex: Quando o cliente responder "QUERO", ele move para a etapa "Interessado".
            `
        },
        {
            title: 'n8n: Recebendo Dados via Webhook',
            category: 'automations',
            tags: ['n8n', 'webhook', 'integração'],
            content: `
# Como Receber Eventos da Zaplandia no n8n

Use este procedimento para iniciar automações sempre que receber uma mensagem ou um novo lead.

### No n8n:
1. Crie um novo workflow.
2. Adicione um nó do tipo **Webhook**.
3. Defina o método como **POST** e o caminho como \`zaplandia-inbound\`.
4. Copie a **URL de Teste** ou **URL de Produção**.

### Na Zaplandia:
1. Vá em **Integrações > Webhooks**.
2. Cole a URL do n8n no campo correspondente ao evento desejado (ex: "Novas Mensagens").
3. Salve. A partir de agora, cada mensagem enviará um JSON para o seu n8n.
            `
        },
        {
            title: 'n8n: Enviando Mensagens pela API Zaplandia',
            category: 'automations',
            tags: ['n8n', 'api', 'envio'],
            content: `
# Como Responder Clientes através do n8n

Após processar dados no n8n, você pode usar a API da Zaplandia para enviar a resposta final.

### Configuração do nó HTTP Request:
- **Method**: POST
- **URL**: \`https://api.zaplandia.com.br/messages\`
- **Authentication**: Header 'X-API-KEY' com seu token da Zaplandia.
- **Body Parameters**:
  - \`number\`: O número do cliente (ex: \`{{ $json.from }}\`)
  - \`content\`: O texto da sua resposta.

### Exemplo de JSON de envio:
\`\`\`json
{
  "number": "5511999999999@s.whatsapp.net",
  "content": "Olá! Sua solicitação foi processada com sucesso."
}
\`\`\`
            `
        },
        {
            title: 'Como Abrir um Chamado de Suporte',
            category: 'suporte',
            tags: ['chamado', 'ticket', 'ajuda'],
            content: `
# Como Abrir um Chamado de Suporte Técnico

No Zaplandia, você tem duas formas de abrir um chamado caso precise de ajuda especializada.

### 1. Manualmente pelo Painel:
1. Acesse a **Central de Ajuda** no menu lateral.
2. Clique na aba **"Meus Chamados"**.
3. Clique no botão vermelho **"+ Novo Chamado"**.
4. Preencha o Assunto, a Descrição detalhada do seu problema e selecione a Categoria (ex: Financeiro, Técnico, Dúvida).
5. Clique em Enviar. Seu chamado aparecerá na lista com um número de protocolo.

### 2. Através da Lisa (Sua Assistente IA):
Você pode simplesmente conversar com a Lisa aqui na Central de Ajuda ou no WhatsApp da Zaplandia. 
- Exemplo: *"Lisa, abra um chamado porque meu n8n não está conectando"*.
- A Lisa fará algumas perguntas para entender o problema e abrirá o ticket automaticamente para você.

**Dica**: Sempre anexe prints ou logs se estiver abrindo manualmente para que nossa equipe resolva mais rápido!
            `
        }
    ];

    for (const article of articles) {
        logger.log(`Seeding article: ${article.title}`);
        await supportService.create(article);
    }

    logger.log('Knowledge Base Seed completed successfully!');
    await app.close();
}

bootstrap();
