# [PRD] 링크트리 클론 서비스 "마이링크 (MyLink)" 기능 정의서

본 문서는 개발자와 크리에이터를 위한 멀티 링크 마이크로 랜딩 페이지 서비스 **마이링크(MyLink)**의 제품 요구사항 정의서(PRD)입니다. 향후 작성될 **사용자 시나리오(User Scenarios)**와 **와이어프레임(Wireframes)**의 기준점이 되는 설계도 역할을 합니다.

---

## 1. 프로젝트 개요

### 1.1 프로젝트명
* **마이링크 (MyLink)**

### 1.2 목적
* 개발자와 크리에이터가 자신의 깃허브 저장소, 블로그, 포트폴리오, 소셜 미디어, 프로젝트 링크 등을 하나의 미려한 페이지로 통합하여 효과적으로 공유할 수 있는 환경을 제공합니다.
* 불필요한 가입 절차를 줄이고, 개발자 친화적이면서 세련된 UI 컴포넌트를 직접 커스텀하여 3분 내에 배포 가능한 플랫폼을 지향합니다.

### 1.3 대상 사용자
* **개발자 (Developers)**
  * 자신의 기술 블로그, 깃허브 프로필, 대표 사이드 프로젝트, 이력서(PDF/노션) 등을 깔끔하게 보여주고자 하는 사용자.
  * 개발자 감성의 테마(예: 터미널 스타일, 다크 테마)나 코드 블록 형태의 소개글을 활용하려는 사용자.
* **크리에이터 (Creators)**
  * 유튜브, 트위치, 인스타그램, 깃허브 등 여러 플랫폼의 채널을 연동하고 최신 결과물을 신속하게 공유하려는 사용자.

---

## 2. 핵심 기능 정의 (필수 vs 선택)

### 2.1 필수 요구사항 (Must-Have)

#### [회원 관리 및 계정 설정]
1. **구글 소셜 로그인 전용 인증 (Firebase Auth)**
   * **Firebase Authentication**을 이용한 **구글(Google) 로그인 단일 인증 방식** 적용.
   * 복잡한 이메일 가입, 패스워드 검증, 이메일 확인 및 비밀번호 재설정 기능 배제하여 진입 장벽 최소화.
2. **고유 도메인 주소 선점**
   * 로그인 성공 후 최초 1회, 중복되지 않는 고유의 영문 `username` 설정.
   * 최종 랜딩 페이지 주소: `https://mylink.to/{username}`
   * `username`은 영문 소문자, 숫자, 하이픈(-)만 허용하며 정규식 기반 검증 및 실시간 중복 체크 적용.

#### [어드민 대시보드 - 링크 관리]
3. **링크 및 콘텐츠 카드 관리 (CRUD)**
   * **링크 추가**: 제목(Title)과 URL을 입력하여 링크 카드 생성. URL 유효성 검사 필수.
   * **콘텐츠 타입 확장 (개발자/크리에이터 특화)**: 단순 링크 외에도 텍스트/마크다운 블록 형태의 간단한 소개글 카드나 기술 스택 태그 카드를 추가할 수 있는 유연한 구조 설계.
   * **노출 토글**: 삭제하지 않고 노출 여부만 스위치(토글)로 결정 가능.
   * **수정 및 삭제**: 카드 내용을 즉시 수정하거나 경고 팝업 확인 후 삭제.
4. **드래그 앤 드롭 정렬**
   * 대시보드 내 등록된 모든 링크 카드의 노출 순서를 드래그 앤 드롭 방식으로 변경.
   * 변경된 즉시 DB의 순서 인덱스가 자동으로 실시간 동기화.

#### [어드민 대시보드 - 디자인 설정]
5. **프로필 커스텀**
   * 아바타 이미지 업로드(Firebase Storage 사용) 및 프로필 제목, 한 줄 바이오 설정.
6. **shadcn/ui 기반 디자인 및 테마 시스템**
   * **shadcn/ui**의 디자인 원칙(CSS 변수 기반 테마 컬러 변경, 깔끔하고 정돈된 컴포넌트)을 사용한 UI 구축.
   * 기본 개발자/크리에이터향 테마 제공:
     * **Developer Terminal**: 모노스페이스 폰트와 콘솔 터미널 느낌의 다크 테마.
     * **Modern Minimalist**: shadcn/ui 기본 슬레이트(Slate) 톤의 극도로 깔끔한 테마.
     * **Neon Tech**: 다크 테마 기반에 형광 네온 컬러 포인트가 들어간 테마.
7. **실시간 모바일 미리보기 (Live Preview)**
   * 대시보드 화면 내 모바일 목업 컴포넌트를 구현하여, 관리자의 편집 내용이 랜딩 페이지에 어떻게 반영되는지 실시간 확인 가능.

