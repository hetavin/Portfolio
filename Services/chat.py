from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL
import db

client = Groq(api_key=GROQ_API_KEY)


def _build_context():
    chunks = db.get_all_chunks()
    if not chunks:
        return ""
    return "\n\n".join(chunks)


def chat_with_ai(message):
    resume_context = _build_context()

    system_prompt = (
        "You are a helpful assistant on Hetavin Pokiya's portfolio website. "
        "Answer questions about Hetavin based strictly on the resume information provided below. "
        "If the answer is not in the resume, use your general knowledge about him but stay factual. "
        "Keep responses concise and friendly.\n\n"
    )

    if resume_context:
        system_prompt += f"--- Hetavin's Resume ---\n{resume_context}\n--- End of Resume ---"

    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": message},
        ],
        max_tokens=512,
        temperature=0.7,
    )
    return completion.choices[0].message.content
