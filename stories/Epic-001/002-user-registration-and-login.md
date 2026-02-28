Story 2: User Registration & Login
----------------------------------

**Title:** User can create an account and log in

> **As a** new user,**I want** to sign up for an account with my email and password and then log in,**so that** I can gain access to the application and start my financial planning.

### Acceptance Criteria

*   A "Sign Up" page exists in the Nuxt app that captures email and password.
*   The form submits to the Ory Kratos self-service UI flow.
*   Password strength requirements are enforced.
*   Upon successful registration, the user is automatically logged in.
*   A "Log In" page exists for returning users.
*   On successful login, a secure session (via a JWT from the Hydra flow) is established in the client.
*   On failure, a clear error message is displayed to the user.
