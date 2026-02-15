const INAPPROPRIATE_PATTERNS: RegExp[] = [
  /\b(sex|sexual|nude|porn|explicit|erotic)\b/i,
  /\b(kill|murder|bomb|terror|assault)\b/i,
  /\b(hate\s+speech|racist|sexist|slur)\b/i,
  /\b(hack|malware|phishing|exploit)\b/i,
  /\b(drugs?|meth|cocaine|heroin)\b/i,
];

export function isInappropriateQuery(input: string): boolean {
  const text = input.trim();
  if (!text) return false;
  return INAPPROPRIATE_PATTERNS.some((pattern) => pattern.test(text));
}

export function getSafetyRefusalMessage(): string {
  return "I can’t help with that request. If you want, I can still help with Aira, Gigalogy, your team, or Technopreneurship information.";
}
