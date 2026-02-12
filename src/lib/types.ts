export interface Bookmark {
  id: string;
  url: string;
  title: string;
  summary: string;
  takeaways: string[];
  category: string;
  favicon: string;
  status: "pending" | "done" | "error";
  createdAt: number;
}

export interface SummarizeResponse {
  title: string;
  summary: string;
  takeaways: string[];
  category: string;
}
