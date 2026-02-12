import { Bookmark } from "./types";

const STORAGE_KEY = "bookmarkbrain_bookmarks";

export function getBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveBookmarks(bookmarks: Bookmark[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

export function addBookmark(bookmark: Bookmark): void {
  const bookmarks = getBookmarks();
  bookmarks.unshift(bookmark);
  saveBookmarks(bookmarks);
}

export function updateBookmark(id: string, updates: Partial<Bookmark>): void {
  const bookmarks = getBookmarks();
  const index = bookmarks.findIndex((b) => b.id === id);
  if (index !== -1) {
    bookmarks[index] = { ...bookmarks[index], ...updates };
    saveBookmarks(bookmarks);
  }
}

export function deleteBookmark(id: string): void {
  const bookmarks = getBookmarks().filter((b) => b.id !== id);
  saveBookmarks(bookmarks);
}
