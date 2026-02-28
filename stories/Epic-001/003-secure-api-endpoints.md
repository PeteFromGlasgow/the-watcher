Story 3: Secure API Endpoints
-----------------------------

**Title:** User data is protected from unauthorized access

> **As a** user,**I want** to be sure my financial data is secure,**so that** I can trust that only I can access my account information.

### Acceptance Criteria

*   Ory Oathkeeper is configured as a proxy in front of the Fastify gateway.
*   All API endpoints under /api/\* require a valid JWT.
*   An API request to a protected endpoint without a valid token is rejected with a 401 Unauthorized error.
*   A valid request is forwarded to the Fastify gateway.
*   Ory Oathkeeper successfully "mutates" the request, adding a trusted X-User-ID header before forwarding it.
