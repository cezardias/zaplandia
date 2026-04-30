from PIL import Image
import os

# Caminho da imagem original
img_path = "frontend/public/logo_zaplandia.png"
output_path = "frontend/public/logo_final.png"

if os.path.exists(img_path):
    img = Image.open(img_path)
    # Converter para RGB para garantir a detecção de cores
    img_rgb = img.convert("RGB")
    
    # Encontrar a caixa delimitadora do quadrado vermelho (#ef4444 ou aproximado)
    # Vamos procurar por qualquer pixel que não seja branco
    bg = Image.new(img.mode, img.size, img.getpixel((0,0)))
    diff = Image.ImageChops.difference(img, bg)
    diff = Image.ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    
    if bbox:
        # Cortar a imagem na caixa encontrada
        logo_cropped = img.crop(bbox)
        # Salvar a logo limpa
        logo_cropped.save(output_path)
        print(f"Logo cortada com sucesso: {bbox}")
    else:
        print("Não foi possível detectar a logo na imagem.")
else:
    print("Imagem original não encontrada.")
