# stylepeek-ios — Today's Stylepeek iOS 앱 껍데기

배포 레포 `haircut-helper-app`을 그대로 앱 안에 넣어 iOS 앱으로 만드는 레포입니다(Capacitor 7).
앱 내용을 고칠 때는 이 레포가 아니라 **haircut-helper-app**을 고치고, 여기서는 빌드만 다시 돌립니다.

## 들어 있는 것
- `capacitor.config.json` — 앱 ID `com.ylcompany.stylepeek` · 이름 Today's Stylepeek
- `ios/` — Xcode 프로젝트(아이폰 전용 · iOS 15 이상 · 세로 고정 · 카메라/사진 권한 문구 · 아이콘)
- `scripts/prepare-www.mjs` — 배포 레포 → `www/`
  - three.js · TensorFlow.js · MediaPipe · 글꼴을 앱 안에 넣음(인터넷 없이 열림)
  - MediaPipe·셀피 세그 모델을 빌드 때 내려받아 앱 안에 넣음
  - goatcounter 제거
- `codemagic.yaml` — Mac 없이 클라우드에서 빌드 → TestFlight 업로드
- `resources/icon.svg`, `icon-1024.png` — 임시 앱 아이콘

## 처음 한 번 할 일
1. **Apple Developer Program 가입**(개인 · 연 99달러): https://developer.apple.com/programs/enroll/
   승인까지 보통 1~2일. 이게 끝나야 아래가 됩니다.
2. **App Store Connect에서 앱 만들기**: 나의 앱 → + → 새로운 앱
   - 플랫폼 iOS · 이름 `Today's Stylepeek - 3D 헤어 미리보기` · 기본 언어 한국어
   - 번들 ID `com.ylcompany.stylepeek` (목록에 없으면 developer.apple.com → Identifiers에서 먼저 등록) · SKU `stylepeek-ios-1`
3. **App Store Connect API 키 만들기**: 사용자 및 액세스 → 통합 → App Store Connect API → 키 생성(권한: App Manager)
   - Issuer ID · Key ID · `.p8` 파일을 받아 둠(.p8은 한 번만 내려받을 수 있음)
4. **Codemagic 가입**(GitHub로 로그인 · 개인 무료 빌드 시간 있음): https://codemagic.io
   - Teams → Integrations → Developer Portal → 3번 키 등록, 이름을 **stylepeek_asc** 로
   - Add application → 이 레포 선택 → codemagic.yaml 사용
5. **Start new build** → 20~30분 뒤 TestFlight에 빌드가 올라옴

## 앱 내용이 바뀌었을 때
haircut-helper-app에 올린 뒤 Codemagic에서 Start new build만 다시 누르면 됩니다.

## 알아 둘 것
- 카메라는 웹 방식(getUserMedia)을 그대로 씁니다(iOS 15 WKWebView 지원). 네이티브 카메라 플러그인은 다음 단계.
- 쇼핑몰(workers.dev)은 인터넷이 필요합니다. 심사 모드(`APP_REVIEW.on`)로 결제·구매 링크·위치 없음.
