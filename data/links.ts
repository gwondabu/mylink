export type LinkItem = {
  id: string;
  title: string;
  url: string;
  favicon_url?: string;
  created_at: string;
  updated_at?: string;
  clickCount?: number;
};

export const dummyLinks: LinkItem[] = [];
