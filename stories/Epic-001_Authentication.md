Epic: Foundation: User Identity & Access Control
================================================

**Goal:** To establish a secure and robust system for user authentication and authorization. This will allow users to securely sign up, log in, and manage their accounts. All API endpoints will be protected, ensuring that a user's financial data is accessible only by them. This Epic lays the groundwork for all future features, including collaborative budgeting.

**Key Components:**

*   User identity management (Ory Kratos)
*   API token issuance (Ory Hydra)
*   API security proxy (Ory Oathkeeper)
*   Fine-grained permissions engine (Ory Keto)
*   Integration with the Nuxt frontend and Fastify backend.

**Epic Acceptance Criteria:**

*   A new user can create an account and log in.
*   An existing user can log in and log out.
*   All core data APIs are protected and cannot be accessed without a valid session.
*   Users can secure their account with Multi-Factor Authentication (MFA).
*   The system is capable of assigning "ownership" of a resource (like a budget) to the user who created it.
