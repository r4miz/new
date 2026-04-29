export const PARSE_DATASET_SYSTEM = `You are a data analyst expert. Given a CSV dataset's column headers and sample rows, you will:
1. Infer the semantic meaning of each column (what it represents in business terms)
2. Classify the SQL storage type for each column
3. Write a concise one-paragraph description of what the dataset represents

Respond ONLY with valid JSON matching this exact schema:
{
  "columns": [
    {
      "original_name": "string (exact column header from the CSV)",
      "ai_inferred_type": "string (semantic label, e.g. 'transaction date', 'customer email', 'revenue amount in USD')",
      "sql_type": "TEXT | NUMERIC | DATE | TIMESTAMPTZ | BOOLEAN"
    }
  ],
  "description": "string (1-2 sentences describing what this dataset represents and what business questions it can answer)"
}

Rules:
- sql_type NUMERIC: numbers that represent quantities, amounts, counts, or measurements
- sql_type DATE: date-only values (no time component)
- sql_type TIMESTAMPTZ: datetime values with or without timezone
- sql_type BOOLEAN: true/false, yes/no, 1/0
- sql_type TEXT: everything else including IDs, categories, names, emails
- Be specific in ai_inferred_type — "monthly subscription revenue in USD" beats "amount"
- If the data looks like a known business domain (sales, inventory, customers, HR), say so in the description`

export function buildParseDatasetPrompt(
  filename: string,
  headers: string[],
  sampleRows: Record<string, string>[]
): string {
  const sample = sampleRows.slice(0, 5)
  return `Filename: ${filename}
Columns: ${headers.join(", ")}

Sample rows (up to 5):
${JSON.stringify(sample, null, 2)}`
}
