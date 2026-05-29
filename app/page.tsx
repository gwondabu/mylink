"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LinkItem } from "@/data/links"
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

// Firestore 연동을 위한 모듈 임포트
import { db } from "@/lib/firebase"
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp, serverTimestamp } from "firebase/firestore"

export default function Page() {
  const [links, setLinks] = useState<LinkItem[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Firestore 데이터 실시간 동기화 및 로드
  useEffect(() => {
    const q = query(
      collection(db, "users/anonymous/links"),
      orderBy("createdAt", "desc")
    )
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedLinks: LinkItem[] = snapshot.docs.map((doc) => {
          const data = doc.data()
          let createdAtStr = new Date().toISOString()
          if (data.createdAt) {
            createdAtStr = typeof data.createdAt.toDate === "function"
              ? data.createdAt.toDate().toISOString()
              : new Date(data.createdAt).toISOString()
          }

          // DB 필드에 저장되지 않는 파비콘 URL을 입력된 url을 통해 동적 추출
          let favicon_url = ""
          try {
            const urlObj = new URL(data.url || "")
            favicon_url = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
          } catch (err) {
            // URL 파싱 에러 시 빈 값 유지
          }

          return {
            id: doc.id,
            title: data.title || "",
            url: data.url || "",
            favicon_url,
            created_at: createdAtStr
          }
        })
        setLinks(fetchedLinks)
      },
      (error) => {
        console.error("Firestore links fetch error: ", error)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    const trimmedTitle = newTitle.trim()
    const trimmedUrl = newUrl.trim()

    if (!trimmedTitle) {
      setErrorMessage("링크 제목을 입력해 주세요.")
      return
    }
    if (!trimmedUrl) {
      setErrorMessage("주소를 입력해 주세요.")
      return
    }

    let formattedUrl = trimmedUrl
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`
    }

    try {
      const urlObj = new URL(formattedUrl)
      const domain = urlObj.hostname
      
      if (!domain.includes(".") || domain.length < 4) {
        setErrorMessage("올바른 도메인 주소 형식이 아닙니다. (예: example.com)")
        return
      }

      setIsSubmitting(true)

      // Firestore에 문서 추가
      await addDoc(collection(db, "users/anonymous/links"), {
        title: trimmedTitle,
        url: formattedUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      setNewTitle("")
      setNewUrl("")
      setErrorMessage("")
      setIsDialogOpen(false)
    } catch (err) {
      setErrorMessage("올바른 형식의 URL을 입력해 주세요. (예: https://example.com)")
    } finally {
      setIsSubmitting(false)
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
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">주소</label>
                      <Input
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="https://..."
                        className="rounded-lg"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errorMessage && (
                      <p className="text-xs font-medium text-red-500 mt-1">{errorMessage}</p>
                    )}
                  </div>
                  <DialogFooter className="mt-2">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      style={{ backgroundColor: "#5B5FC7" }} 
                      className="w-full text-white hover:opacity-90 active:scale-[0.98] transition-all py-5 font-semibold rounded-lg cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "추가 중..." : "추가"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* 링크 버튼 리스트 (Card 컴포넌트 이용) */}
          <div className="flex w-full flex-col gap-4">
            {links.length === 0 ? (
              <Card className="border border-dashed border-border/80 bg-card/30 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground/60">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    <h3 className="text-sm font-semibold text-foreground">등록된 링크가 없습니다</h3>
                    <p className="text-xs text-muted-foreground max-w-[240px]">
                      우측 상단의 추가 버튼을 눌러 나만의 소셜 링크를 등록해 보세요.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              links.map((link) => (
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
              ))
            )}
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




