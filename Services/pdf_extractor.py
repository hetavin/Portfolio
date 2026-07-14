import PyPDF2

CHUNK_SIZE = 500  # characters per chunk


def extract_chunks(filepath):
    text = ""
    with open(filepath, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            page_text = page.extract_text() or ""
            text += page_text + "\n"

    # Split into overlapping chunks
    words = text.split()
    chunks, current = [], []
    char_count = 0

    for word in words:
        current.append(word)
        char_count += len(word) + 1
        if char_count >= CHUNK_SIZE:
            chunks.append(" ".join(current))
            current = current[-(CHUNK_SIZE // 10):]  # small overlap
            char_count = sum(len(w) + 1 for w in current)

    if current:
        chunks.append(" ".join(current))

    return [c.strip() for c in chunks if c.strip()]
