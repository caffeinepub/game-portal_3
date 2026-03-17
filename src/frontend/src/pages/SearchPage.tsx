import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Loader2,
  Search,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface DDGRelatedTopic {
  Text?: string;
  FirstURL?: string;
  Result?: string;
  Topics?: DDGRelatedTopic[];
}

interface DDGResponse {
  AbstractText: string;
  AbstractURL: string;
  AbstractSource: string;
  RelatedTopics: DDGRelatedTopic[];
  Results: Array<{ Text: string; FirstURL: string; Result: string }>;
}

function extractTitle(text: string): string {
  // DuckDuckGo Related Topics often format as "Title - Description"
  const dashIndex = text.indexOf(" - ");
  if (dashIndex > 0 && dashIndex < 80) {
    return text.substring(0, dashIndex);
  }
  // Strip HTML tags
  return text.replace(/<[^>]+>/g, "").substring(0, 60);
}

function extractSnippet(text: string): string {
  const clean = text.replace(/<[^>]+>/g, "");
  const dashIndex = clean.indexOf(" - ");
  if (dashIndex > 0 && dashIndex < 80) {
    return clean.substring(dashIndex + 3);
  }
  return clean;
}

function parseResults(data: DDGResponse): SearchResult[] {
  const results: SearchResult[] = [];

  // Abstract result
  if (data.AbstractText && data.AbstractURL) {
    results.push({
      title: data.AbstractSource || "Overview",
      url: data.AbstractURL,
      snippet: data.AbstractText,
    });
  }

  // Direct results
  for (const r of data.Results || []) {
    if (r.FirstURL && r.Text) {
      results.push({
        title: extractTitle(r.Text),
        url: r.FirstURL,
        snippet: extractSnippet(r.Text),
      });
    }
  }

  // Related topics
  for (const topic of data.RelatedTopics || []) {
    if (topic.Topics) {
      for (const sub of topic.Topics) {
        if (sub.FirstURL && sub.Text) {
          results.push({
            title: extractTitle(sub.Text),
            url: sub.FirstURL,
            snippet: extractSnippet(sub.Text),
          });
        }
      }
    } else if (topic.FirstURL && topic.Text) {
      results.push({
        title: extractTitle(topic.Text),
        url: topic.FirstURL,
        snippet: extractSnippet(topic.Text),
      });
    }
  }

  return results.slice(0, 20);
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setSubmittedQuery(q);

    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DDGResponse = await res.json();
      const parsed = parseResults(data);
      setResults(parsed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Search failed. Please try again.",
      );
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-orbitron text-xs tracking-widest no-underline mb-6 transition-colors"
            style={{ color: "oklch(0.72 0.015 280)" }}
            data-ocid="search.link"
          >
            <ArrowLeft className="w-3 h-3" />
            BACK TO PORTAL
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-6 h-6" style={{ color: "var(--neon-cyan)" }} />
            <h1 className="font-orbitron font-bold text-2xl tracking-widest neon-cyan-text">
              WEB SEARCH
            </h1>
          </div>
          <p
            className="font-orbitron text-xs tracking-widest"
            style={{ color: "oklch(0.72 0.015 280)" }}
          >
            POWERED BY DUCKDUCKGO
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex gap-3 mb-10"
          data-ocid="search.panel"
        >
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "oklch(0.84 0.17 200)" }}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the web..."
              className="w-full pl-11 pr-4 py-3 rounded-lg font-orbitron text-sm tracking-wider outline-none transition-all"
              style={{
                background: "oklch(0.13 0.01 270)",
                border: "1px solid oklch(0.84 0.17 200 / 0.4)",
                color: "oklch(0.93 0.01 275)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.84 0.17 200)";
                e.currentTarget.style.boxShadow =
                  "0 0 12px oklch(0.84 0.17 200 / 0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor =
                  "oklch(0.84 0.17 200 / 0.4)";
                e.currentTarget.style.boxShadow = "none";
              }}
              data-ocid="search.input"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="neon-btn-filled-cyan px-6 py-3 rounded-lg font-orbitron text-xs tracking-widest uppercase flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-ocid="search.submit_button"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {isLoading ? "SEARCHING" : "SEARCH"}
          </button>
        </motion.form>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {/* Loading */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-20"
              data-ocid="search.loading_state"
            >
              <Loader2
                className="w-10 h-10 animate-spin"
                style={{ color: "oklch(0.84 0.17 200)" }}
              />
              <p
                className="font-orbitron text-xs tracking-widest"
                style={{ color: "oklch(0.72 0.015 280)" }}
              >
                SCANNING THE WEB...
              </p>
            </motion.div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="neon-card p-6 text-center"
              style={{ borderColor: "oklch(0.63 0.28 315 / 0.5)" }}
              data-ocid="search.error_state"
            >
              <p
                className="font-orbitron text-sm tracking-widest"
                style={{ color: "oklch(0.63 0.28 315)" }}
              >
                ⚠ SEARCH ERROR
              </p>
              <p
                className="font-orbitron text-xs mt-2"
                style={{ color: "oklch(0.72 0.015 280)" }}
              >
                {error}
              </p>
            </motion.div>
          )}

          {/* Empty state (no search yet) */}
          {!isLoading && !error && !hasSearched && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 py-20"
              data-ocid="search.empty_state"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: "oklch(0.84 0.17 200 / 0.08)",
                  border: "1px solid oklch(0.84 0.17 200 / 0.2)",
                }}
              >
                <Search
                  className="w-9 h-9"
                  style={{ color: "oklch(0.84 0.17 200 / 0.6)" }}
                />
              </div>
              <div className="text-center">
                <p
                  className="font-orbitron text-sm tracking-widest mb-2"
                  style={{ color: "oklch(0.93 0.01 275)" }}
                >
                  READY TO SEARCH
                </p>
                <p
                  className="font-orbitron text-xs tracking-widest"
                  style={{ color: "oklch(0.72 0.015 280)" }}
                >
                  Enter a query above to search the web via DuckDuckGo
                </p>
              </div>
            </motion.div>
          )}

          {/* No results */}
          {!isLoading && !error && hasSearched && results.length === 0 && (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
              data-ocid="search.empty_state"
            >
              <p
                className="font-orbitron text-sm tracking-widest"
                style={{ color: "oklch(0.72 0.015 280)" }}
              >
                NO RESULTS FOUND FOR "{submittedQuery.toUpperCase()}"
              </p>
              <p
                className="font-orbitron text-xs mt-2"
                style={{ color: "oklch(0.72 0.015 280 / 0.6)" }}
              >
                Try a different search term
              </p>
            </motion.div>
          )}

          {/* Results */}
          {!isLoading && !error && results.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p
                className="font-orbitron text-xs tracking-widest mb-5"
                style={{ color: "oklch(0.72 0.015 280)" }}
              >
                {results.length} RESULTS FOR &ldquo;{submittedQuery}&rdquo;
              </p>

              <div className="flex flex-col gap-4">
                {results.map((result, i) => (
                  <motion.a
                    key={`${result.url}-${i}`}
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="neon-card p-5 block no-underline group transition-all"
                    data-ocid={`search.item.${i + 1}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-orbitron text-sm font-bold tracking-wide mb-1 group-hover:text-cyan-300 transition-colors truncate"
                          style={{ color: "oklch(0.84 0.17 200)" }}
                        >
                          {result.title || "(no title)"}
                        </h3>
                        <p
                          className="font-mono text-xs mb-2 truncate"
                          style={{ color: "oklch(0.72 0.015 280 / 0.7)" }}
                        >
                          {result.url}
                        </p>
                        {result.snippet && (
                          <p
                            className="text-sm leading-relaxed line-clamp-3"
                            style={{
                              color: "oklch(0.93 0.01 275 / 0.85)",
                              fontFamily: "inherit",
                            }}
                          >
                            {result.snippet}
                          </p>
                        )}
                      </div>
                      <ExternalLink
                        className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity"
                        style={{ color: "oklch(0.84 0.17 200)" }}
                      />
                    </div>
                  </motion.a>
                ))}
              </div>

              {/* DuckDuckGo attribution */}
              <div className="mt-8 text-center">
                <a
                  href={`https://duckduckgo.com/?q=${encodeURIComponent(submittedQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-orbitron text-xs tracking-widest no-underline transition-colors"
                  style={{ color: "oklch(0.72 0.015 280)" }}
                  data-ocid="search.link"
                >
                  VIEW FULL RESULTS ON DUCKDUCKGO →
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
