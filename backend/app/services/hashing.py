from PIL import Image
import imagehash

def generate_perceptual_hash(image_path: str) -> str:
    """Generate a perceptual hash for an image."""
    image = Image.open(image_path)
    # Using phash for perceptual hashing which is generally robust
    hash_value = imagehash.phash(image)
    return str(hash_value)
