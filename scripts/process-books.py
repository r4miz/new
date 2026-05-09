"""
PDF Book Processor — extracts PDFs and seeds knowledge_chunks in Supabase
Usage: python3 scripts/process-books.py
Place PDFs in scripts/books/
"""
import os, re, sys, json, glob, urllib.request, urllib.error
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    print("Installing pypdf..."); os.system("pip3 install pypdf --break-system-packages -q")
    from pypdf import PdfReader

# ── Load env ──────────────────────────────────────────────────────────────────
def load_env():
    env_path = Path(__file__).parent.parent / ".env.local"
    if not env_path.exists():
        print("ERROR: .env.local not found. Run: npx vercel env pull .env.local")
        sys.exit(1)
    for line in env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())

# ── Supabase insert ───────────────────────────────────────────────────────────
def supabase_delete(url, key, source):
    """Delete existing chunks for this source (idempotent)"""
    req = urllib.request.Request(
        f"{url}/rest/v1/knowledge_chunks?source=eq.{urllib.parse.quote(source)}",
        method="DELETE",
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
    )
    try: urllib.request.urlopen(req)
    except: pass

def supabase_insert(url, key, rows):
    import urllib.parse
    data = json.dumps(rows).encode()
    req  = urllib.request.Request(
        f"{url}/rest/v1/knowledge_chunks",
        data=data,
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    try:
        urllib.request.urlopen(req)
        return True
    except urllib.error.HTTPError as e:
        print(f"  Insert error {e.code}: {e.read().decode()[:200]}")
        return False

# ── PDF processing ────────────────────────────────────────────────────────────
def extract_text(path):
    reader = PdfReader(path)
    parts  = []
    for page in reader.pages:
        text = page.extract_text() or ""
        parts.append(text)
    return "\n".join(parts)

def clean_text(text):
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\x20-\x7E\s]', '', text)
    return text.strip()

def chunk_text(text, source, chunk_size=400, overlap=60):
    words  = text.split()
    chunks = []
    i, n   = 0, 1
    while i < len(words):
        slice_   = words[i : i + chunk_size]
        content  = " ".join(slice_)
        if len(content) > 200 and '.' in content:
            preview = content[:80].rstrip()
            chunks.append({
                "title":    f"{source} — Part {n}: {preview}…",
                "source":   source,
                "category": "framework",
                "industry": None,
                "content":  content,
            })
            n += 1
        i += chunk_size - overlap
    return chunks

def process_pdf(path, source, supabase_url, supabase_key):
    print(f"\n📖  {source}")
    text    = clean_text(extract_text(path))
    words   = len(text.split())
    chunks  = chunk_text(text, source)
    print(f"    {words:,} words → {len(chunks)} chunks")

    # Delete old chunks for this book
    import urllib.parse
    req = urllib.request.Request(
        f"{supabase_url}/rest/v1/knowledge_chunks?source=eq.{urllib.parse.quote(source)}",
        method="DELETE",
        headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"},
    )
    try: urllib.request.urlopen(req)
    except: pass

    # Insert in batches of 50
    batch_size = 50
    inserted   = 0
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        if supabase_insert(supabase_url, supabase_key, batch):
            inserted += len(batch)
        print(f"    Inserted {inserted}/{len(chunks)}...", end="\r")

    print(f"    ✓ {inserted} chunks inserted      ")
    return inserted

def main():
    import urllib.parse
    load_env()

    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not supabase_url or not supabase_key:
        print("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)

    books_dir = Path(__file__).parent / "books"
    pdfs      = sorted(books_dir.glob("*.pdf"))

    if not pdfs:
        print(f"No PDFs found in {books_dir}")
        sys.exit(0)

    print(f"Found {len(pdfs)} PDF(s)\n")
    total = 0
    for pdf in pdfs:
        source   = pdf.stem.replace("_", " ").replace("-", " ")
        inserted = process_pdf(str(pdf), source, supabase_url, supabase_key)
        total   += inserted

    print(f"\n✅  Done — {total} total chunks seeded into knowledge_chunks")

if __name__ == "__main__":
    main()
