import fs from "fs/promises";
import path from "path";

export interface CompanyData {
  id: string;
  name: string;
  content: string;
  metadata: {
    industry?: string;
    website?: string;
    lastUpdated: string;
  };
}

// In-memory store for company data (for MVP - can be replaced with vector DB later)
const companyStore = new Map<string, CompanyData>();

const DATA_DIR = path.join(process.cwd(), "..", "data", "companies");

/**
 * Load all company data from the data directory
 */
export async function loadCompanyData(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const files = await fs.readdir(DATA_DIR);

    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = path.join(DATA_DIR, file);
        const content = await fs.readFile(filePath, "utf-8");
        const data = JSON.parse(content) as CompanyData;
        companyStore.set(data.id, data);
        console.log(`📚 Loaded company data: ${data.name}`);
      }
    }

    console.log(`✅ Loaded ${companyStore.size} company knowledge bases`);
  } catch (error) {
    console.error("Error loading company data:", error);
  }
}

/**
 * Get company data by ID
 */
export function getCompanyById(id: string): CompanyData | undefined {
  return companyStore.get(id);
}

/**
 * Get all companies
 */
export function getAllCompanies(): CompanyData[] {
  return Array.from(companyStore.values());
}

/**
 * Search for relevant context based on query
 * This is a simple keyword-based search for MVP
 * Can be upgraded to vector similarity search later
 */
export function searchContext(query: string, companyId?: string): string {
  const normalizedQuery = query.toLowerCase();
  let relevantContent: string[] = [];

  // If specific company requested, only search that company's data
  if (companyId) {
    const company = companyStore.get(companyId);
    if (company) {
      relevantContent.push(`Company: ${company.name}\n${company.content}`);
    }
  } else {
    // Search all companies for relevant info
    for (const company of companyStore.values()) {
      // Check if query mentions this company
      if (
        normalizedQuery.includes(company.name.toLowerCase()) ||
        normalizedQuery.includes(company.id.toLowerCase())
      ) {
        relevantContent.push(`Company: ${company.name}\n${company.content}`);
      }
    }

    // If no specific company found, provide all context (for general queries)
    if (relevantContent.length === 0 && companyStore.size > 0) {
      // Check if asking about any company-related topics
      const companyKeywords = ["company", "about", "what", "who", "tell me", "information"];
      const isCompanyQuery = companyKeywords.some((kw) => normalizedQuery.includes(kw));

      if (isCompanyQuery) {
        for (const company of companyStore.values()) {
          relevantContent.push(`Company: ${company.name}\n${company.content}`);
        }
      }
    }
  }

  return relevantContent.join("\n\n---\n\n");
}

/**
 * Add or update company data
 */
export async function upsertCompanyData(data: CompanyData): Promise<void> {
  companyStore.set(data.id, data);

  // Persist to file
  const filePath = path.join(DATA_DIR, `${data.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`💾 Saved company data: ${data.name}`);
}

// Initialize on module load
loadCompanyData().catch(console.error);
