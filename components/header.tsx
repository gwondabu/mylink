"use client"

import { useUser } from "@/hooks/use-user"
import { auth } from "@/lib/firebase"
import { signInWithPopup, signOut, GoogleAuthProvider } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ExternalLink, Copy, LogOut } from "lucide-react"

export function Header() {
  const { user, profile, loading } = useUser()

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Login failed: ", error)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Logout failed: ", error)
    }
  }

  const handleCopyLink = () => {
    if (typeof window !== "undefined" && user) {
      const previewUrl = `${window.location.origin}/?uid=${user.uid}&preview=true`
      navigator.clipboard.writeText(previewUrl)
      alert("내 페이지 주소가 복사되었습니다!\n" + previewUrl)
    }
  }

  const handlePreview = () => {
    if (typeof window !== "undefined" && user) {
      window.open(`/?uid=${user.uid}&preview=true`, "_blank")
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

  return (
    <header className="flex w-full max-w-md items-center justify-between py-4 border-b border-border/40 mb-8 shrink-0">
      <a href="/" className="flex items-center gap-1.5 text-sm font-extrabold tracking-widest text-foreground hover:opacity-90 select-none">
        <span>🔗</span>
        <span>MyLink</span>
      </a>
      <div className="flex items-center gap-3">
        {loading ? (
          <Spinner className="h-4 w-4 text-muted-foreground animate-spin" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <div className="flex items-center gap-2 cursor-pointer outline-hidden hover:opacity-80 transition-all select-none">
                  <Avatar size="sm" className="ring-2 ring-primary/10">
                    <AvatarImage src={profile?.profile_image_url || user.photoURL || undefined} alt="User avatar" />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-muted-foreground max-w-[100px] truncate">
                    {profile?.displayName || user.displayName || user.email?.split("@")[0]}
                  </span>
                </div>
              }
            />
            <DropdownMenuContent align="end" className="w-48 bg-card border border-border shadow-lg p-1">
              <DropdownMenuItem onClick={handlePreview} className="cursor-pointer text-xs font-medium py-2">
                <ExternalLink className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <span>내 페이지 미리보기</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer text-xs font-medium py-2">
                <Copy className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <span>내 페이지 링크 복사</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} variant="destructive" className="cursor-pointer text-xs font-medium py-2">
                <LogOut className="h-3.5 w-3.5 mr-2" />
                <span>로그아웃</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="outline"
            size="xs"
            onClick={handleLogin}
            className="text-[10px] px-2 py-1 h-auto rounded-md cursor-pointer font-bold border-primary/30 hover:border-primary/80 transition-all text-primary"
          >
            Google 로그인
          </Button>
        )}
      </div>
    </header>
  )
}
