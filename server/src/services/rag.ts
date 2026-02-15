import fsSync from "fs";
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

interface KnowledgeChunk {
  id: string;
  source: string;
  section: string;
  text: string;
  keywords: Set<string>;
}

// In-memory store for company data (for MVP - can be replaced with vector DB later)
const companyStore = new Map<string, CompanyData>();
const knowledgeChunks: KnowledgeChunk[] = [];

const DATA_DIR_CANDIDATES = [
  process.env.DATA_DIR,
  path.join(process.cwd(), "data"),
  path.join(process.cwd(), "..", "data"),
].filter(Boolean) as string[];

const ROOT_DATA_DIR =
  DATA_DIR_CANDIDATES.find((candidate) => fsSync.existsSync(candidate)) || DATA_DIR_CANDIDATES[0];
const COMPANY_DATA_DIR = path.join(ROOT_DATA_DIR, "companies");

const STOP_WORDS = new Set([
  "the", "is", "a", "an", "to", "of", "in", "on", "for", "and", "or", "with", "at", "by", "from",
  "that", "this", "it", "as", "be", "are", "was", "were", "can", "you", "we", "i", "our", "your",
]);

const DOMAIN_KEYWORDS = [
  "aira",
  "gigalogy",
  "technopreneurship",
  "team",
  "company",
  "product",
  "voice",
  "assistant",
  "ai",
  "business",
  "maira",
  "g-core",
  "smartads",
  "personalizer",
  "judge",
  "event",
  "dhaka",
  "tokyo",
  "ceo",
  "founder",
  "leadership",
  "director",
  "technopreneur",
];

const CANONICAL_TERMS = [
  "aira",
  "gigalogy",
  "technopreneurship",
  "maira",
  "g-core",
  "smartads",
  "personalizer",
  "ceo",
  "founder",
  "leadership",
];

const DOMAIN_PATTERNS = [
  /\baira\b/i,
  /\bgigalogy\b/i,
  /\btechnopreneurship\b/i,
  /\bmaira\b/i,
  /\bg-core\b/i,
  /\bsmartads\b/i,
  /\bpersonalizer\b/i,
  /\bteam\s+aira\b/i,
];

function normalizeText(text: string): string {
  const cleaned = text
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\u00A0/g, " ")
    .split("\n")
    .filter((line) => {
      const l = line.trim();
      if (!l) return true;
      // Remove prompt-like boilerplate that reduces retrieval quality.
      if (/^perfect\. below/i.test(l)) return false;
      if (/^i.?ll present/i.test(l)) return false;
      if (/^think of this as/i.test(l)) return false;
      if (/^i.?ll reference/i.test(l)) return false;
      if (/^this foundation is solid\.?$/i.test(l)) return false;
      return true;
    })
    .join("\n");

  return cleaned.trim();
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function toKeywords(text: string): Set<string> {
  return new Set(tokenize(text));
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
}

function getCorrectedDomainTokens(query: string): string[] {
  const tokens = tokenize(query);
  const corrected = new Set<string>();

  for (const token of tokens) {
    if (CANONICAL_TERMS.includes(token)) {
      corrected.add(token);
      continue;
    }

    if (token.length < 4) continue;

    let bestTerm = "";
    let bestScore = Number.POSITIVE_INFINITY;

    for (const term of CANONICAL_TERMS) {
      const distance = levenshteinDistance(token, term);
      if (distance < bestScore) {
        bestScore = distance;
        bestTerm = term;
      }
    }

    if (bestTerm && bestScore <= 2) {
      corrected.add(bestTerm);
    }
  }

  return Array.from(corrected);
}

function isDomainQuery(query: string, correctedTokens: string[] = []): boolean {
  if (!query.trim()) return false;
  if (DOMAIN_PATTERNS.some((pattern) => pattern.test(query))) return true;
  return correctedTokens.some((token) => DOMAIN_KEYWORDS.includes(token));
}

function expandQueryKeywords(normalizedQuery: string, queryKeywords: Set<string>): void {
  if (normalizedQuery.includes("founder")) {
    queryKeywords.add("ceo");
    queryKeywords.add("leadership");
    queryKeywords.add("director");
  }

  if (normalizedQuery.includes("ceo")) {
    queryKeywords.add("leadership");
    queryKeywords.add("director");
  }
}

function toTitleFromPath(filePath: string): string {
  const relative = path.relative(ROOT_DATA_DIR, filePath).replace(/\\/g, "/");
  return relative;
}

