# AI 웹앱 전시관 (AI Vibe Coding Showcase) - Firestore Security Spec

## 1. Data Invariants

1. **Class Isolation & Membership Gate**:
   - 수강생과 강사는 소속된 클래스(`/classes/{classId}`) 내의 프로젝트 및 리뷰에만 접근할 수 있습니다.
   - 클래스 참여 코드는 Firestore 공개 문서에 평문으로 저장되지 않으며, 서버 API(`/api/classes/join`)를 통해서만 검증됩니다.

2. **Single Project per Student (1인 1작품)**:
   - 각 학생은 클래스 당 1개의 프로젝트만 생성/소유할 수 있습니다.
   - 프로젝트 문서 ID는 `p_{authorUid}` 또는 `authorUid`로 제약되며, `authorUid == request.auth.uid`가 필수입니다.
   - 다른 학생의 프로젝트를 수정하거나 삭제할 수 없습니다.

3. **Peer Review Invariant & Anti Self-Review (상호 평가 및 자기 평가 차단)**:
   - 학생은 본인이 작성한 프로젝트(`authorUid == request.auth.uid`)에는 리뷰를 등록할 수 없습니다.
   - 한 리뷰어는 프로젝트 당 정확히 1개의 리뷰만 작성할 수 있으며(문서 ID: `r_{reviewerUid}` 또는 `reviewerUid`), 본인 리뷰만 수정/삭제할 수 있습니다.
   - 별점 `rating`은 1 이상 5 이하의 정수(Integer)여야 합니다.
   - 댓글 길이는 최대 300자 이내여야 합니다.

4. **URL & Input Sanitization**:
   - `appUrl`은 반드시 `http://` 또는 `https://`로 시작해야 하며, 악성 자바스크립트 슈도 프로토콜(`javascript:`, `data:`)은 차단됩니다.
   - 제목, 설명, 닉네임 길이는 각각 엄격한 상한선(각각 60자, 200자, 30자)을 둡니다.

5. **Instructor Privilege & Hardened RBAC**:
   - 관리자(강사) 권한은 클라이언트가 임의로 설정할 수 없으며, Firestore `/admins/{uid}` 컬렉션 존재 여부 및 서버 측 ID 토큰 검증으로 보호됩니다.
   - 부트스트랩 강사 계정은 `anysicha123@gmail.com`입니다.
   - 관리자는 부적절한 프로젝트/리뷰를 삭제하거나 수업을 잠금(종료) 처리할 수 있습니다.

---

## 2. The Dirty Dozen Payloads (12 Adversarial Payloads)

1. **Payload 1: Impersonated Project Author (신원 위조 프로젝트 등록)**
   - Attack: 익명 학생 A (`uid: studentA`)가 `authorUid: "studentB"`로 프로젝트 생성 시도.
   - Expected Result: `PERMISSION_DENIED` (`incoming().authorUid == request.auth.uid` 위반).

2. **Payload 2: Self-Review Exploit (자신의 프로젝트에 별점 5점 셀프 리뷰 작성)**
   - Attack: 프로젝트 작성자 A가 자신의 프로젝트 하위 `/reviews/{uidA}`에 별점 5점 등록 시도.
   - Expected Result: `PERMISSION_DENIED` (작성자는 자신의 프로젝트를 리뷰할 수 없음).

3. **Payload 3: Out-of-Bounds Star Rating (별점 범위 조작: 99점 또는 0점 또는 음수)**
   - Attack: `rating: 10` 또는 `rating: 0` 또는 `rating: 4.5` (비정수).
   - Expected Result: `PERMISSION_DENIED` (`rating is int && rating >= 1 && rating <= 5` 위반).

4. **Payload 4: Malicious Protocol Injection (javascript: XSS URL)**
   - Attack: `appUrl: "javascript:alert(document.cookie)"`
   - Expected Result: `PERMISSION_DENIED` (`matches('^https?://.*')` 위반).

5. **Payload 5: Giant Payload / Denial of Wallet (대용량 문자열 주입)**
   - Attack: `title` 필드에 50,000자 크기의 텍스트 전송.
   - Expected Result: `PERMISSION_DENIED` (`title.size() <= 60` 위반).

6. **Payload 6: Shadow Admin Elevation (일반 학생이 자신의 권한을 admin으로 승격)**
   - Attack: `/admins/{studentA}` 문서 직접 생성 시도.
   - Expected Result: `PERMISSION_DENIED` (관리자 문서 생성은 기존 관리자 또는 서버만 허용).

7. **Payload 7: Unauthorized Cross-Class Modification (다른 클래스 프로젝트 삭제)**
   - Attack: 학생 A가 소속되지 않은 다른 클래스의 프로젝트 문서 삭제 시도.
   - Expected Result: `PERMISSION_DENIED`.

8. **Payload 8: Terminal State Override (종료된 수업에 프로젝트 신규 제출)**
   - Attack: `status == 'closed'`인 클래스에 새 프로젝트 생성 시도.
   - Expected Result: `PERMISSION_DENIED`.

9. **Payload 9: Ghost Field Injection (스키마에 없는 권한 조작 필드 삽입)**
   - Attack: 프로젝트 문서에 `isVerified: true`, `role: "superuser"` 등의 유령 필드 포함 전송.
   - Expected Result: `PERMISSION_DENIED` (`hasOnly(...)` 위반).

10. **Payload 10: Reviewer Impersonation (타인의 UID로 허위 리뷰 등록)**
    - Attack: 학생 A가 `reviewerUid: "studentC"`로 리뷰 등록 시도.
    - Expected Result: `PERMISSION_DENIED` (`incoming().reviewerUid == request.auth.uid` 위반).

11. **Payload 11: Cross-User Project Tampering (타인의 프로젝트 내용 변조)**
    - Attack: 학생 B가 학생 A의 프로젝트 제목과 URL을 변조 시도.
    - Expected Result: `PERMISSION_DENIED` (`existing().authorUid == request.auth.uid` 위반).

12. **Payload 12: Secret Join Code Scraping (클라이언트에서 클래스 비밀 참여 코드 직접 조회)**
    - Attack: `/classes/{classId}/class_secrets/{secretId}` 문서 직접 읽기 시도.
    - Expected Result: `PERMISSION_DENIED` (학생에게 읽기 금지, 서버/강사 전용).

---

## 3. Test Runner Design

보안 규칙 단위 테스트 스위트는 다음 항목을 검증합니다:
- 비인증 사용자(Unauthenticated)는 모든 읽기/쓰기 차단
- 익명 사용자(Anonymous Auth)는 소속된 클래스 프로젝트/리뷰 읽기 가능
- 본인 프로젝트에 대한 CUD(생성/수정/삭제) 허용, 타인 프로젝트 수정/삭제 차단
- 타인 프로젝트에 대한 리뷰 1회 작성/수정/삭제 허용, 본인 프로젝트 리뷰 차단
- 별점 1~5 정수 검증 및 URL 프로토콜 정규식 검증
- 관리자(anysicha123@gmail.com 및 `/admins/{uid}`)는 관리자 권한 작업 허용
