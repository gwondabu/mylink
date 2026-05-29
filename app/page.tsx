"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { dummyLinks, LinkItem } from "@/data/links"
import { Link2, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Page() {
  const [links, setLinks] = useState<LinkItem[]>(dummyLinks)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      setErrorMessage("링크 제목을 입력해 주세요.")
      return
    }
    if (!newUrl.trim()) {
      setErrorMessage("주소를 입력해 주세요.")
      return
    }

    let formattedUrl = newUrl.trim()
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`
    }

    try {
      const urlObj = new URL(formattedUrl)
      const domain = urlObj.hostname
      const favicon_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`

      const newLinkItem: LinkItem = {
        id: `link-${Date.now()}`,
        title: newTitle.trim(),
        url: formattedUrl,
        favicon_url,
        created_at: new Date().toISOString()
      }

      setLinks([newLinkItem, ...links])
      setNewTitle("")
      setNewUrl("")
      setErrorMessage("")
      setIsDialogOpen(false)
    } catch (err) {
      setErrorMessage("올바른 형식의 URL을 입력해 주세요.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background px-4 py-16">
      
      {/* 중앙 메인 콘텐츠 컨테이너 */}
      <div className="flex w-full max-w-md flex-col items-center gap-8 my-auto">
        
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

        {/* 내 링크 관리 영역 */}
        <div className="flex w-full flex-col gap-4">
          
          <div className="flex items-center justify-between border-b pb-2 border-border/60">
            <h2 className="text-base font-bold text-foreground">내 링크 관리</h2>
            
            {/* 추가 폼 다이얼로그 */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger
                render={
                  <Button 
                    style={{ backgroundColor: "#5B5FC7" }} 
                    className="text-white hover:opacity-90 active:scale-[0.98] transition-all font-semibold rounded-lg text-xs px-3 py-1.5 flex items-center gap-1 shadow-sm h-auto cursor-pointer border-none"
                  />
                }
              >
                <Plus className="h-3.5 w-3.5" />
                <span>추가</span>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <form onSubmit={handleAddLink} className="flex flex-col gap-4">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold">내 링크 관리</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 py-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">제목</label>
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="링크 제목 입력"
                        className="rounded-lg"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">주소</label>
                      <Input
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="https://..."
                        className="rounded-lg"
                      />
                    </div>
                    {errorMessage && (
                      <p className="text-xs font-medium text-red-500 mt-1">{errorMessage}</p>
                    )}
                  </div>
                  <DialogFooter className="mt-2">
                    <Button 
                      type="submit" 
                      style={{ backgroundColor: "#5B5FC7" }} 
                      className="w-full text-white hover:opacity-90 active:scale-[0.98] transition-all py-5 font-semibold rounded-lg cursor-pointer border-none"
                    >
                      추가
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* 링크 버튼 리스트 (Card 컴포넌트 이용) */}
          <div className="flex w-full flex-col gap-4">
            {links.map((link) => (
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



