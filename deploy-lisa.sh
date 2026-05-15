#!/bin/bash
# Script para criar o modelo zaplandia-lisa no Ollama
# Execute no servidor: bash deploy-lisa.sh

echo "🚀 Iniciando deploy da Lisa Zaplandia..."

# Copiar o Modelfile para dentro do container
docker cp ./ollama/Modelfile zaplandia-ollama:/tmp/Modelfile

echo "📦 Garantindo que a base está presente..."
docker exec zaplandia-ollama ollama pull qwen2.5:3b

echo "📦 Construindo modelo zaplandia-lisa..."
docker exec zaplandia-ollama ollama create zaplandia-lisa -f /tmp/Modelfile

echo "✅ Modelo zaplandia-lisa criado! Testando..."
docker exec zaplandia-ollama ollama run zaplandia-lisa "Olá Lisa, você está funcionando? Responda em 1 linha."

echo ""
echo "🎉 Lisa Zaplandia está pronta!"
echo "   Modelo: zaplandia-lisa"
echo "   Base:   qwen2.5:3b"
echo "   Ollama: http://localhost:11434"
