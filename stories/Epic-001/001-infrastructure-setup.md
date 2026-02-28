Story 1: Infrastructure Setup (Technical Story)
-----------------------------------------------

**Title:** Setup: Deploy Ory Identity Services in Kubernetes

> **As a** developer,**I want** the Ory stack (Kratos, Hydra, Oathkeeper, Keto) to be deployed and configured in our development environment,**so that** we can begin building authentication and authorization features against a live, running system.

### Acceptance Criteria

*   Helm charts or Kustomize manifests are created for each Ory service.
*   The services are successfully deployed to the local Kubernetes cluster (via Tilt).
*   Services are configured to communicate with each other (e.g., Kratos connected to Hydra).
*   Services are configured to use the PostgreSQL database for persistence.
*   Basic configuration (e.g., identity schemas, OAuth2 client) is defined as code.
