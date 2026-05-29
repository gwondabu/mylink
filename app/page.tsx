"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LinkItem } from "@/data/links"
import { Link2, Plus, Pencil, Trash2, BarChart2 } from "lucide-react"
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
import { useUser } from "@/hooks/use-user"
import { Header } from "@/components/header"

// Firestore 및 Auth 임포트
import { db, auth } from "@/lib/firebase"
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, serverTimestamp } from "firebase/firestore"
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider } from "firebase/auth"

// TanStack Query 임포트
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export default function Page() {
  const { user, profile, loading: authLoading } = useUser()
  const queryClient = useQueryClient()
  
  // 링크 추가 다이얼로그 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // 삭제 확인 모달을 위한 로컬 상태들
  const [linkToDelete, setLinkToDelete] = useState<LinkItem | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // 1. [TanStack Query] 링크 리스트 조회
  const { data: links = [], isLoading } = useQuery<LinkItem[]>({
    queryKey: ["links", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return []
      const q = query(
        collection(db, `users/${user.uid}/links`),
        orderBy("createdAt", "desc")
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
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
          updated_at: updatedAtStr,
          clickCount: data.clickCount || 0
        }
      })
    },
    enabled: !!user?.uid
  })

  // 2. [TanStack Query Mutation] 링크 추가 (낙관적 업데이트 적용)
  const addMutation = useMutation({
    mutationFn: async (newLink: { title: string; url: string }) => {
      if (!user) throw new Error("Unauthenticated")
      return addDoc(collection(db, `users/${user.uid}/links`), {
        title: newLink.title,
        url: newLink.url,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        clickCount: 0
      })
    },
    onMutate: async (newLink) => {
      await queryClient.cancelQueries({ queryKey: ["links", user?.uid] })
      const previousLinks = queryClient.getQueryData<LinkItem[]>(["links", user?.uid])

      let favicon_url = ""
      try {
        const urlObj = new URL(newLink.url)
        favicon_url = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
      } catch (err) {}

      const tempId = `temp-${Date.now()}`
      const optimisticLink: LinkItem = {
        id: tempId,
        title: newLink.title,
        url: newLink.url,
        favicon_url,
        created_at: new Date().toISOString(),
        clickCount: 0
      }

      queryClient.setQueryData<LinkItem[]>(["links", user?.uid], (old) => [
        optimisticLink,
        ...(old || [])
      ])

      return { previousLinks }
    },
    onError: (err, newLink, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(["links", user?.uid], context.previousLinks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["links", user?.uid] })
    }
  })

  // 3. [TanStack Query Mutation] 링크 수정 (낙관적 업데이트 적용)
  const updateMutation = useMutation({
    mutationFn: async (editData: { id: string; title: string; url: string }) => {
      if (!user) throw new Error("Unauthenticated")
      return updateDoc(doc(db, `users/${user.uid}/links`, editData.id), {
        title: editData.title,
        url: editData.url,
        updatedAt: serverTimestamp()
      })
    },
    onMutate: async (editData) => {
      await queryClient.cancelQueries({ queryKey: ["links", user?.uid] })
      const previousLinks = queryClient.getQueryData<LinkItem[]>(["links", user?.uid])

      queryClient.setQueryData<LinkItem[]>(["links", user?.uid], (old) => {
        return (old || []).map((link) => {
          if (link.id === editData.id) {
            let favicon_url = link.favicon_url
            try {
              const urlObj = new URL(editData.url)
              favicon_url = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
            } catch (err) {}
            return {
              ...link,
              title: editData.title,
              url: editData.url,
              favicon_url
            }
          }
          return link
        })
      })

      return { previousLinks }
    },
    onError: (err, editData, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(["links", user?.uid], context.previousLinks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["links", user?.uid] })
    }
  })

  // 4. [TanStack Query Mutation] 링크 삭제 (낙관적 업데이트 적용)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Unauthenticated")
      return deleteDoc(doc(db, `users/${user.uid}/links`, id))
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["links", user?.uid] })
      const previousLinks = queryClient.getQueryData<LinkItem[]>(["links", user?.uid])

      queryClient.setQueryData<LinkItem[]>(["links", user?.uid], (old) => {
        return (old || []).filter((link) => link.id !== id)
      })

      return { previousLinks }
    },
    onError: (err, id, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(["links", user?.uid], context.previousLinks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["links", user?.uid] })
    }
  })

  const handleLogin = async () => {
    if (isLoggingIn) return
    setIsLoggingIn(true)
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      if (error.code === "auth/popup-blocked" || error.code === "auth/cancelled-popup-request") {
        console.warn("Popup blocked or cancelled, trying redirect...")
        try {
          await signInWithRedirect(auth, provider)
        } catch (redirectError) {
          console.error("Redirect login failed: ", redirectError)
        }
      } else if (error.code === "auth/popup-closed-by-user") {
        console.warn("Login popup was closed by user")
      } else {
        console.error("Login failed: ", error)
      }
    } finally {
      setIsLoggingIn(false)
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

      await addMutation.mutateAsync({ title: trimmedTitle, url: formattedUrl })

      setNewTitle("")
      setNewUrl("")
      setErrorMessage("")
      setIsDialogOpen(false)
    } catch (err) {
      setErrorMessage("올바른 형식의 URL을 입력해 주세요. (예: https://example.com)")
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

      await updateMutation.mutateAsync({ id, title: trimmedTitle, url: formattedUrl })

      setEditingLinkId(null)
      setEditTitle("")
      setEditUrl("")
    } catch (err) {
      setEditError("올바른 형식의 URL을 입력해 주세요. (예: https://example.com)")
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return
    setProfileError("")

    const trimmedUsername = profileUsername.trim().toLowerCase()
    const trimmedDisplayName = profileDisplayName.trim()
    const trimmedBio = profileBio.trim()

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

      const usersRef = collection(db, "users")
      const q = query(usersRef, where("username", "==", trimmedUsername))
      const querySnapshot = await getDocs(q)
      const isDuplicate = querySnapshot.docs.some(docSnap => docSnap.id !== user.uid)

      if (isDuplicate) {
        setProfileError("이미 사용 중인 사용자 이름(username)입니다.")
        return
      }

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
      await deleteMutation.mutateAsync(linkToDelete.id)
      setIsDeleteOpen(false)
      setLinkToDelete(null)
    } catch (err) {
      console.error("Delete error: ", err)
    }
  }

  const getInitials = () => {
    if (profile?.displayName) {
      return profile.displayName.slice(0, 2).toUpperCase()
    }
    if (user?.displayName) {
      return user.displayName.slice(0, 2).toUpperCase()
    }
    return "ML"
  }

  const isMutating = addMutation.isPending || updateMutation.isPending || deleteMutation.isPending || isSubmitting

  // 통계 연산
  const totalClicks = links.reduce((sum, link) => sum + (link.clickCount || 0), 0)
  const sortedLinksForStats = [...links].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-background px-4 pb-16 overflow-hidden">
      
      {/* 백그라운드 디자인용 은은한 광원 */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] aspect-square rounded-full bg-zinc-200/20 dark:bg-zinc-800/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] aspect-square rounded-full bg-zinc-300/20 dark:bg-zinc-700/10 blur-[150px] pointer-events-none" />

      <Header />

      <div className="flex w-full max-w-md flex-col items-center gap-8 my-auto w-full z-10">
        
        {authLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner className="h-8 w-8 text-primary" />
            <p className="text-xs text-muted-foreground animate-pulse">사용자 정보 확인 중...</p>
          </div>
        ) : !user ? (
          <div className="flex w-full flex-col items-center justify-center min-h-[75vh] py-8 text-center animate-in fade-in-0 duration-1000 slide-in-from-bottom-8">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/80 text-[10px] font-semibold tracking-wider uppercase mb-6 select-none animate-pulse">
              Introducing MyLink
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1] max-w-lg mb-4">
              Development in
              <span className="block bg-gradient-to-r from-zinc-950 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500 bg-clip-text text-transparent">
                One Link
              </span>
            </h1>

            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed font-normal mb-8 px-4">
              깃허브, 블로그, 포트폴리오를 가장 미니멀하고 직관적인 단 하나의 링크로 통합하여 표현해 보세요.
            </p>

            <div className="w-full max-w-xs flex flex-col gap-4 px-4">
              <Button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.98] transition-all py-6 text-sm font-semibold rounded-full cursor-pointer border-none shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoggingIn ? <Spinner className="h-4 w-4" /> : "Google 계정으로 시작하기"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-8 w-full animate-fade-in">
            
            {/* 인스타그램 스타일 프로필 헤더 */}
            <div className="flex gap-6 items-start pb-6 border-b border-zinc-200/60 dark:border-zinc-800/60 w-full text-left">
              <Avatar size="lg" className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 ring-4 ring-background shadow-lg transition-transform duration-300 hover:scale-105">
                <AvatarImage src={profile?.profile_image_url || user.photoURL || undefined} alt="Profile avatar image" />
                <AvatarFallback className="text-2xl font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-250">{getInitials()}</AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col gap-2.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]">
                    {profile?.displayName || user.displayName || user.email?.split("@")[0]}
                  </h1>
                  <span className="text-[10px] font-mono font-semibold text-zinc-600 dark:text-zinc-350 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700/80 select-none">
                    @{profile?.username || user.email?.split("@")[0]}
                  </span>
                </div>

                {/* 인스타그램 스타일 통계 (대시보드에도 링크 수, 클릭 수 노출) */}
                <div className="flex gap-4 text-xs text-zinc-650 dark:text-zinc-400 select-none">
                  <div>링크 <span className="font-bold text-foreground">{links.length}</span></div>
                  <div>총 클릭 <span className="font-bold text-foreground">{totalClicks}</span></div>
                </div>

                {profile?.profile_bio ? (
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mt-1 whitespace-pre-line">
                    {profile.profile_bio}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400 dark:text-zinc-555 leading-relaxed mt-1">
                    나의 소중한 소셜 미디어와 링크들을 한 곳에 모았습니다.
                  </p>
                )}

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
                        className="mt-2 text-[11px] rounded-lg h-7 px-3.5 cursor-pointer flex items-center gap-1.5 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-xs w-fit"
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
                            disabled={isMutating}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">표시 이름 (displayName)</label>
                          <Input
                            value={profileDisplayName}
                            onChange={(e) => setProfileDisplayName(e.target.value)}
                            placeholder="노출될 실명 또는 닉네임"
                            className="rounded-lg text-xs"
                            disabled={isMutating}
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
                            disabled={isMutating}
                          />
                        </div>
                        {profileError && (
                          <p className="text-xs font-medium text-red-500 mt-1">{profileError}</p>
                        )}
                      </div>
                      <DialogFooter className="mt-2">
                        <Button 
                          type="submit" 
                          disabled={isMutating}
                          style={{ backgroundColor: "#5B5FC7" }} 
                          className="w-full text-white hover:opacity-90 active:scale-[0.98] transition-all py-5 font-semibold rounded-lg cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isMutating ? <Spinner /> : "저장"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* 내 링크 관리 영역 (애플 디자인 스타일) */}
            <div className="flex w-full flex-col gap-4">
              <div className="flex items-center justify-between border-b pb-2 border-zinc-200/80 dark:border-zinc-800/80">
                <h2 className="text-[14px] font-bold text-zinc-800 dark:text-zinc-200">내 링크 목록</h2>
                
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
                            disabled={isMutating}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">주소</label>
                          <Input
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="https://..."
                            className="rounded-lg"
                            disabled={isMutating}
                          />
                        </div>
                        {errorMessage && (
                          <p className="text-xs font-medium text-red-500 mt-1">{errorMessage}</p>
                        )}
                      </div>
                      <DialogFooter className="mt-2">
                        <Button 
                          type="submit" 
                          disabled={isMutating}
                          style={{ backgroundColor: "#5B5FC7" }} 
                          className="w-full text-white hover:opacity-90 active:scale-[0.98] transition-all py-5 font-semibold rounded-lg cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isMutating ? <Spinner /> : "추가"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* 링크 버튼 리스트 */}
              <div className="flex w-full flex-col gap-4">
                {isLoading ? (
                  <div className="flex w-full flex-col gap-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="overflow-hidden border border-border/40 bg-card/30 backdrop-blur-md">
                        <CardContent className="grid grid-cols-[40px_1fr_40px] items-center p-4">
                          <div className="h-10 w-10 rounded-lg bg-muted border border-border/40" />
                          <div className="flex justify-center px-4">
                            <div className="h-4 bg-muted rounded w-24" />
                          </div>
                          <div className="w-10 h-10" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : links.length === 0 ? (
                  <Card className="border border-dashed border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10">
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">
                        <Link2 className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col gap-1 mt-2">
                        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">등록된 링크가 없습니다</h3>
                        <p className="text-xs text-zinc-400 dark:text-zinc-550 max-w-[240px]">
                          우측 상단의 추가 버튼을 눌러 나만의 소셜 링크를 등록해 보세요.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  links.map((link) => 
                    editingLinkId === link.id ? (
                      <Card key={link.id} className="overflow-hidden border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 transition-all duration-300">
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
                                  disabled={isMutating}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-muted-foreground">주소</label>
                                <Input
                                  value={editUrl}
                                  onChange={(e) => setEditUrl(e.target.value)}
                                  placeholder="https://..."
                                  className="h-9 text-sm rounded-lg mt-0.5"
                                  disabled={isMutating}
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
                                className="text-xs px-3 py-1.5 h-auto rounded-lg cursor-pointer border-zinc-200 dark:border-zinc-800"
                                disabled={isMutating}
                              >
                                취소
                              </Button>
                              <Button
                                type="submit"
                                style={{ backgroundColor: "#5B5FC7" }}
                                className="text-white hover:opacity-90 active:scale-[0.98] transition-all font-semibold rounded-lg text-xs px-3 py-1.5 h-auto cursor-pointer border-none flex items-center justify-center gap-1.5"
                                disabled={isMutating}
                              >
                                {isMutating ? <Spinner /> : "저장"}
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    ) : (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block w-full transition-transform duration-200 active:scale-[0.99]"
                      >
                        <Card className="overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md transition-all duration-300 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm">
                          <CardContent className="grid grid-cols-[40px_1fr_80px] items-center p-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-750 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
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
                                className="items-center justify-center text-zinc-400 dark:text-zinc-555 transition-colors"
                                style={{ display: link.favicon_url ? "none" : "flex" }}
                              >
                                <Link2 className="h-4 w-4" />
                              </div>
                            </div>

                            <div className="text-center min-w-0 px-2">
                              {/* 다크모드 글씨 선명도를 위해 dark:text-white 적용 */}
                              <h2 className="text-sm font-semibold tracking-wide text-zinc-800 dark:text-white truncate">
                                {link.title}
                              </h2>
                            </div>

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
                                className="h-8 w-8 text-zinc-400 dark:text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all shadow-xs"
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
                                className="h-8 w-8 text-zinc-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-md cursor-pointer border border-transparent hover:border-red-200/30 transition-all shadow-xs"
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

            {/* 📊 링크 분석 및 통계 섹션 */}
            <div className="flex w-full flex-col gap-4 mt-2">
              <div className="flex items-center gap-1.5 border-b pb-2 border-zinc-200/80 dark:border-zinc-800/80">
                <BarChart2 className="h-4 w-4 text-zinc-500" />
                <h2 className="text-[14px] font-bold text-zinc-800 dark:text-zinc-200">📊 링크 분석 및 통계</h2>
              </div>
              
              <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md">
                <CardContent className="p-5 flex flex-col gap-6">
                  {/* 총 클릭 수 강조 */}
                  <div className="flex flex-col gap-1 items-center justify-center py-2 border-b border-zinc-100 dark:border-zinc-800/50">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">총 누적 클릭 수</span>
                    <span className="text-3xl font-extrabold tracking-tight text-primary">
                      총 {totalClicks} 클릭
                    </span>
                  </div>

                  {/* 링크별 클릭수 리스트 (내림차순 정렬) */}
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">링크별 성과 (클릭 순)</span>
                    {sortedLinksForStats.length === 0 ? (
                      <p className="text-[11px] text-zinc-400 text-center py-2">아직 통계 데이터가 없습니다.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {sortedLinksForStats.map((link) => (
                          <div 
                            key={link.id}
                            className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/60"
                          >
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                              {link.title}
                            </span>
                            <span className="font-mono text-zinc-500 dark:text-zinc-400 shrink-0">
                              {link.clickCount || 0} clicks
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
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
                disabled={isMutating}
              >
                취소
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteLink}
                className="font-semibold rounded-lg text-xs px-3 py-1.5 h-auto cursor-pointer flex items-center justify-center gap-1.5"
                disabled={isMutating}
              >
                {isMutating ? <Spinner /> : "삭제하기"}
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