#### [사용자 랜딩 페이지]
8. **반응형 모바일 퍼스트 뷰**
   * 외부 방문자가 접속하는 `mylink.to/{username}` 화면.
   * shadcn/ui 컴포넌트 스타일을 유지하되, 모바일 화면 규격에 최적화하여 쾌적한 가독성 제공.
   * 활성화된 카드들이 일렬로 정렬되며 클릭 시 새 탭(`_blank`)으로 링크 이동.

---

### 2.2 선택 및 향후 구현 요구사항 (Nice-to-Have / Post-MVP)

1. **소셜 아이콘 퀵 링크**
   * Instagram, YouTube, GitHub, Twitter 등 주요 아이콘을 프로필 이미지 하단에 정렬하여 연결하는 기능.
2. **개발자/크리에이터 특화 카드 컴포넌트**
   * **GitHub Repo 카드**: 특정 오픈소스 저장소의 스타(Star) 수와 언어 등의 메타데이터를 카드에 렌더링하는 기능.
   * **Tech Stack 배지**: 자신이 다룰 수 있는 기술 스택(React, Node, Go 등)을 뱃지 형태로 한눈에 보여주는 컴포넌트.
3. **방문자 및 클릭 통계 분석 (2단계 구현 예정)**
   * 일별 누적 조회수(PV) 및 개별 링크 클릭수 로그 누적.
   * 대시보드 내 간단한 클릭 통계 그래프 대시보드 연동 (MVP 이후 2단계 스펙으로 유예).
4. **SEO 및 SNS 공유 설정 (Open Graph)**
   * 카카오톡이나 슬랙에 링크 공유 시 대표 이미지 및 사이트 설명글 커스터마이징 기능.

---

## 3. 기술 스택 및 데이터베이스 모델

### 3.1 기술 스택
* **Frontend**: React + Vite (혹은 Next.js)
* **Design & Styling**: Tailwind CSS + **shadcn/ui** (Radix UI 기반 프리미엄 디자인 시스템)
* **Backend & Auth**: **Firebase (Authentication, Firestore, Storage, Hosting)**
  * **Auth**: Firebase Auth (Google Sign-In 단일 인증)
  * **Database**: Cloud Firestore (NoSQL 실시간 문서 데이터베이스)
  * **Storage**: Firebase Storage (프로필 및 커버 이미지 업로드)

### 3.2 데이터베이스 스키마 설계 (Cloud Firestore 구조)

#### `users` 컬렉션
각 문서의 ID는 Firebase Auth의 `uid`와 일치시킵니다.
```json
{
  "uid": "String (Document ID)",
  "email": "String (구글 프로필 정보)",
  "username": "String (Unique, 마이링크 고유 아이디)",
  "profile_title": "String (화면 노출 이름)",
  "profile_bio": "String (최대 80자 자기소개)",
  "profile_image_url": "String (Storage 주소)",
  "theme": "String (예: terminal, modern, neon)",
  "created_at": "Timestamp"
}
```

#### `links` 컬렉션
각 문서의 ID는 UUID 또는 자동 생성 ID이며, `uid`로 소유자를 식별합니다.
```json
{
  "id": "String (Document ID)",
  "uid": "String (FK -> users.uid)",
  "type": "String (link / text / stack / github)",
  "title": "String (노출 텍스트)",
  "url": "String (연결 URL)",
  "order_index": "Integer (정렬 인덱스)",
  "is_active": "Boolean (활성화 여부)",
  "metadata": "Map (기타 기술 스택 정보 또는 레포 정보 보관용)",
  "created_at": "Timestamp"
}
```

#### `analytics` 컬렉션 (향후 2단계 구현 시 사용 예정)
```json
{
  "id": "String (Document ID)",
  "uid": "String (프로필 주인 uid)",
  "link_id": "String (Null일 시 프로필 방문)",
  "device": "String (mobile / desktop)",
  "referrer": "String (유입 도메인)",
  "clicked_at": "Timestamp"
}
```

---

## 5. 오픈 질문 및 고려 사항 (Open Questions)

> [!IMPORTANT]
> 프로젝트의 세부 방향성 확정을 위해 확인이 필요한 사항들입니다.

1. **프레임워크 선택**: shadcn/ui는 Next.js와 사용 시 세팅이 가장 매끄럽고 SSR(서버 사이드 렌더링)을 통해 랜딩 페이지의 SEO 및 속도가 비약적으로 향상됩니다. **Next.js (App Router)** 기반으로 구축하는 방향이 좋은데, 이에 대해 어떻게 생각하시나요? (Vite + React로도 진행은 가능합니다.)
2. **배포 환경**: 파이어베이스 생태계를 사용하므로 **Firebase Hosting**을 사용할 계획이신지, 아니면 **Vercel** 같은 플랫폼을 고려 중이신가요?
3. **개발자 전용 카드**: 깃허브 저장소(GitHub Repo) 정보나 기술 스택 뱃지를 표기하는 개발자 맞춤형 컴포넌트의 수록 범위에 대해 원하시는 특별한 요구사항이 있으신가요?
