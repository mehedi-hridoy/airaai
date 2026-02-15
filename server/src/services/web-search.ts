interface DuckDuckGoTopic {
  Text?: string;
  FirstURL?: string;
  Topics?: DuckDuckGoTopic[];
}

interface DuckDuckGoResponse {
  AbstractText?: string;
  AbstractURL?: string;
  Heading?: string;
  RelatedTopics?: DuckDuckGoTopic[];
}

function flattenTopics(topics: DuckDuckGoTopic[] = []): DuckDuckGoTopic[] {
  const flat: DuckDuckGoTopic[] = [];

  for (const topic of topics) {
    if (topic.Text) {
      flat.push(topic);
    }
    if (topic.Topics?.length) {
      flat.push(...flattenTopics(topic.Topics));
    }
  }

  return flat;
}

function shouldUseWebSearch(query: string): boolean {
  const q = query.toLowerCase();

  // Use web lookup for likely time-sensitive or broad open-domain questions.
  return /(latest|today|current|news|update|price|market|trend|who is|what is|where is|when is|search|internet|web)/i.test(q);
}

export async function getWebSearchContext(query: string): Promise<string> {
  if (!shouldUseWebSearch(query)) {
    return "";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`;
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) return "";

    const data = (await response.json()) as DuckDuckGoResponse;
    const lines: string[] = [];

    if (data.AbstractText?.trim()) {
      lines.push(`Summary: ${data.AbstractText.trim()}`);
    }

    const related = flattenTopics(data.RelatedTopics || [])
      .map((t) => t.Text?.trim())
      .filter((t): t is string => Boolean(t))
      .slice(0, 3);

    if (related.length > 0) {
      lines.push(`Related:\n- ${related.join("\n- ")}`);
    }

    if (data.AbstractURL) {
      lines.push(`Source URL: ${data.AbstractURL}`);
    }

    if (lines.length === 0) return "";

    return `Web context (best-effort):\n${lines.join("\n")}`;
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}
