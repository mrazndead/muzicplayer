# AI Rules & Technical Guidelines

## Tech Stack
- **React 18 & Vite**: Modern frontend framework and build tool for a fast development experience.
- **TypeScript**: Strictly typed codebase for better maintainability and error prevention.
- **Tailwind CSS**: Utility-first styling for rapid, responsive, and consistent UI development.
- **shadcn/ui & Radix UI**: Accessible, high-quality component primitives for building the UI.
- **Framer Motion**: Declarative animations for smooth transitions and interactive elements.
- **TanStack Query (React Query)**: Powerful server-state management for data fetching and caching.
- **Lucide React**: Comprehensive and consistent icon library.
- **React Router**: Standard client-side routing for navigation.
- **Sonner**: Lightweight and customizable toast notifications.
- **Zod & React Hook Form**: Type-safe form validation and management.

## Library Usage Rules

### Styling & UI
- **Tailwind CSS**: Use Tailwind classes for all styling. Utilize the `cn` utility from `src/lib/utils.ts` for conditional class merging.
- **shadcn/ui**: Always check for existing shadcn components before building custom ones. Follow the existing patterns for customization.
- **Icons**: Use `lucide-react` exclusively. Do not import icons from other libraries.
- **Animations**: Use `framer-motion` for any complex transitions, hover effects, or layout animations.

### Data & State
- **Data Fetching**: Use TanStack Query (`useQuery`, `useMutation`) for all API interactions. Avoid raw `fetch` calls inside `useEffect`.
- **Global State**: Use React Context for global UI state (e.g., `AppThemeContext`). Use TanStack Query for server-side state.
- **Validation**: Use `zod` for defining schemas and validating data, especially for forms and API responses.

### Architecture
- **Components**: Keep components small and focused. Place them in `src/components/`.
- **Pages**: Define top-level views in `src/pages/` and register them in `src/App.tsx`.
- **Hooks**: Extract reusable logic into custom hooks within `src/hooks/`.
- **Theming**: Use the CSS variables defined in `src/index.css` and managed via `AppThemeContext.tsx` to ensure theme consistency.
- **Audio**: Use the existing `useAudioPlayer` hook for all music playback logic to maintain a single source of truth for the player state.