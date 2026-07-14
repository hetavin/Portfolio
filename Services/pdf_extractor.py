import io
import PyPDF2

CHUNK_SIZE = 500


def extract_chunks(source):
    """Accept a file path (str) or raw bytes."""
    if isinstance(source, (bytes, bytearray)):
        stream = io.BytesIO(source)
    else:
        stream = open(source, "rb")

    try:
        reader = PyPDF2.PdfReader(stream)
        text = ""
        for page in reader.pages:
            text += (page.extract_text() or "") + "\n"
    finally:
        if not isinstance(source, (bytes, bytearray)):
            stream.close()

    words = text.split()
    chunks, current, char_count = [], [], 0
    for word in words:
        current.append(word)
        char_count += len(word) + 1
        if char_count >= CHUNK_SIZE:
            chunks.append(" ".join(current))
            current = current[-(CHUNK_SIZE // 10):]
            char_count = sum(len(w) + 1 for w in current)
    if current:
        chunks.append(" ".join(current))

    return [c.strip() for c in chunks if c.strip()]
