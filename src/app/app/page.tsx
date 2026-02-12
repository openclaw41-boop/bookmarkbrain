"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bookmark } from "@/lib/types";
import { getBookmarks, saveBookmarks, addBookmark, updateBookmark, deleteBookmark } from "@/lib/storage";
import { parseBookmarksHtml, parseUrlList } from "@/lib/parseBookmarks";
import Link from "next/link";

const CATEGORIES = [
  "All",
  "Technology",
  "Business",
  "Design",
  "Marketing",
  "Programming",
  "AI",
  "Science",
  "Health",
  "Finance",
  "News",
  "Entertainment",
  "Education",
  "Productivity",
  "Other",
];

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const IMPORT_GUIDES = [
  {
    id: "chrome",
    icon: "🌐",
    name: "Google Chrome",
    steps: [
      "Open Chrome and press ⌘+Shift+O (Mac) or Ctrl+Shift+O (Windows)",
      "Click the ⋮ menu (top-right of Bookmark Manager)",
      'Select "Export bookmarks"',
      "Save the HTML file, then upload it here",
    ],
  },
  {
    id: "firefox",
    icon: "🦊",
    name: "Firefox",
    steps: [
      "Open Firefox and press ⌘+Shift+O (Mac) or Ctrl+Shift+O (Windows)",
      'Click "Import and Backup" in the toolbar',
      'Select "Export Bookmarks to HTML..."',
      "Save the file, then upload it here",
    ],
  },
  {
    id: "safari",
    icon: "🧭",
    name: "Safari",
    steps: [
      "Open Safari → File menu → Export → Bookmarks...",
      "Save the HTML file",
      "Upload it here",
    ],
  },
  {
    id: "x",
    icon: "𝕏",
    name: "X / Twitter",
    steps: [
      "Go to x.com → More → Settings → Your account",
      'Click "Download an archive of your data"',
      "Wait for the archive (can take 24h)",
      "Or: just go through your X bookmarks and paste the URLs here one per line",
    ],
  },
  {
    id: "reddit",
    icon: "🤖",
    name: "Reddit Saved",
    steps: [
      "Go to reddit.com/user/YOUR_USERNAME/saved/",
      "Copy the URLs of posts you want to save",
      "Paste them in the URL box above (one per line)",
    ],
  },
  {
    id: "pocket",
    icon: "📌",
    name: "Pocket",
    steps: [
      "Go to getpocket.com → Settings → Export",
      "Download the HTML file",
      "Upload it here — same format as browser bookmarks",
    ],
  },
];

