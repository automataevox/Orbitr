# Contributing to Orbitr

First off, thank you for considering contributing to Orbitr! It's people like you that make Orbitr such a great platform.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Include your environment details** (OS, Docker version, Orbitr version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any similar features in other tools**

### Creating Extensions

We welcome extension contributions! To create an extension:

1. **Use the Extension SDK**:
   ```bash
   npx @orbitr/sdk create my-extension
   ```

2. **Follow the Extension Guidelines**:
   - Use a descriptive name and ID
   - Provide a clear description
   - Include screenshots
   - Write comprehensive documentation
   - Test thoroughly

3. **Submit to the Registry**:
   - Create a pull request to the [orbitr-registry](https://github.com/orbitr/registry) repository
   - Ensure your manifest is valid
   - Include all required assets

### Pull Requests

1. **Fork the repository** and create your branch from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes**:
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation

3. **Ensure tests pass**:
   ```bash
   pnpm test
   pnpm lint
   pnpm type-check
   ```

4. **Commit your changes**:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
   
   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

5. **Push to your fork**:
   ```bash
   git push origin feature/my-feature
   ```

6. **Open a Pull Request**:
   - Use a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure CI checks pass

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker 20.10+
- Docker Compose v2+

### Setup Instructions

```bash
# Clone the repository
git clone https://github.com/orbitr/orbitr.git
cd orbitr

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env

# Set up database
pnpm db:migrate

# Start development server
pnpm dev
```

### Project Structure

```
orbitr/
├── apps/
│   └── web/              # Next.js application
├── packages/
│   ├── core/             # Core engine
│   ├── database/         # Prisma schema
│   ├── sdk/              # Extension SDK
│   └── types/            # Shared types
├── extensions/           # Official extensions
└── docs/                 # Documentation
```

### Coding Guidelines

#### TypeScript

- Use TypeScript strict mode
- Define proper types (avoid `any`)
- Use Zod for runtime validation
- Export types from packages

#### React/Next.js

- Use functional components
- Use Server Components by default
- Use Server Actions for mutations
- Use API routes for long-running operations

#### Styling

- Use Tailwind CSS
- Use shadcn/ui components
- Follow the existing design system
- Support dark mode

#### Testing

- Write unit tests for core logic
- Write integration tests for API routes
- Use Vitest for testing
- Aim for >80% coverage

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Examples:
```
feat(extensions): add update mechanism
fix(docker): resolve container restart issue
docs(readme): update installation instructions
```

## Community

- **Discord**: [Join our community](https://discord.gg/orbitr)
- **GitHub Discussions**: [Ask questions](https://github.com/orbitr/orbitr/discussions)
- **Twitter**: [@orbitr_io](https://twitter.com/orbitr_io)

## Recognition

Contributors are recognized in:
- README acknowledgments
- Release notes
- Contributors page on the website

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Orbitr! 🚀**
