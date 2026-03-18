import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ExternalLink,
  Gamepad2,
  Link as LinkIcon,
  RefreshCw,
  Search,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";

function resolveUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[^\s]+\.[^\s]+$/.test(trimmed) && !trimmed.includes(" "))
    return `https://${trimmed}`;
  return `https://search.brave.com/search?q=${encodeURIComponent(trimmed)}`;
}

// Use allorigins which strips X-Frame-Options and CSP headers server-side
function proxyUrl(url: string): string {
  return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
}

const GAMING_SITES = [
  { label: "MathFun HW", url: "https://mathfunn.vercel.app/homework.html" },
  { label: "CrazyGames", url: "https://www.crazygames.com" },
  { label: "Poki", url: "https://poki.com" },
  { label: "Y8", url: "https://www.y8.com" },
  { label: "CoolMath", url: "https://www.coolmathgames.com" },
  { label: "Friv", url: "https://friv.com" },
  { label: "GamePix", url: "https://www.gamepix.com" },
  { label: "Itch.io", url: "https://itch.io/games/platform-web" },
  { label: "Armor Games", url: "https://armorgames.com" },
  { label: "Newgrounds", url: "https://www.newgrounds.com/games" },
  { label: "Addicting Games", url: "https://www.addictinggames.com" },
  { label: "Miniclip", url: "https://www.miniclip.com/games/en" },
  { label: "Kongregate", url: "https://www.kongregate.com" },
  { label: "Gameflare", url: "https://gameflare.com" },
];

