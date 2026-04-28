import sys
import os

sys.path.append(r"a:\Github_Repos\GDG_Solution_Challenge\backend")

from PIL import Image
from app.services.gemini_service import generate_explanation

img1_path = "test1.jpg"
img2_path = "test2.jpg"
Image.new('RGB', (100, 100), color = 'red').save(img1_path)
Image.new('RGB', (100, 100), color = 'red').save(img2_path)

print("Testing generate_explanation...")
exp = generate_explanation(img1_path, img2_path)
print("Explanation:", exp)