function splitIntoChunks(content: string, maxChunkLength = 900): string[] {
  const cleaned = normalizeText(content);
  if (!cleaned) return [];

  const sections = cleaned
    .split(/\n\s*\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const section of sections) {
    if ((current + "\n\n" + section).length <= maxChunkLength) {
      current = current ? `${current}\n\n${section}` : section;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = "";
    }

    if (section.length <= maxChunkLength) {
      current = section;
      continue;
    }

    // hard split if one section is too large
    for (let i = 0; i < section.length; i += maxChunkLength) {
      chunks.push(section.slice(i, i + maxChunkLength));
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

async function walkFiles(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
      continue;
    }

    // Keep text-like documents, including extensionless files currently used in project.
    if (
      entry.isFile() &&
      !entry.name.startsWith(".") &&
      !entry.name.endsWith(".png") &&
      !entry.name.endsWith(".jpg") &&
      !entry.name.endsWith(".jpeg") &&
      !entry.name.endsWith(".webp")
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function inferSectionName(text: string, fallback: string): string {
  const firstHeading = text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("#") || line.length > 0);

  if (!firstHeading) return fallback;
  return firstHeading.replace(/^#+\s*/, "").slice(0, 80) || fallback;
}

async function loadKnowledgeBaseData(): Promise<void> {
  knowledgeChunks.length = 0;

  try {
    await fs.mkdir(ROOT_DATA_DIR, { recursive: true });
    const files = await walkFiles(ROOT_DATA_DIR);

    for (const filePath of files) {
      const raw = await fs.readFile(filePath, "utf-8");
      const chunks = splitIntoChunks(raw);

      chunks.forEach((chunkText, index) => {
        const source = toTitleFromPath(filePath);
        const section = inferSectionName(chunkText, source);
        const chunk: KnowledgeChunk = {
          id: `${source}::${index}`,
          source,
          section,
          text: chunkText,
          keywords: toKeywords(`${source} ${section} ${chunkText}`),
        };
        knowledgeChunks.push(chunk);
      });
    }

    console.log(`📚 Indexed ${knowledgeChunks.length} knowledge chunks from data/`);
  } catch (error) {
    console.error("Error loading general knowledge base data:", error);
  }
}

/**
 * Load all company data from the data directory
 */
export async function loadCompanyData(): Promise<void> {
  try {
    await fs.mkdir(COMPANY_DATA_DIR, { recursive: true });
    const files = await fs.readdir(COMPANY_DATA_DIR);

    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = path.join(COMPANY_DATA_DIR, file);
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
  const correctedTokens = getCorrectedDomainTokens(query);
  const expandedQuery = `${normalizedQuery} ${correctedTokens.join(" ")}`.trim();
  const isGigalogyQuery = expandedQuery.includes("gigalogy");
  const queryKeywords = new Set(tokenize(query));
  correctedTokens.forEach((token) => queryKeywords.add(token));
  DOMAIN_KEYWORDS.forEach((kw) => {
    if (expandedQuery.includes(kw)) {
      queryKeywords.add(kw);
    }
  });
  expandQueryKeywords(expandedQuery, queryKeywords);

  // Let the model answer general knowledge directly without irrelevant company context.
  if (!companyId && !isDomainQuery(query, correctedTokens)) {
    return "";
  }

  const relevantContent: string[] = [];

  // If specific company requested, only search that company's data
  if (companyId) {
    const company = companyStore.get(companyId);
    if (company) {
      relevantContent.push(`Company: ${company.name}\n${company.content}`);
    }
  } else {
    // Search all structured company docs first
    for (const company of companyStore.values()) {
      if (
        expandedQuery.includes(company.name.toLowerCase()) ||
        expandedQuery.includes(company.id.toLowerCase())
      ) {
        relevantContent.push(`Company: ${company.name}\n${company.content}`);
      }
    }
  }

  // Search generalized chunk index for relevant snippets.
  const scored = knowledgeChunks
    .map((chunk) => {
      let score = 0;
      for (const token of queryKeywords) {
        if (chunk.keywords.has(token)) {
          score += 2;
        }
      }

      if (queryKeywords.size === 0) {
        score = 0;
      }

      // Prefer direct mentions of Aira/Gigalogy/team/technopreneurship.
      if (expandedQuery.includes("aira") && chunk.keywords.has("aira")) score += 3;
      if (expandedQuery.includes("gigalogy") && chunk.keywords.has("gigalogy")) score += 3;
      if (isGigalogyQuery && chunk.source.includes("companies/gigalogy")) score += 8;
      if (expandedQuery.includes("team") && chunk.keywords.has("team")) score += 2;
      if (expandedQuery.includes("technopreneurship") && chunk.keywords.has("technopreneurship")) score += 3;
      if (expandedQuery.includes("founder") && (chunk.keywords.has("ceo") || chunk.keywords.has("leadership"))) score += 3;
      if (expandedQuery.includes("ceo") && chunk.keywords.has("ceo")) score += 3;

      return { chunk, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (scored.length > 0) {
    for (const { chunk } of scored) {
      relevantContent.push(`Source: ${chunk.source}\nSection: ${chunk.section}\n${chunk.text}`);
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
  const filePath = path.join(COMPANY_DATA_DIR, `${data.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`💾 Saved company data: ${data.name}`);
}

// Initialize on module load
Promise.all([loadCompanyData(), loadKnowledgeBaseData()]).catch(console.error);