export default function SearchPage() {
  const [inputValue, setInputValue] = useState("");
  const [iframeSrc, setIframeSrc] = useState("");
  const [rawUrl, setRawUrl] = useState("");
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function navigate(raw: string = inputValue) {
    const resolved = resolveUrl(raw);
    if (!resolved) return;
    setInputValue(raw.trim());
    setRawUrl(resolved);
    setIframeSrc(proxyUrl(resolved));
    setIframeKey((k) => k + 1);
    setLoading(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") navigate();
  }

  function handleBack() {
    try {
      iframeRef.current?.contentWindow?.history.back();
    } catch {
      /* cross-origin */
    }
  }

  function handleForward() {
    try {
      iframeRef.current?.contentWindow?.history.forward();
    } catch {
      /* cross-origin */
    }
  }

  function handleRefresh() {
    if (inputValue) navigate(inputValue);
  }

  function openInNewTab() {
    if (rawUrl) window.open(rawUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex-shrink-0 px-4 py-3 flex flex-col gap-2"
        style={{ borderBottom: "1px solid oklch(0.84 0.17 200 / 0.2)" }}
      >
        {/* Top row */}
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1 font-orbitron text-xs tracking-widest no-underline transition-colors"
            style={{ color: "oklch(0.72 0.015 280)" }}
          >
            <ArrowLeft className="w-3 h-3" />
            PORTAL
          </Link>
          <span
            className="font-orbitron text-xs"
            style={{ color: "oklch(0.72 0.015 280 / 0.4)" }}
          >
            |
          </span>
          <span className="font-orbitron text-xs tracking-widest neon-cyan-text">
            CURSED BROWSER
          </span>
        </div>

        {/* Toolbar row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center"
            style={{
              background: "oklch(0.13 0.01 270)",
              border: "1px solid oklch(0.84 0.17 200 / 0.3)",
              color: "oklch(0.84 0.17 200)",
            }}
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleForward}
            className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center rotate-180"
            style={{
              background: "oklch(0.13 0.01 270)",
              border: "1px solid oklch(0.84 0.17 200 / 0.3)",
              color: "oklch(0.84 0.17 200)",
            }}
            title="Forward"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={!iframeSrc}
            className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center disabled:opacity-40"
            style={{
              background: "oklch(0.13 0.01 270)",
              border: "1px solid oklch(0.84 0.17 200 / 0.3)",
              color: "oklch(0.84 0.17 200)",
            }}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="relative flex-1">
            <LinkIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: "oklch(0.84 0.17 200 / 0.6)" }}
            />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search Brave or enter a URL..."
              className="w-full pl-8 pr-4 py-2 rounded font-orbitron text-xs tracking-wide outline-none transition-all"
              style={{
                background: "oklch(0.11 0.01 270)",
                border: "1px solid oklch(0.84 0.17 200 / 0.35)",
                color: "oklch(0.93 0.01 275)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.84 0.17 200)";
                e.currentTarget.style.boxShadow =
                  "0 0 10px oklch(0.84 0.17 200 / 0.3)";
                e.currentTarget.select();
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor =
                  "oklch(0.84 0.17 200 / 0.35)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => navigate()}
            disabled={!inputValue.trim()}
            className="flex-shrink-0 px-4 h-8 rounded font-orbitron text-xs tracking-widest uppercase flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "oklch(0.84 0.17 200 / 0.15)",
              border: "1px solid oklch(0.84 0.17 200 / 0.6)",
              color: "oklch(0.84 0.17 200)",
            }}
          >
            <Search className="w-3.5 h-3.5" />
            GO
          </button>

          {iframeSrc && (
            <button
              type="button"
              onClick={openInNewTab}
              className="flex-shrink-0 px-3 h-8 rounded font-orbitron text-xs tracking-widest uppercase flex items-center gap-1.5"
              style={{
                background: "oklch(0.55 0.18 145 / 0.15)",
                border: "1px solid oklch(0.55 0.18 145 / 0.6)",
                color: "oklch(0.75 0.18 145)",
              }}
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              OPEN TAB
            </button>
          )}
        </div>

        {/* Gaming shortcuts */}
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          <Gamepad2
            className="w-3.5 h-3.5 flex-shrink-0"
            style={{ color: "oklch(0.84 0.17 200 / 0.5)" }}
          />
          {GAMING_SITES.map((site) => (
            <button
              key={site.label}
              type="button"
              onClick={() => {
                setInputValue(site.url);
                navigate(site.url);
              }}
              className="flex-shrink-0 font-orbitron text-xs tracking-wider px-3 py-1 rounded transition-all hover:scale-105"
              style={{
                background: "oklch(0.13 0.01 270)",
                border: "1px solid oklch(0.84 0.17 200 / 0.2)",
                color: "oklch(0.84 0.17 200 / 0.75)",
              }}
            >
              {site.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Iframe area */}
      <div className="flex-1 relative flex flex-col" style={{ minHeight: 0 }}>
        {iframeSrc ? (
          <div className="relative flex-1 flex flex-col">
            {loading && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
                style={{
                  background: "oklch(0.09 0.01 270 / 0.85)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: "oklch(0.84 0.17 200 / 0.2)",
                    borderTopColor: "oklch(0.84 0.17 200)",
                  }}
                />
                <p
                  className="font-orbitron text-xs tracking-widest"
                  style={{ color: "oklch(0.84 0.17 200)" }}
                >
                  LOADING...
                </p>
              </div>
            )}
            <iframe
              ref={iframeRef}
              key={iframeKey}
              src={iframeSrc}
              className="w-full flex-1"
              style={{ border: "none", minHeight: "calc(100vh - 240px)" }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads allow-modals"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              referrerPolicy="no-referrer"
              title="Cursed Browser"
              onLoad={() => setLoading(false)}
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 py-20"
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(0.84 0.17 200 / 0.06)",
                border: "1px solid oklch(0.84 0.17 200 / 0.2)",
                boxShadow: "0 0 40px oklch(0.84 0.17 200 / 0.1)",
              }}
            >
              <Gamepad2
                className="w-10 h-10"
                style={{ color: "oklch(0.84 0.17 200 / 0.5)" }}
              />
            </div>
            <div className="text-center">
              <p className="font-orbitron font-bold text-base tracking-widest mb-2 neon-cyan-text">
                CURSED BROWSER
              </p>
              <p
                className="font-orbitron text-xs tracking-widest"
                style={{ color: "oklch(0.72 0.015 280)" }}
              >
                Enter a URL, search with Brave, or pick a gaming site above
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
