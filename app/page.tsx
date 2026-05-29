"use client"

import { Card, CardContent } from "@/components/ui/card"
import { dummyLinks } from "@/data/links"
import { ExternalLink, Link2 } from "lucide-react"

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        
        {/* 프로필 섹션 */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="relative flex h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gradient-to-tr from-primary to-violet-500 shadow-lg ring-4 ring-background">
            <span className="flex h-full w-full items-center justify-center rounded-full text-2xl font-bold text-primary-foreground">
              ML
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-tight">MyLink User</h1>
            <p className="text-sm text-muted-foreground max-w-xs">
              나의 소중한 소셜 미디어와 링크들을 한 곳에 모았습니다.
            </p>
          </div>
        </div>

        {/* 링크 목록 섹션 */}
        <div className="flex w-full flex-col gap-4">
          {dummyLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block w-full transition-transform duration-200 active:scale-[0.98]"
            >
              <Card className="overflow-hidden border border-border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                    {link.favicon_url ? (
                      <img
                        src={link.favicon_url}
                        alt={`${link.title} favicon`}
                        className="h-6 w-6 object-contain rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                          if (sibling) sibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="items-center justify-center text-muted-foreground group-hover:text-primary transition-colors"
                      style={{ display: link.favicon_url ? "none" : "flex" }}
                    >
                      <Link2 className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold tracking-tight truncate text-foreground group-hover:text-primary transition-colors">
                      {link.title}
                    </h2>
                    <p className="text-xs text-muted-foreground truncate">
                      {link.url}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
                </CardContent>
              </Card>
            </a>
          ))}
        </div>

        {/* 다크모드 안내 및 푸터 */}
        <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-muted-foreground/60">
          <span>(Press <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[9px]">d</kbd> to toggle dark mode)</span>
          <span>© {new Date().getFullYear()} MyLink. All rights reserved.</span>
        </div>

      </div>
    </div>
  )
}

