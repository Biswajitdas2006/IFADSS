import os
import uuid
import tempfile
 
 
def save_temp_upload(file_bytes: bytes, suffix: str) -> str:
    tmp_dir = tempfile.gettempdir()
    file_path = os.path.join(tmp_dir, f"{uuid.uuid4()}{suffix}")
    with open(file_path, "wb") as f:
        f.write(file_bytes)
    return file_path
 
 
def cleanup_temp_file(file_path: str) -> None:
    try:
        os.remove(file_path)
    except OSError:
        pass