Story 5: Foundational Budget Permissions
----------------------------------------

**Title:** User is assigned ownership of newly created budgets

> **As a** budget owner,**I want** to have full control over the budgets I create,**so that** the system is ready for future sharing and collaboration features.

### Acceptance Criteria

*   When a user makes a POST request to /api/budgets, the budgets-service creates the new budget in the database.
*   After creation, the budgets-service makes an API call to Ory Keto to create a relation tuple establishing ownership (e.g., budget:#owner@user:).
*   The DELETE /api/budgets/{id} endpoint is protected by a Keto check.
*   A request to delete a budget will only succeed if the calling user has the owner relationship to that budget in Ory Keto.
