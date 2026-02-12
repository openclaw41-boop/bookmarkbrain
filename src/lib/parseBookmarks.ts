export interface ParsedBookmark {
  url: string;
  title: string;
}

export function parseBookmarksHtml(html: string): ParsedBookmark[] {
  const bookmarks: ParsedBookmark[] = [];
  // Match <A HREF="..." ...>Title</A> patterns from bookmark exports
  const regex = /<A\s+HREF="([^"]+)"[^>]*>([^<]*)<\/A>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1].trim();
    const title = match[2].trim();
    if (url.startsWith("http://") || url.startsWith("https://")) {
      bookmarks.push({ url, title: title || url });
    }
  }
  return bookmarks;
}

export function parseUrlList(text: string): ParsedBookmark[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("http://") || line.startsWith("https://"))
    .map((url) => ({ url, title: "" }));
}
