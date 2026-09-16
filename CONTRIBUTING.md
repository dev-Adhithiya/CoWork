# Contributing to Co-Work

Thank you for your interest in contributing to Co-Work! This document outlines guidelines and instructions for contributing to our full-stack TypeScript workspace application.

---

## 🤝 How to Contribute

### Reporting Bugs
If you encounter a bug or issue, please open an issue with:
- A clear description of the bug.
- Steps to reproduce the issue.
- Expected vs. actual behavior.
- Runtime details (Node.js version, browser, operating system).
- Relevant console logs or diagnostic snapshots (from `window.__firebaseDiagnostics` if auth-related).

### Suggesting Features
Feature proposals are welcomed! Please:
- Check existing issues to avoid duplication.
- Clearly describe the functional goal and user workflow.
- Ensure the proposal aligns with Co-Work's focused Chief of Staff paradigm.

### Pull Request Workflow
1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/dev-Adhithiya/Co-Work.git
   cd Co-Work
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Develop and test**:
   ```bash
   npm run dev
   ```

5. **Lint and compile**:
   ```bash
   npm run lint
   npm run build
   ```

6. **Commit and submit**:
   ```bash
   git add .
   git commit -m "feat: description of changes"
   git push origin feature/your-feature-name
   ```

---

## 📝 Code Style & Architecture Guidelines

### TypeScript & React
- **Strict Typing**: Declare interfaces in `/src/types.ts` or appropriate module headers. Do not use `any` unless strictly necessary for external library interop.
- **Functional Components**: Use standard React 18 functional components and hooks.
- **Icons**: Always import icons as named imports from `lucide-react` (do not craft custom SVGs).
- **Animations**: Use `motion` imported from `motion/react`.
- **Styling**: Use Tailwind CSS utility classes. Avoid inline style objects or ad-hoc CSS files.
- **Dependencies in Effects**: Avoid infinite re-renders. Use primitive values in `useEffect` dependency arrays or memoize complex objects.

### Backend (Express in `server.ts`)
- Keep API routes mounted under `/api/*` or core resource endpoints (`/tasks`, `/notes`, `/calendar`, `/chat`, `/health`).
- All API routes must run before the Vite dev middleware or static production fallback.
- Never expose API keys (such as `GEMINI_API_KEY`) to the client. Keep all third-party and AI logic server-side.
- Ensure the server binds to `0.0.0.0` and port `3000`.

---

## 🧪 Verification & Quality Checks

Before submitting a Pull Request, run all verification commands:

```bash
# Type-checking and lint validation
npm run lint

# Production build verification
npm run build
```

Both commands must pass with zero errors.

---

## 🔒 Security Best Practices

- **Never commit API keys or secrets** to version control.
- Ensure `.env` is listed in `.gitignore`. Use `.env.example` to document newly added environment variables.
- Maintain least-privilege principles when interacting with Google Workspace APIs.

---

## 📋 Commit Message Convention

We follow conventional commit standards:

- `feat:` A new user-facing feature or enhancement
- `fix:` A bug fix
- `docs:` Documentation updates
- `style:` Code style, formatting, or visual adjustments
- `refactor:` Code restructuring without functional alterations
- `perf:` Performance improvements
- `test:` Adding or updating tests

---

## 📜 License

By contributing to Co-Work, you agree that your contributions will be licensed under the MIT License.

