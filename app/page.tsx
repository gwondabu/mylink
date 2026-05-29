"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LinkItem } from "@/data/links"
import { Link2, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react"
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
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

// 커스텀 훅 및 공통 컴포넌트 임포트
import { useUser, UserProfile } from "@/hooks/use-user"
import { Header } from "@/components/header"

// Firestore 및 Auth 임포트
import { db, auth } from "@/lib/firebase"
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, where, serverTimestamp } from "firebase/firestore"
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"

export default function Page() {
  const { user, profile, loading: authLoading } = useUser()
  const [links, setLinks] = useState<LinkItem[]>([])
  
  // 미리보기/조회 모드 상태
  const [previewUid, setPreviewUid] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [previewProfile, setPreviewProfile] = useState<UserProfile | null>(null)

  // 링크 추가 다이얼로그 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 수정(인라인 편집)을 위한 로컬 상태들
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editUrl, setEditUrl] = useState("")
  const [editError, setEditError] = useState("")

  // 프로필 수정을 위한 상태들
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileUsername, setProfileUsername] = useState("")
  const [profileDisplayName, setProfileDisplayName] = useState("")
  const [profileBio, setProfileBio] = useState("")
  const [profileError, setProfileError] = useState("")

  // 삭제 확인 모달을 위한 로컬 상태들
  const [linkToDelete, setLinkToDelete] = useState<LinkItem | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // URL 쿼리스트링 분석 (미리보기 모드 및 타인 페이지 조회 대응)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const uidParam = params.get("uid")
      const previewParam = params.get("preview")
      
      if (uidParam) {
        setPreviewUid(uidParam)
      }
      if (previewParam === "true") {
        setIsPreview(true)
      }
    }
  }, [])

  // 조회 대상 UID 정보 로드
  useEffect(() => {
    if (previewUid) {
      // 1. 해당 유저의 프로필 fetch
      const docRef = doc(db, "users", previewUid)
      getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
          setPreviewProfile(docSnap.data() as UserProfile)
        }
      }).catch((err) => console.error("Preview profile fetch error:", err))

      // 2. 해당 유저의 링크 fetch
      fetchLinks(previewUid)
    }
  }, [previewUid])

  // Firestore에서 일회성 패치 방식으로 데이터를 갱신(Refetch)
  const fetchLinks = async (uid: string) => {
    setIsLoading(true)
    try {
      const q = query(
        collection(db, `users/${uid}/links`),
        orderBy("createdAt", "desc")
      )
      const snapshot = await getDocs(q)
      const fetchedLinks: LinkItem[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        let createdAtStr = new Date().toISOString()
        if (data.createdAt) {
          createdAtStr = typeof data.createdAt.toDate === "function"
            ? data.createdAt.toDate().toISOString()
            : new Date(data.createdAt).toISOString()
        }

        let updatedAtStr = undefined
        if (data.updatedAt) {
          updatedAtStr = typeof data.updatedAt.toDate === "function"
            ? data.updatedAt.toDate().toISOString()
            : new Date(data.updatedAt).toISOString()
        }

        // DB에 저장되지 않는 파비콘 URL을 입력된 url을 통해 동적 추출
        let favicon_url = ""
        try {
          const urlObj = new URL(data.url || "")
          favicon_url = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
        } catch (err) {
          // URL 파싱 에러 대응
        }

        return {
          id: doc.id,
          title: data.title || "",
          url: data.url || "",
          favicon_url,
          created_at: createdAtStr,
          updated_at: updatedAtStr
        }
      })
      setLinks(fetchedLinks)
    } catch (error) {
      console.error("Firestore links fetch error: ", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 로그인 상태 변화에 따른 링크 갱신 (미리보기 모드가 아닐 때만 동작)
  useEffect(() => {
    if (!previewUid) {
      if (user) {
        fetchLinks(user.uid)
      } else {
        setLinks([])
      }
    }
  }, [user, previewUid])

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Login failed: ", error)
    }
  }

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
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
      await addDoc(collection(db, `users/${user.uid}/links`), {
        title: trimmedTitle,
        url: formattedUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      setNewTitle("")
      setNewUrl("")
      setErrorMessage("")
      setIsDialogOpen(false)
      
      // 데이터 갱신
      await fetchLinks(user.uid)
    } catch (err) {
      setErrorMessage("올바른 형식의 URL을 입력해 주세요. (예: https://example.com)")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateLink = async (e: React.FormEvent, id: string) => {
    e.preventDefault()
    if (!user) return
    setEditError("")

    const trimmedTitle = editTitle.trim()
    const trimmedUrl = editUrl.trim()

    if (!trimmedTitle) {
      setEditError("링크 제목을 입력해 주세요.")
      return
    }
    if (!trimmedUrl) {
      setEditError("주소를 입력해 주세요.")
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
        setEditError("올바른 도메인 주소 형식이 아닙니다. (예: example.com)")
        return
      }

      setIsSubmitting(true)

      // Firestore의 문서 업데이트
      await updateDoc(doc(db, `users/${user.uid}/links`, id), {
        title: trimmedTitle,
        url: formattedUrl,
        updatedAt: serverTimestamp()
      })

      setEditingLinkId(null)
      setEditTitle("")
      setEditUrl("")
      
      // 데이터 갱신
      await fetchLinks(user.uid)
    } catch (err) {
      setEditError("올바른 형식의 URL을 입력해 주세요. (예: https://example.com)")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return
    setProfileError("")

    const trimmedUsername = profileUsername.trim().toLowerCase()
    const trimmedDisplayName = profileDisplayName.trim()
    const trimmedBio = profileBio.trim()

    // 1. 유효성 검사
    if (!trimmedUsername) {
      setProfileError("사용자 이름(username)을 입력해 주세요.")
      return
    }
    if (!trimmedDisplayName) {
      setProfileError("표시 이름(displayName)을 입력해 주세요.")
      return
    }
    if (!/^[a-z0-9_-]+$/.test(trimmedUsername)) {
      setProfileError("username은 영문 소문자, 숫자, 언더바(_), 하이픈(-)만 가능합니다.")
      return
    }
    if (trimmedBio.length > 80) {
      setProfileError("자기소개는 최대 80자까지 입력 가능합니다.")
      return
    }

    // 2. [최적화] 변경된 사항이 없으면 Firestore 업데이트 없이 종료
    if (
      trimmedUsername === profile.username &&
      trimmedDisplayName === profile.displayName &&
      trimmedBio === profile.profile_bio
    ) {
      setIsProfileOpen(false)
      return
    }

    try {
      setIsSubmitting(true)

      // 3. username 중복 체크 (본인 uid는 제외)
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("username", "==", trimmedUsername))
      const querySnapshot = await getDocs(q)
      const isDuplicate = querySnapshot.docs.some(docSnap => docSnap.id !== user.uid)

      if (isDuplicate) {
        setProfileError("이미 사용 중인 사용자 이름(username)입니다.")
        return
      }

      // 4. Firestore users/{userId} 개별 필드 업데이트
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        username: trimmedUsername,
        displayName: trimmedDisplayName,
        profile_bio: trimmedBio
      })

      setIsProfileOpen(false)
    } catch (err) {
      console.error("Profile update error: ", err)
      setProfileError("프로필 업데이트 중 오류가 발생했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteLink = async () => {
    if (!user || !linkToDelete) return

    try {
      setIsSubmitting(true)

      // Firestore에서 문서 삭제
      await deleteDoc(doc(db, `users/${user.uid}/links`, linkToDelete.id))

      setIsDeleteOpen(false)
      setLinkToDelete(null)
      
      // 데이터 갱신
      await fetchLinks(user.uid)
    } catch (err) {
      console.error("Delete error: ", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = () => {
    // 1. 조회 모드일 때
    if (previewUid && previewProfile) {
      return (previewProfile.displayName || "ML").slice(0, 2).toUpperCase()
    }
    // 2. 본인 관리 모드일 때
    if (profile?.displayName) {
      return profile.displayName.slice(0, 2).toUpperCase()
    }
    if (user?.displayName) {
      return user.displayName.slice(0, 2).toUpperCase()
    }
    return "ML"
  }

  // 미리보기 모드인지 판별 (URL에 preview=true가 있고, 수정 권한이 없는 경우)
  const isPreviewMode = isPreview || (previewUid !== null && (!user || user.uid !== previewUid))

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-background px-4 pb-16 overflow-hidden">
      
      {/* 백그라운드 디자인용 은은한 애플 스타일 광원 (Rich Aesthetics) */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] aspect-square rounded-full bg-zinc-200/20 dark:bg-zinc-800/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] aspect-square rounded-full bg-zinc-300/20 dark:bg-zinc-700/10 blur-[150px] pointer-events-none" />

      {/* 상단 헤더 영역 (미리보기 모드 또는 타인 조회 모드일 때는 간단한 뒤로가기 바 제공) */}
      {isPreviewMode ? (
        <header className="flex w-full max-w-md items-center justify-between py-4 border-b border-border/40 mb-8 shrink-0 z-10 animate-slide-down">
          <button 
            onClick={() => {
              if (user && user.uid === previewUid) {
                window.location.href = "/" // 편집 모드로 돌아가기
              } else {
                window.location.href = "/"
              }
            }}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>{user && user.uid === previewUid ? "편집 모드로 돌아가기" : "홈으로"}</span>
          </button>
          <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full select-none">
            미리보기 모드
          </span>
        </header>
      ) : (
        <Header />
      )}

      {/* 중앙 메인 콘텐츠 컨테이너 */}
      <div className="flex w-full max-w-md flex-col items-center gap-8 my-auto w-full z-10">
        
        {authLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner className="h-8 w-8 text-primary" />
            <p className="text-xs text-muted-foreground animate-pulse">사용자 정보 확인 중...</p>
          </div>
        ) : isPreviewMode ? (
          /* ========================================================
             일반 방문자용 미리보기 모드 뷰 (조회 기능만 활성화, 수정 비노출)
             ======================================================== */
          <div className="flex w-full flex-col gap-8 animate-fade-in">
            {/* 프로필 정보 */}
            <div className="flex flex-col items-center text-center gap-4">
              <Avatar size="lg" className="h-24 w-24 ring-4 ring-background shadow-lg">
                <AvatarImage src={previewProfile?.profile_image_url || undefined} alt="Preview profile avatar" />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-tr from-primary/80 to-violet-500/80 text-white">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1.5 items-center w-full">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {previewProfile?.displayName || "UserName"}
                </h1>
                <p className="text-xs font-mono font-semibold text-primary bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/10 select-none">
                  @{previewProfile?.username || "username"}
                </p>
                {previewProfile?.profile_bio ? (
                  <p className="text-sm text-muted-foreground max-w-xs font-normal leading-relaxed mt-2 p-3 bg-card/60 backdrop-blur-md rounded-lg border border-border/40 w-full text-center">
                    {previewProfile.profile_bio}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground/60 max-w-xs font-normal leading-relaxed mt-1">
                    나의 소중한 소셜 미디어와 링크들을 한 곳에 모았습니다.
                  </p>
                )}
              </div>
            </div>

            {/* 링크 리스트 */}
            <div className="flex w-full flex-col gap-4">
              {isLoading ? (
                <div className="flex w-full flex-col gap-4 animate-pulse">
                  {[1, 2].map((i) => (
                    <Card key={i} className="overflow-hidden border border-border/40 bg-card/30">
                      <CardContent className="h-14 bg-muted/40" />
                    </Card>
                  ))}
                </div>
              ) : links.length === 0 ? (
                <Card className="border border-dashed border-border bg-card/30">
                  <CardContent className="p-8 text-center text-xs text-muted-foreground">
                    등록된 링크가 없습니다.
                  </CardContent>
                </Card>
              ) : (
                <div className="flex w-full flex-col gap-4">
                  {links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block w-full transition-transform duration-200 active:scale-[0.99]"
                    >
                      <Card className="overflow-hidden border border-border bg-card/60 backdrop-blur-md transition-all duration-300 hover:bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.01]">
                        <CardContent className="grid grid-cols-[40px_1fr_40px] items-center p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/85 border border-border/60 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
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
                            <div className="items-center justify-center text-muted-foreground group-hover:text-primary" style={{ display: link.favicon_url ? "none" : "flex" }}>
                              <Link2 className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="text-center min-w-0 px-2">
                            <h2 className="text-sm font-semibold tracking-wide text-foreground group-hover:text-primary transition-colors truncate">
                              {link.title}
                            </h2>
                          </div>
                          <div className="w-10 h-10" /> {/* 우측 간격 맞춤용 공백 */}
                        </CardContent>
                      </Card>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : !user ? (
          /* ========================================================
             비로그인 애플 스타일 화면 가득 채운 랜딩페이지 (Apple style aesthetics)
             ======================================================== */
          <div className="flex w-full flex-col items-center justify-center min-h-[75vh] py-8 text-center animate-in fade-in-0 duration-1000 slide-in-from-bottom-8">
            
            {/* 애플 스타일의 미니멀 배지 */}
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/80 text-[10px] font-semibold tracking-wider uppercase mb-6 select-none animate-pulse">
              Introducing MyLink
            </div>
            
            {/* 웅장하고 큰 메인 카피 */}
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1] max-w-lg mb-4">
              Development in
              <span className="block bg-gradient-to-r from-zinc-950 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500 bg-clip-text text-transparent">
                One Link
              </span>
            </h1>

            {/* 깔끔한 서브 헤드라인 */}
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed font-normal mb-8 px-4">
              깃허브, 블로그, 포트폴리오를 가장 미니멀하고 직관적인 단 하나의 링크로 통합하여 표현해 보세요.
            </p>

            {/* 시작하기 버튼 영역 */}
            <div className="w-full max-w-xs flex flex-col gap-4 px-4">
              <Button 
                onClick={handleLogin}
                className="w-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.98] transition-all py-6 text-sm font-semibold rounded-full cursor-pointer border-none shadow-md"
              >
                Google 계정으로 시작하기
              </Button>
            </div>
            
          </div>
        ) : (
          /* ========================================================
             로그인 성공 시의 내 링크 관리 대시보드 화면
             ======================================================== */
          <>
            {/* 사용자 프로필 헤더 */}
            <div className="flex flex-col items-center text-center gap-4 animate-fade-in w-full">
              <Avatar size="lg" className="h-24 w-24 ring-4 ring-background shadow-lg transition-transform duration-300 hover:scale-105">
                <AvatarImage src={profile?.profile_image_url || user.photoURL || undefined} alt="Profile avatar image" />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-tr from-primary/80 to-violet-500/80 text-white">{getInitials()}</AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col gap-1.5 items-center w-full">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {profile?.displayName || user.displayName || user.email?.split("@")[0]}
                </h1>
                
                {/* username 출력 영역 (@ 기호 닉네임에서 분리) */}
                <p className="text-xs font-mono font-semibold text-primary bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/10 select-none">
                  @{profile?.username || user.email?.split("@")[0]}
                </p>

                <p className="text-[10px] text-muted-foreground/60 select-none">
                  {profile?.email || user.email}
                </p>

                {profile?.profile_bio ? (
                  <p className="text-sm text-muted-foreground max-w-xs font-normal leading-relaxed mt-2 p-3 bg-muted/40 rounded-lg border border-border/40 w-full text-center">
                    {profile.profile_bio}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground/60 max-w-xs font-normal leading-relaxed mt-1">
                    나의 소중한 소셜 미디어와 링크들을 한 곳에 모았습니다.
                  </p>
                )}

                {/* 프로필 수정 모달 버튼 */}
                <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                  <DialogTrigger
                    render={
                      <Button 
                        onClick={() => {
                          setProfileUsername(profile?.username || "")
                          setProfileDisplayName(profile?.displayName || "")
                          setProfileBio(profile?.profile_bio || "")
                          setProfileError("")
                        }}
                        variant="outline"
                        size="xs"
                        className="mt-3 text-[11px] rounded-lg h-7 px-3 cursor-pointer flex items-center gap-1.5 hover:bg-muted"
                      />
                    }
                  >
                    <Pencil className="h-3 w-3" />
                    <span>프로필 수정</span>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold">프로필 수정</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-3 py-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">사용자 이름 (username)</label>
                          <Input
                            value={profileUsername}
                            onChange={(e) => setProfileUsername(e.target.value)}
                            placeholder="사용자 고유 아이디 (영문 소문자/숫자/_/-)"
                            className="rounded-lg text-xs"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">표시 이름 (displayName)</label>
                          <Input
                            value={profileDisplayName}
                            onChange={(e) => setProfileDisplayName(e.target.value)}
                            placeholder="노출될 실명 또는 닉네임"
                            className="rounded-lg text-xs"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">한 줄 소개 (bio)</label>
                          <Input
                            value={profileBio}
                            onChange={(e) => setProfileBio(e.target.value)}
                            placeholder="나를 설명하는 한 줄 문구 (최대 80자)"
                            maxLength={80}
                            className="rounded-lg text-xs"
                            disabled={isSubmitting}
                          />
                        </div>
                        {profileError && (
                          <p className="text-xs font-medium text-red-500 mt-1">{profileError}</p>
                        )}
                      </div>
                      <DialogFooter className="mt-2">
                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                          style={{ backgroundColor: "#5B5FC7" }} 
                          className="w-full text-white hover:opacity-90 active:scale-[0.98] transition-all py-5 font-semibold rounded-lg cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? <Spinner /> : "저장"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
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
                          className="w-full text-white hover:opacity-90 active:scale-[0.98] transition-all py-5 font-semibold rounded-lg cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? <Spinner /> : "추가"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* 링크 버튼 리스트 (Card 컴포넌트 이용) */}
              <div className="flex w-full flex-col gap-4">
                {isLoading ? (
                  <div className="flex w-full flex-col gap-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="overflow-hidden border border-border/40 bg-card/30 backdrop-blur-md">
                        <CardContent className="grid grid-cols-[40px_1fr_40px] items-center p-4">
                          {/* 왼쪽 Favicon 슬롯 */}
                          <div className="h-10 w-10 rounded-lg bg-muted border border-border/40" />
                          {/* 중앙 제목 슬롯 */}
                          <div className="flex justify-center px-4">
                            <div className="h-4 bg-muted rounded w-24" />
                          </div>
                          {/* 오른쪽 대칭용 슬롯 */}
                          <div className="w-10 h-10" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : links.length === 0 ? (
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
                  links.map((link) => 
                    editingLinkId === link.id ? (
                      /* 인라인 편집 모드 UI */
                      <Card key={link.id} className="overflow-hidden border border-primary/50 bg-card/85 backdrop-blur-md transition-all duration-300">
                        <CardContent className="p-4">
                          <form onSubmit={(e) => handleUpdateLink(e, link.id)} className="flex flex-col gap-3">
                            <div className="flex flex-col gap-2">
                              <div>
                                <label className="text-[10px] font-semibold text-muted-foreground">제목</label>
                                <Input
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  placeholder="링크 제목 입력"
                                  className="h-9 text-sm rounded-lg mt-0.5"
                                  disabled={isSubmitting}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-muted-foreground">주소</label>
                                <Input
                                  value={editUrl}
                                  onChange={(e) => setEditUrl(e.target.value)}
                                  placeholder="https://..."
                                  className="h-9 text-sm rounded-lg mt-0.5"
                                  disabled={isSubmitting}
                                />
                              </div>
                            </div>
                            {editError && (
                              <p className="text-xs text-red-500 font-medium">{editError}</p>
                            )}
                            <div className="flex gap-2 justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingLinkId(null)}
                                className="text-xs px-3 py-1.5 h-auto rounded-lg cursor-pointer"
                                disabled={isSubmitting}
                              >
                                취소
                              </Button>
                              <Button
                                type="submit"
                                style={{ backgroundColor: "#5B5FC7" }}
                                className="text-white hover:opacity-90 active:scale-[0.98] transition-all font-semibold rounded-lg text-xs px-3 py-1.5 h-auto cursor-pointer border-none flex items-center justify-center gap-1.5"
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? <Spinner /> : "저장"}
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    ) : (
                      /* 일반 카드 목록 및 수정/삭제 버튼 */
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block w-full transition-transform duration-200 active:scale-[0.99]"
                      >
                        <Card className="overflow-hidden border border-border bg-card/60 backdrop-blur-md transition-all duration-300 hover:bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.01] active:border-primary/60">
                          <CardContent className="grid grid-cols-[40px_1fr_80px] items-center p-4">
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

                            {/* 중앙 정렬된 링크 제목 (수정 시각 노출 제거) */}
                            <div className="text-center min-w-0 px-2">
                              <h2 className="text-sm font-semibold tracking-wide text-foreground group-hover:text-primary transition-colors truncate">
                                {link.title}
                              </h2>
                            </div>

                            {/* 오른쪽 수정/삭제 버튼 영역 */}
                            <div className="flex items-center gap-1.5 justify-end z-10">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setEditingLinkId(link.id)
                                  setEditTitle(link.title)
                                  setEditUrl(link.url)
                                  setEditError("")
                                }}
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setLinkToDelete(link)
                                  setIsDeleteOpen(true)
                                }}
                                className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </a>
                    )
                  )
                )}
              </div>

            </div>
          </>
        )}

      </div>

      {/* 삭제 확인 모달 */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <div className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">정말 삭제하시겠습니까?</DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col gap-2 py-2">
              <p className="text-sm text-foreground">
                삭제 대상: <span className="font-semibold">{linkToDelete?.title}</span>
              </p>
              <p className="text-xs text-red-500 font-semibold bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-200 dark:border-red-900/50">
                이 작업은 되돌릴 수 없습니다
              </p>
            </div>

            <DialogFooter className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteOpen(false)
                  setLinkToDelete(null)
                }}
                className="text-xs px-3 py-1.5 h-auto rounded-lg cursor-pointer"
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteLink}
                className="font-semibold rounded-lg text-xs px-3 py-1.5 h-auto cursor-pointer flex items-center justify-center gap-1.5"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Spinner /> : "삭제하기"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

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
