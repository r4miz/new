/**
 * PDF Book Processor — converts PDFs in scripts/books/ into knowledge_chunks
 * Run: npx tsx scripts/process-books.ts
 */
import fs from "fs"
import path from "path"
import { PDFParse } from "pdf-parse"
import { createClient } from "@supabase/supabase-js"

let supabase: ReturnType<typeof createClient>

const BOOKS_DIR  = path.join(process.cwd(), "scripts/books")
const CHUNK_SIZE = 400   // words per chunk
const OVERLAP    = 60    // words overlap between chunks (preserves context across boundaries)

function cleanText(text: string): string {
  return text
    .replace(/\f/g, " ")                    // form feeds → space
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]{3,}/g, "  ")           // collapse excessive spaces
    .replace(/\n{4,}/g, "\n\n\n")          // max 3 newlines
    .replace(/[^\x20-\x7E\n]/g, " ")       // strip non-ASCII garbage
    .trim()
}

function chunkText(text: string, source: string): Array<{ title: string; content: string; source: string }> {
  const words  = text.split(/\s+/).filter(w => w.length > 0)
  const chunks: Array<{ title: string; content: string; source: string }> = []
  let   i      = 0
  let   num    = 1

  while (i < words.length) {
    const slice   = words.slice(i, i + CHUNK_SIZE)
    const content = slice.join(" ")

    // Skip chunks that are mostly noise (very short or no real sentences)
    if (content.length > 150 && /[.!?]/.test(content)) {
      // Build a title from the first meaningful sentence fragment
      const firstLine = content.split(/[.!?\n]/)[0].trim().slice(0, 80)
      chunks.push({
        title:   `${source} — Part ${num}${firstLine ? ": " + firstLine : ""}`,
        content,
        source,
      })
      num++
    }

    i += CHUNK_SIZE - OVERLAP
  }

  return chunks
}

function inferCategory(filename: string): "framework" | "principle" {
  const lower = filename.toLowerCase()
  if (lower.includes("benchmark") || lower.includes("stat")) return "principle"
  return "framework"
}

async function processBook(filePath: string) {
  const filename  = path.basename(filePath, ".pdf")
  const source    = filename.replace(/_/g, " ").replace(/-/g, " ")
  const category  = inferCategory(filename)

  console.log(`\n📖 Processing: ${source}`)

  const buffer  = fs.readFileSync(filePath)
  const parser  = new PDFParse()
  const parsed  = await parser.parse(buffer)
  const cleaned = cleanText(parsed.text)

  console.log(`   ${parsed.numpages} pages · ${cleaned.split(/\s+/).length.toLocaleString()} words`)

  const chunks = chunkText(cleaned, source)
  console.log(`   → ${chunks.length} chunks`)

  // Delete existing chunks for this source (idempotent re-run)
  await supabase.from("knowledge_chunks").delete().eq("source", source)

  // Insert in batches of 50
  const BATCH = 50
  let inserted = 0
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH).map(c => ({
      title:    c.title,
      source:   c.source,
      category,
      industry: null,
      content:  c.content,
    }))
    const { error } = await supabase.from("knowledge_chunks").insert(batch)
    if (error) { console.error("   ✗ Insert error:", error.message); continue }
    inserted += batch.length
    process.stdout.write(`   Inserted ${inserted}/${chunks.length}...\r`)
  }

  console.log(`   ✓ Done — ${inserted} chunks inserted`)
}

async function main() {
  // Load env
  const envPath = path.join(process.cwd(), ".env.local")
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf-8").split("\n").forEach(line => {
      const [k, ...v] = line.split("=")
      if (k && v.length) process.env[k.trim()] = v.join("=").trim()
    })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    process.exit(1)
  }

  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const files = fs.readdirSync(BOOKS_DIR)
    .filter(f => f.toLowerCase().endsWith(".pdf"))
    .map(f => path.join(BOOKS_DIR, f))

  if (!files.length) {
    console.log("No PDFs found in scripts/books/")
    process.exit(0)
  }

  console.log(`Found ${files.length} PDF(s) to process`)

  for (const file of files) {
    await processBook(file)
  }

  console.log("\n✅ All books processed. Knowledge base updated.")
}

main().catch(console.error)
