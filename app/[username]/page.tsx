"use client"

import { use, useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, doc, getDocs, query, orderBy, updateDoc, increment } from "firebase/firestore"
import { UserProfile } from "@/hooks/use-user"
import { LinkItem } from "@/data/links"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Link2, ArrowLeft } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface PageProps {
  params: Promise<{ username: string }>
}

export default function UserLandingPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const username = resolvedParams.username

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [links, setLinks] = useState<LinkItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true)
        setError(null)

        // 1. username에 해당하는 사용자 검색
        const usersRef = collection(db, "users")
        const q = query(usersRef)
        const querySnapshot = await getDocs(q)
        
        let foundUser: UserProfile | null = null
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as UserProfile
          if (data.username?.toLowerCase() === username.toLowerCase()) {
            foundUser = {
              ...data,
              uid: docSnap.id
            }
          }
        })

        if (!foundUser) {
          setError("사용자를 찾을 수 없습니다.")
          setLoading(false)
          return
        }

        setProfile(foundUser)

        // 2. 해당 사용자의 링크 리스트 가져오기
        const linksRef = collection(db, `users/${(foundUser as UserProfile).uid}/links`)
        const linksQuery = query(linksRef, orderBy("createdAt", "desc"))
        const linksSnapshot = await getDocs(linksQuery)

        const fetchedLinks = linksSnapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          let createdAtStr = new Date().toISOString()
          if (data.createdAt) {
            createdAtStr = typeof data.createdAt.toDate === "function"
              ? data.createdAt.toDate().toISOString()
              : new Date(data.createdAt).toISOString()
          }

          let favicon_url = ""
          try {
            const urlObj = new URL(data.url || "")
            favicon_url = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
          } catch (err) {}

          return {
            id: docSnap.id,
            title: data.title || "",
            url: data.url || "",
            favicon_url,
            created_at: createdAtStr,
            clickCount: data.clickCount || 0
          }
        })

        setLinks(fetchedLinks)
      } catch (err) {
        console.error("데이터 조회 중 오류 발생: ", err)
        setError("데이터를 불러오는 중 오류가 발생했습니다.")
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchUserData()
    }
  }, [username])

  // 클릭 이벤트 핸들러: 클릭 카운트 누적 후 새 창 열기
  const handleClickLink = async (link: LinkItem) => {
    if (!profile) return

    // 새 탭으로 우선 연결
    window.open(link.url, "_blank", "noopener,noreferrer")

    try {
      // Firestore clickCount 필드 원자적으로 1 증가
      const linkDocRef = doc(db, `users/${profile.uid}/links`, link.id)
      await updateDoc(linkDocRef, {
        clickCount: increment(1)
      })
    } catch (err) {
      console.error("클릭 카운트 저장 중 오류가 발생했습니다 (Security Rules 등):", err)
    }
  }

  const getInitials = () => {
    if (profile?.displayName) {
      return profile.displayName.slice(0, 2).toUpperCase()
    }
    return "ML"
  }

  const totalClicks = links.reduce((sum, link) => sum + (link.clickCount || 0), 0)

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Spinner className="h-8 w-8 text-primary mb-2" />
        <p className="text-xs text-muted-foreground animate-pulse">프로필 페이지 로딩 중...</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-650 dark:text-red-400 mb-4">
          <span className="text-lg font-bold">!</span>
        </div>
        <h1 className="text-lg font-bold text-foreground mb-1">{error || "프로필을 찾을 수 없습니다"}</h1>
        <p className="text-xs text-muted-foreground mb-6">주소가 올바른지 확인하거나 홈으로 이동하세요.</p>
        <a href="/">
          <button className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>메인 페이지로 가기</span>
          </button>
        </a>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-background px-4 pb-16 overflow-hidden">
      {/* 백그라운드 광원 디자인 (Rich Aesthetics) */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] aspect-square rounded-full bg-zinc-200/20 dark:bg-zinc-800/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] aspect-square rounded-full bg-zinc-300/20 dark:bg-zinc-700/10 blur-[150px] pointer-events-none" />

      {/* 상단 브랜딩 바 */}
      <header className="flex w-full max-w-md items-center justify-between py-4 border-b border-border/40 mb-8 shrink-0 z-10">
        <a href="/" className="flex items-center gap-1.5 text-sm font-extrabold tracking-widest text-foreground hover:opacity-90 select-none">
          <span>🔗</span>
          <span>MyLink</span>
        </a>
        <span className="text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-550 px-2 py-0.5 rounded-full select-none">
          Public Profile
        </span>
      </header>

      {/* 인스타그램 스타일 프로필 레이아웃 */}
      <div className="flex w-full max-w-md flex-col items-center gap-8 my-auto z-10 animate-fade-in">
        <div className="flex gap-6 items-start pb-6 border-b border-zinc-200/60 dark:border-zinc-800/60 w-full">
          <Avatar size="lg" className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 ring-4 ring-background shadow-md">
            <AvatarImage src={profile.profile_image_url || undefined} alt={`${profile.displayName} avatar`} />
            <AvatarFallback className="text-xl font-bold bg-gradient-to-tr from-primary/80 to-violet-500/80 text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-foreground truncate max-w-[200px]">
                {profile.displayName || "ML User"}
              </h1>
              <span className="text-[10px] font-mono font-semibold text-zinc-550 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 select-none">
                @{profile.username}
              </span>
            </div>
            
            {/* 인스타그램 스타일의 링크 수, 총 클릭 수 정보 */}
            <div className="flex gap-4 text-xs text-zinc-650 dark:text-zinc-400 select-none">
              <div>링크 <span className="font-bold text-foreground">{links.length}</span></div>
              <div>클릭 <span className="font-bold text-foreground">{totalClicks}</span></div>
            </div>

            {profile.profile_bio ? (
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal whitespace-pre-line mt-1">
                {profile.profile_bio}
              </p>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-550 leading-relaxed font-normal mt-1">
                나의 소중한 소셜 미디어와 링크들을 한 곳에 모았습니다.
              </p>
            )}
          </div>
        </div>

        {/* 링크 목록 */}
        <div className="flex w-full flex-col gap-4">
          {links.length === 0 ? (
            <Card className="border border-dashed border-border bg-card/30">
              <CardContent className="p-8 text-center text-xs text-muted-foreground">
                등록된 링크가 없습니다.
              </CardContent>
            </Card>
          ) : (
            <div className="flex w-full flex-col gap-4">
              {links.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleClickLink(link)}
                  className="group block w-full text-left transition-transform duration-200 active:scale-[0.99] cursor-pointer"
                >
                  <Card className="overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md transition-all duration-300 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md hover:scale-[1.01]">
                    <CardContent className="grid grid-cols-[40px_1fr_40px] items-center p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
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
                        <div className="items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-650" style={{ display: link.favicon_url ? "none" : "flex" }}>
                          <Link2 className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-center min-w-0 px-2">
                        {/* 다크모드 글씨 선명도를 위해 dark:text-white 적용 */}
                        <h2 className="text-sm font-semibold tracking-wide text-zinc-800 dark:text-white truncate">
                          {link.title}
                        </h2>
                      </div>
                      <div className="w-10 h-10" />
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
