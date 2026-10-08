# Security Specification - Cuenta Clara

## 1. Data Invariants
- All data is scoped strictly to `/users/{userId}` subcollections.
- A user can only access, create, update, or delete documents where `{userId} == request.auth.uid`.
- Unauthenticated requests are rejected immediately across all endpoints.
- Any attempt by user A to read, list, write, or delete documents inside user B's collection is rejected with `PERMISSION_DENIED`.
- Data payloads must match expected schema shapes, string length constraints, and allowed fields.
- Document IDs must conform to the regex `^[a-zA-Z0-9_\-]+$` and length `<= 128`.
- In all subcollections (`accounts`, `billInstances`, `payments`, `categories`, `goals`, `notifications`), `incoming().userId == request.auth.uid`.

## 2. The Dirty Dozen Payloads (Designed to test boundaries)
1. **Unauthenticated Read to `/users/user123`**: Must return PERMISSION_DENIED.
2. **Cross-User Account Creation**: `request.auth.uid = 'alice'`, writing to `/users/bob/accounts/acc1` -> Must return PERMISSION_DENIED.
3. **Spoofed User ID in Payload**: `request.auth.uid = 'alice'`, writing to `/users/alice/accounts/acc1` with `userId: 'bob'` -> Must return PERMISSION_DENIED.
4. **Giant ID Injection (Resource Exhaustion)**: Writing to `/users/alice/accounts/` with a 2048-char ID -> Must return PERMISSION_DENIED.
5. **Junk Characters ID**: Writing to `/users/alice/accounts/acc!@#$%^&*` -> Must return PERMISSION_DENIED.
6. **Negative Amount in Account**: Creating an account with `amount: -500` -> Must return PERMISSION_DENIED.
7. **Invalid Currency Code**: Creating an account with `currency: "BITCOIN"` -> Must return PERMISSION_DENIED.
8. **Shadow Field Injection**: Writing to `/users/alice/accounts/acc1` with extra secret field `{ isAdmin: true }` -> Must return PERMISSION_DENIED.
9. **Cross-User Query Listing**: `request.auth.uid = 'alice'`, attempting `list /users/bob/accounts` -> Must return PERMISSION_DENIED.
10. **Tampering with Immutable `userId` on update**: Attempting to alter `userId` on an existing bill or payment -> Must return PERMISSION_DENIED.
11. **Malicious 50KB Payload in String Field**: Exceeding max string length in `name` or `notes` -> Must return PERMISSION_DENIED.
12. **Foreign Payment Deletion**: `alice` attempting to delete a payment at `/users/bob/payments/pay1` -> Must return PERMISSION_DENIED.
