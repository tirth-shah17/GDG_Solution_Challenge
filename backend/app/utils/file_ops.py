import os

def save_uploaded_file(file_content: bytes, filename: str, upload_dir: str = "uploads") -> str:
    """Save an uploaded file to the local directory."""
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename)
    with open(file_path, "wb") as f:
        f.write(file_content)
    return file_path
