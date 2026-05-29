"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { LinkItem } from "@/data/links"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, BarChart2, TrendingUp, Award, Link2 } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"

export default function StatsPage() {
  const { user, profile, loading: authLoading } = useUser()
  const router = useRouter()
  
  const [links, setLinks] = useState<LinkItem[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // 1. 로그인 여부 확인 및 리다이렉트
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [user, authLoading, router])

  // 2. 링크 통계 데이터 로드
  useEffect(() => {
    async function fetchStats() {
      if (!user) return
      try {
        setLoadingData(true)
        const linksRef = collection(db, `users/${user.uid}/links`)
        const q = query(linksRef, orderBy("createdAt", "desc"))
        const snapshot = await getDocs(q)
        
        const fetchedLinks = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          let createdAtStr = new Date().toISOString()
          if (data.createdAt) {
            createdAtStr = typeof data.createdAt.toDate === "function"
              ? data.createdAt.toDate().toISOString()
              : new Date(data.createdAt).toISOString()
          }

          return {
            id: docSnap.id,
            title: data.title || "",
            url: data.url || "",
            created_at: createdAtStr,
            clickCount: data.clickCount || 0
          }
        })
        setLinks(fetchedLinks)
      } catch (err) {
        console.error("통계 데이터 가져오기 실패:", err)
      } finally {
        setLoadingData(false)
      }
    }

    if (user) {
      fetchStats()
    }
  }, [user])

  if (authLoading || (user && loadingData)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Spinner className="h-8 w-8 text-primary mb-2" />
        <p className="text-xs text-muted-foreground animate-pulse">통계 데이터 분석 중...</p>
      </div>
    )
  }

  // 비로그인 상태일 때는 리다이렉트되므로 화면을 노출하지 않음
  if (!user) return null

  // 계산 로직들
  const totalClicks = links.reduce((sum, link) => sum + (link.clickCount || 0), 0)
  const maxClicks = links.length > 0 ? Math.max(...links.map(l => l.clickCount || 0)) : 0
  const sortedLinks = [...links].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
  const topLink = sortedLinks.length > 0 && (sortedLinks[0].clickCount || 0) > 0 ? sortedLinks[0] : null

  // shadcn Chart 컴포넌트 데이터셋 구성
  const chartData = sortedLinks.slice(0, 5).map(link => ({
    name: link.title,
    clicks: link.clickCount || 0
  }))

  const chartConfig = {
    clicks: {
      label: "클릭 수",
      color: "#5B5FC7"
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-background px-4 pb-16 overflow-hidden">
      
      {/* 백그라운드 보라색 광원 (Rich Aesthetics) */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] aspect-square rounded-full bg-violet-200/20 dark:bg-violet-950/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] aspect-square rounded-full bg-indigo-200/20 dark:bg-indigo-950/10 blur-[150px] pointer-events-none" />

      {/* 상단 네비게이션 헤더 */}
      <header className="flex w-full max-w-md items-center justify-between py-4 border-b border-border/40 mb-8 shrink-0 z-10 animate-slide-down">
        {/* 헤더 타이틀 누르면 루트(/) 페이지로 이동 */}
        <a href="/" className="flex items-center gap-1.5 text-sm font-extrabold tracking-widest text-foreground hover:opacity-90 select-none">
          <span>🔗</span>
          <span>MyLink</span>
        </a>
        <a 
          href="/"
          className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>대시보드</span>
        </a>
      </header>

      {/* 중앙 메인 통계 콘텐츠 */}
      <div className="flex w-full max-w-md flex-col gap-6 z-10 animate-fade-in">
        
        {/* 타이틀 및 요약 카드 */}
        <div className="flex flex-col gap-1 items-start text-left">
          <h1 className="text-xl font-bold tracking-tight text-foreground">📊 내 링크 통계 분석</h1>
          <p className="text-xs text-muted-foreground">내 링크들에 대한 방문자 성과 분석 보고서입니다.</p>
        </div>

        {/* 총 클릭 수 메인 카드 (보라색 그림자 및 프리미엄 효과) */}
        <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-lg shadow-violet-100/40 dark:shadow-none hover:shadow-violet-200/40 transition-all duration-300">
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-50 dark:bg-violet-950/30 rounded-xl text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs text-zinc-550 dark:text-zinc-400">총 누적 클릭 수</span>
                {/* 보라색 (#5B5FC7) 계열의 강조 텍스트 */}
                <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: "#5B5FC7" }}>
                  총 {totalClicks} 클릭
                </h2>
              </div>
            </div>

            {/* 베스트 성과 링크 요약 */}
            {topLink && (
              <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/50 text-xs text-left">
                <Award className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-muted-foreground truncate">
                  최고 인기 링크: <strong className="text-foreground">{topLink.title}</strong> ({topLink.clickCount} 클릭)
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* shadcn Chart 시각화 카드 */}
        {chartData.length > 0 && (
          <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-md">
            <CardHeader className="text-left p-6 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <BarChart2 className="h-4 w-4 text-zinc-500" />
                인기 링크 Top 5 클릭 분석
              </CardTitle>
              <CardDescription className="text-[11px]">클릭량이 높은 상위 5개 링크입니다.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 10, top: 10, bottom: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                      style={{ fontSize: "11px", fill: "var(--muted-foreground)" }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="clicks" 
                      fill="#5B5FC7" 
                      radius={[0, 4, 4, 0]} 
                      barSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* 진행 바 리스트 섹션 (최대 클릭수 대비 비율 표시) */}
        <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-md">
          <CardHeader className="text-left p-6 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Link2 className="h-4 w-4 text-zinc-500" />
              전체 링크 성과 분석
            </CardTitle>
            <CardDescription className="text-[11px]">최대 클릭 수 대비 성과 비율 분석 목록입니다.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2 flex flex-col gap-4 text-left">
            {sortedLinks.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">분석할 링크 데이터가 없습니다.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {sortedLinks.map((link) => {
                  const clickVal = link.clickCount || 0
                  // 최대 클릭수 대비 비율 연산
                  const ratio = maxClicks > 0 ? Math.round((clickVal / maxClicks) * 100) : 0

                  return (
                    <div key={link.id} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[240px]">
                          {link.title}
                        </span>
                        <span className="font-mono text-zinc-500 dark:text-zinc-400 shrink-0">
                          {clickVal} clicks ({ratio}%)
                        </span>
                      </div>
                      
                      {/* 최대 클릭 대비 비율 보라색 진행 바 (Progress Bar) */}
                      <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${ratio}%`, 
                            backgroundColor: "#5B5FC7" 
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
