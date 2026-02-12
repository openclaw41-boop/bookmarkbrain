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

export default function AppPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [urlInput, setUrlInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBookmarks(getBookmarks());
  }, []);

  const processingRef = useRef(false);

  const processUrl = useCallback(async (url: string, title: string): Promise<void> => {
    const id = generateId();
    const bookmark: Bookmark = {
      id,
      url,
      title: title || new URL(url).hostname,
      summary: "",
      takeaways: [],
      category: "Other",
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`,
      status: "pending",
      createdAt: Date.now(),
    };
    addBookmark(bookmark);
    setBookmarks(getBookmarks());

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.ok) {
        updateBookmark(id, {
          title: data.title || bookmark.title,
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
    setBookmarks(getBookmarks());
  }, []);

  const handleSubmitUrls = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    const parsed = parseUrlList(urlInput);
    for (const { url, title } of parsed) {
      await processUrl(url, title);
    }
    setUrlInput("");
    setIsProcessing(false);
    processingRef.current = false;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const html = await file.text();
    const parsed = parseBookmarksHtml(html);
    if (parsed.length === 0) return;
    setIsProcessing(true);
    processingRef.current = true;
    setShowImport(false);
    for (const { url, title } of parsed) {
      await processUrl(url, title);
    }
    setIsProcessing(false);
    processingRef.current = false;
  };

  const handleDelete = (id: string) => {
    deleteBookmark(id);
    setBookmarks(getBookmarks());
  };

  const handleClearAll = () => {
    saveBookmarks([]);
    setBookmarks([]);
  };

  const filtered = bookmarks.filter((b) => {
    const matchCategory = category === "All" || b.category === category;
    const matchSearch =
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.summary.toLowerCase().includes(search.toLowerCase()) ||
      b.url.toLowerCase().includes(search.toLowerCase()) ||
      b.takeaways.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const categoryCounts = bookmarks.reduce<Record<string, number>>((acc, b) => {
    acc[b.category] = (acc[b.category] || 0) + 1;
    return acc;
  }, {});

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
            <button
              onClick={() => setShowImport(!showImport)}
              className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
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
                  disabled={isProcessing || !urlInput.trim()}
                  className="mt-3 bg-blue-500 hover:bg-blue-400 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition"
                >
                  {isProcessing ? "Processing..." : "Summarize URLs"}
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

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookmarks..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          {bookmarks.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-red-400 hover:text-red-300 px-4 py-2 border border-red-500/20 rounded-lg transition"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Category Chips */}
        {bookmarks.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
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

        {/* Bookmarks Grid */}
        {filtered.length === 0 && !showImport ? (
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
        ) : (
          <div className="grid gap-4">
            {filtered.map((b) => (
              <div
                key={b.id}
                className="bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:border-white/10 transition group"
              >
                <div className="flex items-start gap-4">
                  {/* Favicon */}
                  <img
                    src={b.favicon}
                    alt=""
                    width={20}
                    height={20}
                    className="mt-1 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23374151'/><text x='16' y='22' text-anchor='middle' fill='white' font-size='16'>🔗</text></svg>";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-white hover:text-blue-400 transition truncate"
                      >
                        {b.title}
                      </a>
                      <span
                        className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                          b.status === "pending"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            : b.status === "error"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {b.status === "pending" ? "⏳ Processing" : b.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mb-2">{b.url}</p>
                    {b.summary && <p className="text-sm text-gray-300 mb-2">{b.summary}</p>}
                    {b.takeaways.length > 0 && (
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
                  </div>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition text-sm p-1"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="fixed bottom-6 right-6 bg-gray-900 border border-white/10 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-300">Processing bookmarks...</span>
          </div>
        )}
      </div>
    </div>
  );
}
