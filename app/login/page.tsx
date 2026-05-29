"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { auth } from "@/lib/firebase"
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider } from "firebase/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const { user, loading: authLoading } = useUser()
  const router = useRouter()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const isLoggingInRef = useRef(false)

  // 1. 이미 로그인된 사용자는 루트 대시보드로 자동 리다이렉트
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/")
    }
  }, [user, authLoading, router])

  // 2. Google 로그인 처리 핸들러 (useRef 중복 방지 + Redirect Fallback)
  const handleLogin = async () => {
    if (isLoggingInRef.current) return
    isLoggingInRef.current = true
    setIsLoggingIn(true)

    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      router.replace("/")
    } catch (error: any) {
      console.warn("Popup login failed, trying fallback...", error)
      
      // 팝업이 차단되었거나 취소된 경우, 또는 다른 팝업 오류 발생 시 signInWithRedirect로 우회
      if (
        error.code === "auth/popup-blocked" || 
        error.code === "auth/cancelled-popup-request" ||
        error.code === "auth/popup-closed-by-user"
      ) {
        try {
          await signInWithRedirect(auth, provider)
        } catch (redirectError) {
          console.error("Redirect login fallback failed: ", redirectError)
        }
      } else {
        console.error("Login unexpected error: ", error)
      }
    } finally {
      // 리다이렉트가 발생하는 경우 페이지가 아예 이동하므로 false 처리가 의미 없지만,
      // 팝업창이 단순 닫혔거나 실패했을 때 버튼을 다시 활성화하기 위해 필요
      isLoggingInRef.current = false
      setIsLoggingIn(false)
    }
  }

  // 로딩 상태이거나 로그인 완료 시 리다이렉트 중일 때는 로더 표시
  if (authLoading || (user && !authLoading)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Spinner className="h-8 w-8 text-primary mb-2" />
        <p className="text-xs text-muted-foreground animate-pulse">로그인 세션 확인 중...</p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 overflow-hidden">
      
      {/* 프리미엄 보라색 은은한 광원 (Rich Aesthetics) */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] aspect-square rounded-full bg-violet-200/20 dark:bg-violet-950/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] aspect-square rounded-full bg-indigo-200/20 dark:bg-indigo-950/10 blur-[150px] pointer-events-none" />

      {/* 뒤로 가기 (홈으로) */}
      <div className="absolute top-6 left-6 z-10">
        <a 
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>메인으로 돌아가기</span>
        </a>
      </div>

      <div className="w-full max-w-sm z-10 animate-fade-in">
        <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white/55 dark:bg-zinc-900/55 backdrop-blur-md shadow-xl shadow-violet-100/30 dark:shadow-none rounded-3xl p-4">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md">
                <span className="text-xl">🔗</span>
              </div>
            </div>
            <CardTitle className="text-xl font-extrabold tracking-tight">MyLink 시작하기</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Google 계정으로 간편하게 가입하고 나만의 프로필 링크를 만드세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              style={{ backgroundColor: "#5B5FC7" }}
              className="w-full text-white hover:opacity-90 active:scale-[0.98] transition-all py-6 text-sm font-semibold rounded-2xl cursor-pointer border-none shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>로그인 진행 중...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-1 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Google 계정으로 시작하기</span>
                </>
              )}
            </Button>
            
            <div className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 font-normal leading-relaxed mt-2 select-none">
              시작함으로써 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  )
}
