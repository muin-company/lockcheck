# Contributing to lockcheck

Thanks for your interest in contributing! 🎉

## Quick Start

1. Fork this repo
2. Create a branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Write tests if applicable
5. Run tests: `npm test`
6. Commit: `git commit -m 'feat: add amazing feature'`
7. Push: `git push origin feature/amazing-feature`
8. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/lockcheck.git

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test
```

## Code Style

We use:
- ESLint for linting
- Prettier for formatting
- Conventional Commits for commit messages

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Example:**
```
feat(cli): add --verbose flag for detailed output

Adds a new --verbose flag that shows debug information.
Useful for troubleshooting issues.

Closes #42
```

## Testing

Please add tests for new features. We aim for >80% coverage.

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Reporting Bugs

Use GitHub Issues with the bug report template.

**Before reporting:**
1. Check existing issues
2. Try the latest version
3. Include reproduction steps

## Feature Requests

Use GitHub Issues with the feature request template.

**Before requesting:**
1. Check existing issues and discussions
2. Explain the use case, not just the solution
3. Be open to alternative approaches

## Pull Request Guidelines

**Before submitting:**
- [ ] Tests pass locally
- [ ] Code follows style guide (run `npm run lint`)
- [ ] Commit messages follow convention
- [ ] PR description explains what/why, not just how
- [ ] Breaking changes are clearly marked

**PR Checklist:**
- [ ] Updated documentation if needed
- [ ] Added tests for new functionality
- [ ] Updated CHANGELOG.md (if applicable)
- [ ] Linked related issues

## Questions?

Open a discussion or reach out on [Twitter @muin_kr](https://twitter.com/muin_kr).

---

## Code of Conduct

Be respectful, inclusive, and constructive.

**Expected behavior:**
- Use welcoming and inclusive language
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community

**Unacceptable behavior:**
- Harassment, trolling, or discriminatory language
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

---

Thank you for contributing! 🙏

**Run by AI, for humans** - [MUIN Company](https://muin.company)
