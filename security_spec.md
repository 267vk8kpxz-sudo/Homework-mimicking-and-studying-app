# Security Specification: EchoStudy (Authentic Voice Homework & Grounded Notes)

## 1. Data Invariants
1. A user document `/users/{userId}` can only be read and written by the authenticated user whose `request.auth.uid == userId`.
2. All subcollections (`styleProfiles`, `samples`, `notes`, `homeworks`) under `/users/{userId}` must have `incoming().userId == request.auth.uid` and path variable `{userId} == request.auth.uid`.
3. Immutable fields: `userId` and `createdAt` can never be altered on updates.
4. Timestamps (`createdAt`, `updatedAt`) must strictly match `request.time`.
5. String fields must enforce explicit maximum length limits to prevent Denial of Wallet and payload inflation attacks.
6. Only verified authenticated users (`request.auth.token.email_verified == true` or `isSignedIn()`) can access their private notes and homework data.

## 2. The Dirty Dozen Payloads (Targeting Vulnerabilities)
1. **Ghost Field Shadow Update**: Injecting `{ "isAdmin": true, "unauthorizedBonus": 9999 }` into user or note documents. (Blocked via `hasOnly` and strict entity validation).
2. **Cross-Tenant ID Spoofing**: User A attempting to write a note with `userId: "userB"` into `/users/userB/notes/note1`. (Blocked: path `{userId}` must equal `request.auth.uid` and `incoming().userId == request.auth.uid`).
3. **Huge String Denial-of-Wallet Attack**: Writing a 20MB string into note title or content. (Blocked: `size() <= 200000` / `size() <= 200`).
4. **Invalid Document ID Path Traversal**: Injecting characters like `../../admin` into document ID. (Blocked: `isValidId(id)` regex `^[a-zA-Z0-9_\-]+$`).
5. **Time Traveling Timestamps**: Client claiming `createdAt = 2010-01-01T00:00:00Z`. (Blocked: `incoming().createdAt == request.time`).
6. **Immutable Field Tampering**: Client attempting to alter `createdAt` or `userId` in an existing homework document. (Blocked: `incoming().createdAt == existing().createdAt && incoming().userId == existing().userId`).
7. **Blanket Query Scraping**: Attempting an unrestricted list query across all user homework. (Blocked: `resource.data.userId == request.auth.uid`).
8. **Unauthenticated Read/Write**: Anonymous or unauthenticated request reading another user's private school notes. (Blocked: `isSignedIn()`).
9. **Fake Style Injection**: Attempting to alter another user's writing style profile. (Blocked: `isOwner(userId)`).
10. **Type Mismatch Payload**: Sending an array or boolean where a string is expected for `questionText`. (Blocked: `incoming().questionText is string`).
11. **Excessive Array Injection**: Inserting 10,000 tags into a note document. (Blocked: `size() <= 20`).
12. **Null/Empty Required Field**: Creating a homework item without `questionText` or `personalizedAnswer`. (Blocked: `hasAll` and min size checks).
