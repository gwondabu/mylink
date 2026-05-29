# [PRD] 링크트리 클론 서비스 "마이링크 (MyLink)" 기능 정의서

본 문서는 **마이링크(MyLink)** 서비스의 제품 요구사항 정의서(PRD)입니다.

---

## 1. 프로젝트 개요

### 1.1 프로젝트명
* **마이링크 (MyLink)**

### 1.2 목적
* 인스타그램, 틱톡, 트위터 등 주요 SNS 플랫폼의 '프로필 내 단 하나의 링크만 허용'하는 제약을 극복합니다.
* 사용자가 자신만의 개인 프로필 페이지를 구축하여 다중 링크와 정보를 편리하게 공유할 수 있는 마이크로 랜딩 페이지 서비스를 제공합니다.

### 1.3 대상 사용자
* **개발자 및 크리에이터**
  * 자신의 블로그, 포트폴리오, 소셜 미디어 채널 링크를 한 곳에 깔끔하게 모아 대외적으로 공유하고자 하는 사용자.

---

## 2. 기능 정의

### 2.1 필수 요구사항

#### [회원 관리 및 인증]
1. **구글 소셜 로그인 전용 인증 (Firebase Auth)**
   * **Firebase Authentication**을 이용한 **구글(Google) 로그인 단일 인증 방식** 적용.
   * 회원가입 및 로그인은 오직 구글 계정 연동을 통해서만 처리하며, 일반 이메일 가입 절차나 비밀번호 분실/변경 관리 프로세스는 설계에서 제외.
2. **고유 도메인 주소 설정**
   * 최초 로그인 성공 시 사용자는 중복되지 않는 고유의 영문 `username`을 지정함.
   * 최종 랜딩 페이지 주소 형식: `https://mylink.to/{username}`
   * `username`은 영문 소문자, 숫자, 하이픈(-)만 허용하며, 실시간 중복 검증 수행.

#### [어드민 대시보드 - 링크 관리]
3. **링크 관리 (CRUD)**
   * **링크 추가**: 제목(Title)과 URL을 입력하여 링크 생성. URL 유효성 검사 필수.
   * **파비콘 자동 적용**: 입력한 URL 주소의 파비콘(Favicon)을 자동으로 파싱/참조하여 링크 아이템의 아이콘 이미지로 설정.
   * **링크 수정**: 등록된 제목 및 URL 정보 수정 가능.
   * **링크 삭제**: 저장된 링크를 영구 삭제.
   * *※ 링크 순서 변경(드래그 앤 드롭 등) 및 노출 활성화/비활성화 토글 기능은 구현하지 않음. 등록된 순서(생성일 오름차순 또는 내림차순)로 고정하여 단순 노출.*

#### [어드민 대시보드 - 프로필 설정]
4. **프로필 커스텀 및 테마 설정**
   * **프로필 이미지**: 프로필 이미지 업로드(Firebase Storage 사용) 및 표시.
   * **디스플레이 네임 (displayName)**: 프로필 페이지 상단에 표기할 이름 설정.
   * **한 줄 소개**: 최대 80자의 간단한 소개 문구 설정 가능.
   * **shadcn/ui 기반 테마 설정**: shadcn/ui 디자인 시스템을 기반으로 구성된 UI 컴포넌트를 제공하며, 기본 라이트(Light)/다크(Dark) 등의 테마 중 선택 적용 가능.
   * *※ 실시간 모바일 미리보기(Live Preview) 기능은 구현 범주에서 제외.*

#### [사용자 랜딩 페이지]
5. **반응형 랜딩 페이지**
   * 외부 방문자가 접근하는 최종 프로필 화면 (`mylink.to/{username}`).
   * 모바일 및 데스크톱에 최적화된 반응형 웹 레이아웃.
   * 등록된 링크들이 순서대로 단순 리스트화되어 출력되며, 각 링크는 파비콘 아이콘과 제목 텍스트로 표현됨. 클릭 시 새 창(`_blank`)으로 연결.

---

## 3. 기술 스택 및 데이터베이스 모델

### 3.1 기술 스택
* **Frontend**: React + Vite (또는 Next.js)
* **Design & Styling**: Tailwind CSS + **shadcn/ui** (Radix UI 기반)
* **Backend & Database**: **Firebase**
  * **Auth**: Firebase Auth (Google Sign-In 전용)
  * **Database**: Cloud Firestore
  * **Storage**: Firebase Storage (프로필 사진 업로드)

### 3.2 데이터베이스 스키마 설계 (Cloud Firestore 서브 컬렉션 구조)

사용자 정보(`users`) 컬렉션을 최상위에 두고, 각 사용자의 링크 목록은 해당 사용자 문서 하위의 **서브 컬렉션(`links`)**으로 구조화합니다.

#### `users` 컬렉션 (루트 컬렉션)
* 문서 ID: Firebase Auth의 `uid`
```json
{
  "uid": "String (Document ID)",
  "email": "String (구글 프로필 정보)",
  "username": "String (Unique, 마이링크 고유 아이디)",
  "displayName": "String (화면에 표시할 닉네임/이름)",
  "profile_bio": "String (최대 80자 자기소개)",
  "profile_image_url": "String (Storage 업로드 경로)",
  "theme": "String (적용 테마명, 예: light, dark)",
  "created_at": "Timestamp"
}
```

#### `users/{uid}/links` 컬렉션 (서브 컬렉션)
* 문서 ID: Firestore 자동 생성 ID
```json
{
  "id": "String (Document ID)",
  "title": "String (링크 버튼 텍스트)",
  "url": "String (이동할 외부 주소)",
  "favicon_url": "String (파비콘 이미지 주소)",
  "created_at": "Timestamp"
}
```

---

## 4. 추후 추가 예정 기능 (Future Scope)

* **개별 링크 클릭 조회수 측정**
  * 추후 버전에서 각 링크별 클릭 횟수를 카운팅하고 누적 조회수 데이터를 어드민 대시보드에서 조회할 수 있는 통계 기능 추가 예정.

---

## 5. 관련 문서
* **[사용자 시나리오 (User Scenarios)](./scenarios.md)**
* **[와이어프레임 및 화면 설계서 (Wireframes)](./wireframes.md)**
