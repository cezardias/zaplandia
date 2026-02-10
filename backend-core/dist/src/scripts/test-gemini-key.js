"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const axios_1 = __importDefault(require("axios"));
const api_credential_entity_1 = require("../integrations/entities/api-credential.entity");
const ds = new typeorm_1.DataSource({
    type: 'postgres',
    url: 'postgres://postgres:postgres@localhost:5432/zaplandia',
    entities: [api_credential_entity_1.ApiCredential],
    synchronize: false,
});
async function run() {
    try {
        await ds.initialize();
        console.log('DB Connected');
        const tenantId = '3ac9368c-af7c-409d-86c3-85e4ad7dd9fe';
        const repo = ds.getRepository(api_credential_entity_1.ApiCredential);
        const cred = await repo.findOne({ where: { tenantId, key_name: 'GEMINI_API_KEY' } });
        if (!cred) {
            console.error('Credential not found in DB!');
            process.exit(1);
        }
        const apiKey = cred.key_value.trim();
        console.log(`Found Key: ${apiKey.substring(0, 10)}... (Length: ${apiKey.length})`);
        const model = 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        console.log(`Testing URL: ${url.replace(apiKey, 'HIDDEN')}`);
        try {
            const response = await axios_1.default.post(url, {
                contents: [{ parts: [{ text: "Hello" }] }]
            });
            console.log('SUCCESS! Model works.');
            console.log('Response:', response.data.candidates?.[0]?.content?.parts?.[0]?.text);
        }
        catch (error) {
            console.error('FAILED!');
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', JSON.stringify(error.response.data, null, 2));
            }
            else {
                console.error(error.message);
            }
        }
    }
    catch (err) {
        console.error('Script Error:', err);
    }
    finally {
        if (ds.isInitialized)
            await ds.destroy();
    }
}
run();
//# sourceMappingURL=test-gemini-key.js.map