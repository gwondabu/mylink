"use client"

import { Card, CardContent } from "@/components/ui/card"
import { dummyLinks } from "@/data/links"
import { Link2 } from "lucide-react"

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background px-4 py-16">
      
      {/* 중앙 메인 콘텐츠 컨테이너 */}
      <div className="flex w-full max-w-md flex-col items-center gap-10 my-auto">
        
        {/* 사용자 프로필 헤더 */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="relative flex h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gradient-to-tr from-primary/80 to-violet-500/80 shadow-lg ring-4 ring-background transition-transform duration-300 hover:scale-105">
            <span className="flex h-full w-full items-center justify-center rounded-full text-2xl font-bold text-primary-foreground tracking-wider select-none">
              ML
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              @MyLinkUser
            </h1>
            <p className="text-sm text-muted-foreground max-w-xs font-normal leading-relaxed">
              나의 소중한 소셜 미디어와 링크들을 한 곳에 모았습니다.
            </p>
          </div>
        </div>

        {/* 링크 버튼 리스트 (Card 컴포넌트 이용) */}
        <div className="flex w-full flex-col gap-4">
          {dummyLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block w-full transition-transform duration-200 active:scale-[0.99]"
            >
              <Card className="overflow-hidden border border-border bg-card/60 backdrop-blur-md transition-all duration-300 hover:bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.01] active:border-primary/60">
                <CardContent className="grid grid-cols-[40px_1fr_40px] items-center p-4">
                  {/* 왼쪽 Favicon 영역 */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/80 border border-border/60 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                    {link.favicon_url ? (
                      <img
                        src={link.favicon_url}
                        alt={`${link.title} favicon`}
                        className="h-5 w-5 object-contain rounded-sm"
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
                      <Link2 className="h-4 w-4" />
                    </div>
                  </div>

                  {/* 중앙 정렬된 링크 제목 */}
                  <div className="text-center min-w-0 px-2">
                    <h2 className="text-sm font-semibold tracking-wide text-foreground group-hover:text-primary transition-colors truncate">
                      {link.title}
                    </h2>
                  </div>

                  {/* 오른쪽 대칭용 빈 영역 */}
                  <div className="w-10 h-10" aria-hidden="true" />
                </CardContent>
              </Card>
            </a>
          ))}
        </div>

      </div>

      {/* 화면 최하단 브랜딩 워터마크 */}
      <div className="flex flex-col items-center gap-3 pt-12 pb-2">
        <a 
          href="/" 
          className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          <span className="text-sm">🔗</span>
          <span>MyLink</span>
        </a>
        <div className="font-mono text-[9px] text-muted-foreground/40 select-none">
          (Press <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[8px]">d</kbd> to toggle dark mode)
        </div>
      </div>

    </div>
  )
}


