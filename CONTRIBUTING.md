# Contributing

Hi there! This document outlines guidelines for contributing to AlgoPlatform. We're excited that you're interested in helping make algorithm visualization more accessible to students, educators, and learners worldwide.

## What to Contribute

There are many ways you can contribute to AlgoPlatform:

### Algorithm Implementations
- Additional pathfinding algorithms (A*, Floyd-Warshall, etc.)
- Minimum spanning tree algorithms (Prim's, Kruskal's)
- Sorting algorithm visualizations
- Graph traversal algorithms (DFS, BFS)
- Dynamic programming visualizations

### Features & Improvements
- New algorithm categories and tools
- Enhanced visualization options and animations
- Performance optimizations
- Accessibility improvements (keyboard navigation, screen readers, etc.)
- Internationalization (i18n) support
- Export/import graph functionality
- Algorithm comparison mode
- Mobile experience improvements
- Educational content and tutorials

### Bug Fixes & Polish
- Bug fixes (check the Issues tab for known issues)
- UI/UX improvements
- Code quality improvements
- Documentation updates
- Test coverage improvements

For more details on what needs to be done, check out the [Issues tab](https://github.com/yourusername/algo-platform/issues) on GitHub.

## Project Structure

AlgoPlatform is built using **Next.js 15** with the App Router. Here's the key structure:

```
app/
├── layout.js                    # Root layout with theme provider
├── page.js                      # Dashboard/home page
├── shortest-path/
│   └── page.js                  # Pathfinding visualizer route
└── globals.css                  # Global styles and theme variables

components/
├── ShortestPathVisualizer/      # Pathfinding tool components
│   ├── ShortestPathVisualizer.js  # Main component
│   ├── GraphRenderer.js           # Graph visualization
│   ├── AlgorithmVisualizer.js     # Algorithm state visualization
│   ├── algorithm-viz/             # Algorithm state components
│   │   ├── DistanceTable.js
│   │   ├── MinHeapVisualization.js
│   │   ├── PseudocodeHighlighter.js
│   │   └── ...
│   ├── GraphGeneration.js         # Graph generation logic
│   ├── hooks/
│   │   └── useAlgorithmRunner.js  # Algorithm execution hook
│   └── ...
├── ui/                          # Shared UI components (shadcn/ui)
│   ├── floating-nav.jsx
│   ├── theme-toggle.jsx
│   └── ...
└── theme-provider.jsx           # Theme management

constants/
└── graphConfig.js              # Configuration constants

lib/
└── utils.js                    # Utility functions
```

### Key Technologies
- **Next.js 15**: React framework with App Router
- **React 19**: Component-based UI
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Animations and transitions
- **shadcn/ui**: UI component library

## Development Environment Setup

### Prerequisites
- **Node.js**: Version 18.0 or higher (LTS recommended)
- **npm**: Version 9.0 or higher
- A code editor (we recommend [VSCode](https://code.visualstudio.com/))

### Recommended VSCode Extensions
- **ESLint**: For code linting
- **Prettier**: For code formatting (if configured)
- **Tailwind CSS IntelliSense**: For Tailwind class autocomplete

### Getting Started

1. **Fork the repository**
   - Click the "Fork" button on the GitHub repository page

2. **Clone your fork**
   ```bash
   git clone https://github.com/XavierAgostino/algo-platform.git
   cd algo-platform
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`
   - The site should be running locally with hot-reload enabled

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production version
- `npm run start` - Start the production server (after build)
- `npm run lint` - Run ESLint to check for code issues

## Code Style & Guidelines

### JavaScript/React Conventions
- Use functional components with hooks
- Follow React best practices (proper key usage, memoization where appropriate)
- Use descriptive variable and function names
- Add comments for complex algorithm logic
- Keep components focused and modular

### File Naming
- React components: PascalCase (e.g., `GraphRenderer.js`)
- Utility files: camelCase (e.g., `graphHelpers.js`)
- Constants: camelCase (e.g., `graphConfig.js`)

### Code Quality
- Before submitting a PR, ensure your code passes linting:
  ```bash
  npm run lint
  ```
- Fix any linting errors before pushing
- Test your changes thoroughly in the browser
- Ensure your changes work in both light and dark themes
- Test on mobile devices or use browser dev tools to simulate mobile view

### Component Structure
- Keep components small and focused on a single responsibility
- Extract reusable logic into custom hooks (see `hooks/useAlgorithmRunner.js` for an example)
- Use the existing UI components from `components/ui/` when possible
- Follow the existing patterns for algorithm visualization components

## Submitting a Pull Request

### Before Creating a PR

1. **Ensure your code is clean**
   - Run `npm run lint` and fix any errors
   - Make sure your code follows the project's style
   - Test your changes thoroughly

2. **Keep changes focused**
   - Only commit changes relevant to your PR
   - Do NOT push changes to:
     - `package-lock.json` (unless you've added/removed dependencies)
     - `node_modules/`
     - Build artifacts
     - Unrelated files

3. **Update documentation if needed**
   - If you've added a new feature, update the README.md
   - Add comments to complex code sections
   - Update this CONTRIBUTING.md if you've changed the project structure

### Creating the PR

1. **Push your changes to your fork**
   ```bash
   git checkout -b feature/your-feature-name
   # Make your changes
   git add .
   git commit -m "Add: descriptive commit message"
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request on GitHub**
   - Go to the original repository
   - Click "New Pull Request"
   - Click "Compare across forks"
   - Set the base repository to the original repo and base branch to `main` (or `master`)
   - Set the head repository to your fork and the branch with your changes

3. **Write a good PR description**
   - Use a clear, descriptive title
   - Reference any related issues (e.g., "Closes #123" or "Addresses #456")
   - Describe what your changes do and why
   - Include screenshots or GIFs for UI changes
   - Mention any breaking changes or migration steps if applicable

### PR Review Process

- Maintainers will review your PR
- Address any feedback or requested changes
- Once approved, your PR will be merged
- Thank you for contributing! 🎉

## Algorithm Implementation Guidelines

If you're implementing a new algorithm, here are some guidelines:

### Algorithm Hook Pattern
- Create a custom hook similar to `useAlgorithmRunner.js`
- The hook should manage algorithm state and step-by-step execution
- Return algorithm state, control functions, and step information

### Visualization Components
- Create visualization components in the appropriate `algorithm-viz/` directory
- Follow the existing patterns (DistanceTable, MinHeapVisualization, etc.)
- Ensure components work in both light and dark themes
- Make components responsive for mobile devices

### Graph Compatibility
- Ensure your algorithm works with the existing graph structure
- Support both auto-generated and manually created graphs
- Handle edge cases (negative cycles, disconnected graphs, etc.)

### Educational Value
- Include pseudocode highlighting
- Show algorithm state clearly (data structures, current step, etc.)
- Provide clear visual feedback for each operation
- Consider adding explanations or tooltips for complex steps

## Questions or Need Help?

- **Open an issue**: For bug reports, feature requests, or questions
- **Check existing issues**: Someone might have already asked your question
- **Review the code**: The codebase is well-structured and documented

## Code of Conduct

This project is designed to be an educational resource for students, educators, and learners. We aim to create a welcoming and inclusive environment. Please:

- Be respectful and constructive in all interactions
- Help others learn and grow
- Focus on improving the educational experience
- Report any inappropriate behavior

## License

By contributing to AlgoPlatform, you agree that your contributions will be licensed under the MIT License.

---

Thank you for taking the time to contribute to AlgoPlatform! Your efforts help make algorithm visualization more accessible to learners worldwide. 🚀

