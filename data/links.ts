export type LinkItem = {
  id: string;
  title: string;
  url: string;
  favicon_url?: string;
  created_at: string;
};

export const dummyLinks: LinkItem[] = [
  {
    id: "link-1",
    title: "인스타그램",
    url: "https://www.instagram.com/kwonala1a/?hl=ko",
    favicon_url: "https://www.google.com/s2/favicons?domain=instagram.com&sz=64",
    created_at: "2026-05-29T10:00:00Z"
  },
  {
    id: "link-2",
    title: "유튜브",
    url: "https://www.youtube.com/@%EA%B6%8C%EC%95%8C%EB%9D%BC",
    favicon_url: "https://www.google.com/s2/favicons?domain=youtube.com&sz=64",
    created_at: "2026-05-29T10:05:00Z"
  },
  {
    id: "link-3",
    title: "블로그",
    url: "https://blog.naver.com/gshdb",
    favicon_url: "https://www.google.com/s2/favicons?domain=naver.com&sz=64",
    created_at: "2026-05-29T10:10:00Z"
  },
  {
    id: "link-4",
    title: "GitHub",
    url: "https://github.com/gwondabu",
    favicon_url: "https://www.google.com/s2/favicons?domain=github.com&sz=64",
    created_at: "2026-05-29T10:15:00Z"
  }
];
