# Integration Plan: API Gateway with Ory Oathkeeper

## Objective
Integrate the API Gateway with the Ory ecosystem (specifically Oathkeeper and Kratos) to enforce authentication and prepare for authorization.

## Steps

### Step 1: Update API Gateway Code
**File:** `packages/api-gateway/src/index.ts`
**Action:** Wrap existing routes in a `/api/v1` prefix to align with the K8s Gateway configuration and ensure correct path handling.

### Step 2: Update Kubernetes Gateway Configuration
**File:** `infra/k8s/overlays/development/gateway.yaml`
**Action:** Change the backend for the `/api/v1` route from `api-gateway` to `oathkeeper` (port 4455). This forces traffic through the proxy.

### Step 3: Configure Oathkeeper Access Rules
**File:** `infra/k8s/base/oathkeeper/configs/access-rules.json`
**Action:** Replace the existing rule with a comprehensive set of rules:
1.  **Public Access**: Allow anonymous requests to `/api/v1/signup` and `/api/v1/`.
2.  **Protected Access**: Require a valid Kratos session (`cookie_session`) for `/api/v1/accounts/*` and `/api/v1/currencies/*`.
3.  **CORS**: Allow `OPTIONS` requests to pass through (`noop` authenticator).
4.  **Upstream**: Point all rules to `http://api-gateway:3000`.

## Verification
1.  Verify `/api/v1/` is accessible without authentication.
2.  Verify `/api/v1/signup` is accessible without authentication.
3.  Verify `/api/v1/accounts` requires authentication (returns 401/403).
4.  Verify authenticated requests (with valid Kratos session cookie) can access protected routes.
