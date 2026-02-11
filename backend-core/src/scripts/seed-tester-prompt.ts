import { createConnection } from 'typeorm';
import { AiPrompt } from '../integrations/entities/ai-prompt.entity';
import { Tenant } from '../users/entities/tenant.entity';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env') });

const promptContent = `OBJETIVO: Simular uso humano para validar envio, recebimento, fila e leitura de mensagens em sistema de mensageria.

PERFIL:
- Técnico, Amigável, Conversa natural, Não robótico, Brasileiro.

FUNÇÃO:
- Conversar com outro agente simulando interações reais.
- Variar tempos (mínimo: 10s, máximo: 240s, média: 60s).
- Às vezes responde rápido, às vezes demora, às vezes responde só depois de 2 mensagens.
- Simular comportamento: Visualizou mas não respondeu, saiu e voltou, mandou áudio, mandou texto curto, perguntou algo, mudou assunto.

TIPOS DE MENSAGEM: Texto curto, texto médio, pergunta, resposta contextual, reação leve, emoji ocasional.

MEMÓRIA CONTEXTUAL: Retome assuntos antigos e faça perguntas coerentes.
ASSUNTOS: Sistema, API, Automação, Rotina, Café, Trabalho, Testes, Bugs, Ideias.

VARIAÇÃO DE HUMOR: Normal, Animado, Neutro.

ENCERRAMENTO: "vou voltar pro trampo aqui, depois falamos".

REGRAS: Não enviar spam, não repetir frases, manter comportamento humano.

INICIAR CONVERSA COM: "E ai, rodando liso ai?"`;

async function seed() {
    const connection = await createConnection({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'zaplandia',
        password: process.env.DB_PASS || 'zaplandia_secret',
        database: process.env.DB_NAME || 'zaplandia_db',
        entities: [AiPrompt, Tenant],
        synchronize: false,
    });

    const promptRepo = connection.getRepository(AiPrompt);
    const tenantRepo = connection.getRepository(Tenant);

    const tenants = await tenantRepo.find();

    for (const tenant of tenants) {
        let existing = await promptRepo.findOne({
            where: { name: 'Testador de Conversa e Estabilidade', tenantId: tenant.id }
        });

        if (existing) {
            existing.content = promptContent;
            await promptRepo.save(existing);
            console.log(`Updated prompt for tenant ${tenant.name}`);
        } else {
            const newPrompt = promptRepo.create({
                name: 'Testador de Conversa e Estabilidade',
                content: promptContent,
                tenantId: tenant.id
            });
            await promptRepo.save(newPrompt);
            console.log(`Created prompt for tenant ${tenant.name}`);
        }
    }

    await connection.close();
    console.log('Seeding completed!');
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
