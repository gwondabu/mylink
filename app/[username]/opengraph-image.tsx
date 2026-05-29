import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "MyLink Profile OpenGraph Image"
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

interface ImageProps {
  params: Promise<{ username: string }>
}

export default async function Image({ params }: ImageProps) {
  const resolvedParams = await params
  const username = resolvedParams.username
  const title = `${username}의 마이링크`

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#5B5FC7",
          color: "white",
          fontFamily: "sans-serif",
          padding: "60px 80px",
          position: "relative",
        }}
      >
        {/* 장식용 은은한 그라데이션 원형 배경 */}
        <div
          style={{
            position: "absolute",
            top: "-150px",
            left: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "250px",
            background: "rgba(255, 255, 255, 0.08)",
            filter: "blur(50px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            right: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "250px",
            background: "rgba(0, 0, 0, 0.12)",
            filter: "blur(50px)",
          }}
        />

        {/* 상단 브랜딩 영역 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "50px",
          }}
        >
          <div
            style={{
              fontSize: "64px",
            }}
          >
            🔗
          </div>
          <div
            style={{
              fontSize: "44px",
              fontWeight: "900",
              letterSpacing: "4px",
            }}
          >
            MyLink
          </div>
        </div>

        {/* 메인 타이틀 영역 */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: "20px",
            lineHeight: "1.2",
            maxWidth: "900px",
            wordBreak: "break-all",
          }}
        >
          {title}
        </div>

        {/* 안내 서브텍스트 영역 */}
        <div
          style={{
            fontSize: "28px",
            opacity: "0.8",
            textAlign: "center",
            marginTop: "10px",
          }}
        >
          개발자 포트폴리오, 소셜 링크를 하나의 페이지로 공유하세요.
        </div>

        {/* 하단 URL */}
        <div
          style={{
            fontSize: "24px",
            opacity: "0.6",
            fontFamily: "monospace",
            marginTop: "50px",
            background: "rgba(0, 0, 0, 0.15)",
            padding: "8px 24px",
            borderRadius: "20px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          mylink-bice.vercel.app/{username}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