function ImportGuides() {
  const [openGuide, setOpenGuide] = useState<string | null>(null);

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-400 mb-3">📖 How to export your bookmarks</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {IMPORT_GUIDES.map((guide) => (
          <button
            key={guide.id}
            onClick={() => setOpenGuide(openGuide === guide.id ? null : guide.id)}
            className={`text-left p-3 rounded-xl border transition text-sm ${
              openGuide === guide.id
                ? "bg-blue-500/10 border-blue-500/30 text-white"
                : "bg-white/[0.02] border-white/5 text-gray-400 hover:border-white/10 hover:text-gray-300"
            }`}
          >
            <span className="text-lg block mb-1">{guide.icon}</span>
            <span className="text-xs font-medium">{guide.name}</span>
          </button>
        ))}
      </div>
      {openGuide && (
        <div className="mt-4 bg-white/[0.03] border border-white/5 rounded-xl p-4">
          {(() => {
            const guide = IMPORT_GUIDES.find((g) => g.id === openGuide)!;
            return (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{guide.icon}</span>
                  <span className="font-medium text-white text-sm">{guide.name}</span>
                </div>
                <ol className="space-y-2">
                  {guide.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-medium mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// Rate-limited batch processor
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 4500; // ~13 req/min stays under 15 RPM

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function AppPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [urlInput, setUrlInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState({ done: 0, total: 0 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "unsummarized" | "summarized">("all");
  const [justImported, setJustImported] = useState(0); // count of just-imported bookmarks
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    const bm = getBookmarks();
    setBookmarks(bm);
    if (bm.length === 0) setShowImport(true);
  }, []);

  const refresh = useCallback(() => {
    setBookmarks(getBookmarks());
  }, []);

  // Just import — don't summarize yet
  const importBookmarks = useCallback((items: { url: string; title: string }[]) => {
    const existing = getBookmarks();
    const existingUrls = new Set(existing.map((b) => b.url));
    let added = 0;

    for (const { url, title } of items) {
      if (existingUrls.has(url)) continue; // skip duplicates
      const bookmark: Bookmark = {
        id: generateId(),
        url,
        title: title || (() => { try { return new URL(url).hostname; } catch { return url; } })(),
        summary: "",
        takeaways: [],
        category: "Other",
        favicon: (() => { try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; } catch { return ""; } })(),
        status: "imported",
        createdAt: Date.now(),
      };
      addBookmark(bookmark);
      added++;
    }
    refresh();
    return added;
  }, [refresh]);

  // Summarize a single bookmark
  const summarizeOne = useCallback(async (id: string) => {
    const bm = getBookmarks().find((b) => b.id === id);
    if (!bm) return;

    updateBookmark(id, { status: "pending" });
    refresh();

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: bm.url }),
      });
      const data = await res.json();
      if (res.ok) {
        updateBookmark(id, {
          title: data.title || bm.title,
          summary: data.summary,
          takeaways: data.takeaways,
          category: data.category,
          status: "done",
        });
      } else {
        updateBookmark(id, { status: "error", summary: "Failed to summarize" });
      }
    } catch {
      updateBookmark(id, { status: "error", summary: "Failed to summarize" });
    }
    refresh();
  }, [refresh]);

  // Batch summarize all unsummarized
  const summarizeAll = useCallback(async () => {
    const unsummarized = getBookmarks().filter((b) => b.status === "imported" || b.status === "error");
    if (unsummarized.length === 0) return;

    setIsProcessing(true);
    abortRef.current = false;
    setProcessProgress({ done: 0, total: unsummarized.length });

    for (let i = 0; i < unsummarized.length; i += BATCH_SIZE) {
      if (abortRef.current) break;
      const batch = unsummarized.slice(i, i + BATCH_SIZE);

      // Process batch in parallel
      await Promise.all(batch.map((bm) => summarizeOne(bm.id)));
      setProcessProgress({ done: Math.min(i + BATCH_SIZE, unsummarized.length), total: unsummarized.length });

      // Rate limit pause between batches
      if (i + BATCH_SIZE < unsummarized.length && !abortRef.current) {
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    }

    setIsProcessing(false);
  }, [summarizeOne]);

  const handleSubmitUrls = () => {
    const parsed = parseUrlList(urlInput);
    const added = importBookmarks(parsed);
    setUrlInput("");
    if (added > 0) {
      setShowImport(false);
      setJustImported(added);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const html = await file.text();
    const parsed = parseBookmarksHtml(html);
    if (parsed.length === 0) return;
    const added = importBookmarks(parsed);
    setShowImport(false);
    setJustImported(added);
  };

  const handleDelete = (id: string) => {
    deleteBookmark(id);
    refresh();
  };

  const handleClearAll = () => {
    if (!confirm("Delete all bookmarks? This can't be undone.")) return;
    saveBookmarks([]);
    refresh();
  };

  const handleStopProcessing = () => {
    abortRef.current = true;
  };

  // Filter logic
  const filtered = bookmarks.filter((b) => {
    const matchCategory = category === "All" || b.category === category;
    const matchSearch =
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.summary.toLowerCase().includes(search.toLowerCase()) ||
      b.url.toLowerCase().includes(search.toLowerCase()) ||
      b.takeaways.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchView =
      viewMode === "all" ||
      (viewMode === "unsummarized" && (b.status === "imported" || b.status === "error")) ||
      (viewMode === "summarized" && b.status === "done");
    return matchCategory && matchSearch && matchView;
  });

  const categoryCounts = bookmarks.reduce<Record<string, number>>((acc, b) => {
    if (b.status === "done") acc[b.category] = (acc[b.category] || 0) + 1;
    return acc;
  }, {});

  const unsummarizedCount = bookmarks.filter((b) => b.status === "imported" || b.status === "error").length;
  const summarizedCount = bookmarks.filter((b) => b.status === "done").length;
  const pendingCount = bookmarks.filter((b) => b.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🧠</span>
            <span className="font-semibold text-white">BookmarkBrain</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{bookmarks.length} bookmarks</span>
            {unsummarizedCount > 0 && !isProcessing && (
              <button
                onClick={summarizeAll}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-500/20"
              >
                🧠 Summarize {unsummarizedCount} bookmarks
              </button>
            )}
            <button
              onClick={() => setShowImport(!showImport)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              + Import
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Import Panel */}
        {showImport && (
          <div className="mb-8 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Import Bookmarks</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Paste URLs */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Paste URLs (one per line)</label>
                <textarea
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={"https://example.com/article-1\nhttps://example.com/article-2"}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 resize-none h-32"
                />
                <button
                  onClick={handleSubmitUrls}
                  disabled={!urlInput.trim()}
                  className="mt-3 bg-blue-500 hover:bg-blue-400 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition"
                >
                  Import URLs
                </button>
              </div>
              {/* Upload File */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Upload bookmarks HTML file</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-white/20 transition h-32 flex flex-col items-center justify-center"
                >
                  <span className="text-2xl mb-2">📁</span>
                  <span className="text-sm text-gray-400">Click to upload bookmarks.html</span>
                  <span className="text-xs text-gray-600 mt-1">Chrome, Firefox, Safari exports</span>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".html,.htm"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Import Guides */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <ImportGuides />
            </div>
          </div>
        )}

        {/* Just Imported Banner */}
        {justImported > 0 && !isProcessing && (
          <div className="mb-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6 text-center">
            <span className="text-4xl block mb-3">🎉</span>
            <h2 className="text-xl font-bold text-white mb-2">
              {justImported} bookmarks imported!
            </h2>
            <p className="text-gray-400 mb-5 text-sm">
              Now let AI read them for you. It&apos;ll summarize each one with key takeaways and auto-categorize them.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => { setJustImported(0); summarizeAll(); }}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white px-8 py-3 rounded-xl font-semibold transition shadow-lg shadow-blue-500/25 text-sm"
              >
                🧠 Summarize All — Let AI Read Them
              </button>
              <button
                onClick={() => setJustImported(0)}
                className="text-gray-500 hover:text-gray-300 px-4 py-3 rounded-xl transition text-sm"
              >
                I&apos;ll do it later
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              ⚡ Processes 5 at a time • ~{Math.ceil(justImported / 5 * 5 / 60)} min for all {justImported}
            </p>
          </div>
        )}

        {/* Stats Bar */}
        {bookmarks.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={() => setViewMode("all")}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                viewMode === "all" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              All ({bookmarks.length})
            </button>
            {unsummarizedCount > 0 && (
              <button
                onClick={() => setViewMode("unsummarized")}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  viewMode === "unsummarized" ? "bg-yellow-500/20 text-yellow-400" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                ⏳ Needs Summary ({unsummarizedCount})
              </button>
            )}
            {summarizedCount > 0 && (
              <button
                onClick={() => setViewMode("summarized")}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  viewMode === "summarized" ? "bg-green-500/20 text-green-400" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                ✅ Summarized ({summarizedCount})
              </button>
            )}

            <div className="flex-1" />

            {bookmarks.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-gray-600 hover:text-red-400 px-3 py-1.5 transition"
              >
                Clear All
              </button>
            )}
          </div>
        )}

        {/* Search & Category Filter */}
        {bookmarks.length > 0 && (
          <>
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bookmarks by title, summary, or URL..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Category Chips */}
            {summarizedCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {CATEGORIES.filter((c) => c === "All" || categoryCounts[c]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      category === c
                        ? "bg-blue-500 text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {c}
                    {c !== "All" && categoryCounts[c] && (
                      <span className="ml-1.5 text-xs opacity-60">{categoryCounts[c]}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Bookmarks List */}
        {filtered.length === 0 && bookmarks.length === 0 && !showImport ? (
          <div className="text-center py-20">
            <span className="text-5xl mb-4 block">📚</span>
            <h2 className="text-xl font-semibold text-white mb-2">No bookmarks yet</h2>
            <p className="text-gray-400 mb-6">Import your bookmarks and let AI do the reading.</p>
            <button
              onClick={() => setShowImport(true)}
              className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-xl text-sm font-medium transition"
            >
              + Import Bookmarks
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-3xl mb-3 block">🔍</span>
            <p className="text-gray-400">No bookmarks match your filters</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((b) => (
              <div
                key={b.id}
                className={`border rounded-xl p-4 transition group ${
                  b.status === "done"
                    ? "bg-white/[0.02] border-white/5 hover:border-white/10"
                    : b.status === "pending"
                    ? "bg-blue-500/[0.03] border-blue-500/10"
                    : b.status === "error"
                    ? "bg-red-500/[0.03] border-red-500/10"
                    : "bg-white/[0.01] border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Favicon */}
                  <img
                    src={b.favicon}
                    alt=""
                    width={20}
                    height={20}
                    className="mt-1 rounded shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23374151'/><text x='16' y='22' text-anchor='middle' fill='white' font-size='16'>🔗</text></svg>";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-white hover:text-blue-400 transition truncate text-sm"
                      >
                        {b.title}
                      </a>
                      {b.status === "done" && (
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {b.category}
                        </span>
                      )}
                      {b.status === "pending" && (
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
                          <span className="inline-block w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                          Reading...
                        </span>
                      )}
                      {b.status === "imported" && (
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">
                          Not read yet
                        </span>
                      )}
                      {b.status === "error" && (
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                          Error
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate mb-1">{b.url}</p>

                    {b.status === "done" && b.summary && (
                      <p className="text-sm text-gray-300 mb-1">{b.summary}</p>
                    )}

                    {b.status === "done" && b.takeaways.length > 0 && (
                      <div>
                        <button
                          onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                          className="text-xs text-gray-500 hover:text-gray-300 transition"
                        >
                          {expandedId === b.id ? "▾ Hide takeaways" : "▸ 3 key takeaways"}
                        </button>
                        {expandedId === b.id && (
                          <ul className="mt-2 space-y-1">
                            {b.takeaways.map((t, i) => (
                              <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">→</span>
                                {t}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Summarize button for unsummarized */}
                    {(b.status === "imported" || b.status === "error") && !isProcessing && (
                      <button
                        onClick={() => summarizeOne(b.id)}
                        className="mt-2 text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition border border-blue-500/20"
                      >
                        🧠 Summarize this
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition text-sm p-1 shrink-0"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/10 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-4 z-50">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <div>
              <p className="text-sm text-white font-medium">
                Summarizing... {processProgress.done}/{processProgress.total}
              </p>
              <p className="text-xs text-gray-500">
                {Math.round((processProgress.done / processProgress.total) * 100)}% • ~{Math.ceil((processProgress.total - processProgress.done) / BATCH_SIZE * 5)}s remaining
              </p>
            </div>
            <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(processProgress.done / processProgress.total) * 100}%` }}
              />
            </div>
            <button
              onClick={handleStopProcessing}
              className="text-xs text-gray-400 hover:text-red-400 px-3 py-1.5 border border-white/10 rounded-lg transition"
            >
              Stop
            </button>
          </div>
        )}

        {/* Pending count — gentle nudge */}
        {pendingCount > 0 && !isProcessing && (
          <div className="fixed bottom-6 right-6 bg-gray-900 border border-blue-500/20 rounded-xl px-4 py-3 shadow-2xl">
            <p className="text-sm text-blue-400">{pendingCount} bookmarks being read by AI...</p>
          </div>
        )}
      </div>
    </div>
  );
}
