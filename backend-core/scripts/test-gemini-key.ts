import { DataSource } from 'typeorm';
import axios from 'axios';
import { ApiCredential } from '../src/integrations/entities/api-credential.entity';

const ds = new DataSource({
    type: 'postgres',
    url: 'postgres://postgres:postgres@localhost:5432/zaplandia',
    entities: [ApiCredential],
    synchronize: false,
});

async function run() {
    try {
        await ds.initialize();
        console.log('DB Connected');

        const tenantId = '3ac9368c-af7c-409d-86c3-85e4ad7dd9fe';
        const repo = ds.getRepository(ApiCredential);

        const cred = await repo.findOne({ where: { tenantId, key_name: 'GEMINI_API_KEY' } });

        if (!cred) {
            console.error('Credential not found in DB!');
            process.exit(1);
        }

        const apiKey = cred.key_value.trim();
        console.log(`Found Key: ${apiKey.substring(0, 10)}... (Length: ${apiKey.length})`);

        // Test with gemini-1.5-flash
        const model = 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        console.log(`Testing URL: ${url.replace(apiKey, 'HIDDEN')}`);

        try {
            const response = await axios.post(url, {
                contents: [{ parts: [{ text: "Hello" }] }]
            });
            console.log('SUCCESS! Model works.');
            console.log('Response:', response.data.candidates?.[0]?.content?.parts?.[0]?.text);
        } catch (error: any) {
            console.error('FAILED!');
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.error(error.message);
            }
        }
    } catch (err) {
        console.error('Script Error:', err);
    } finally {
        if (ds.isInitialized) await ds.destroy();
    }
}

run();
