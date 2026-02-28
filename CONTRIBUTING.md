# Contributing

First off, thank you for considering contributing! We welcome any help you can offer to improve this project.

## Getting Started

1.  **Fork the repository**: Click the "Fork" button on the top right of the repository page.
2.  **Clone your fork**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
    cd YOUR_REPOSITORY_NAME
    ```
3.  **Install dependencies**: This project uses `pnpm` for package management.
    ```bash
    pnpm install
    ```
4.  **Build the project**: Ensure everything builds correctly.
    ```bash
    pnpm build
    ```

## Development Workflow

1.  **Create a branch**: Create a descriptive branch name for your feature or bug fix.
    ```bash
    git checkout -b feat/your-feature-name  # or fix/your-bug-fix-name
    ```
2.  **Make your changes**: Implement your feature or fix the bug. Remember to add or update tests as necessary.
3.  **Run checks**: Before committing, ensure all checks pass:
    *   **Linting**: Check code style.
        ```bash
        pnpm lint
        ```
    *   **Testing**: Run the test suite.
        ```bash
        pnpm test
        ```
    *   **Security**: Be mindful of security best practices when writing code. While we don't have automated security scanning integrated into the local workflow yet, please consider potential vulnerabilities.
    *   **Build**: Ensure the project still builds successfully.
        ```bash
        pnpm build
        ```

## Submitting Changes

1.  **Add a Changeset**: This project uses [Changesets](https://github.com/changesets/changesets) to manage releases. Add a changeset to document your changes. This will prompt you to select the packages affected and describe the changes.
    ```bash
    pnpm changeset
    ```
    Follow the prompts, commit the generated markdown file in the `.changeset` directory.
2.  **Commit your changes**: Use clear and descriptive commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) specification. This helps automate the release process and makes the commit history easier to understand.
    *   Example commit message types: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`.
    ```bash
    git add .
    git commit -m "feat: add new feature X" # Or other appropriate type and message
    ```
3.  **Push your branch**:
    ```bash
    git push origin feat/your-feature-name
    ```
4.  **Open a Pull Request**: Go to the original repository on GitHub and open a Pull Request from your forked branch. Provide a clear description of your changes.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](./CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## Reporting Issues

If you encounter a bug or have a suggestion for a new feature, please check the existing issues first. If your issue isn't listed, feel free to open a new one. Provide as much detail as possible, including steps to reproduce the bug or a clear description of the suggested feature.

Thank you for contributing!
