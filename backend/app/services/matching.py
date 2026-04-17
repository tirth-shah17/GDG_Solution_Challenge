import imagehash

def calculate_hamming_distance(hash1_str: str, hash2_str: str) -> int:
    """Calculate the Hamming distance between two image hashes."""
    hash1 = imagehash.hex_to_hash(hash1_str)
    hash2 = imagehash.hex_to_hash(hash2_str)
    return hash1 - hash2
