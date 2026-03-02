# Development Guidelines

## Code Style

### TypeScript
- Use strict mode
- Always annotate function return types
- Use interfaces for type definitions
- Use const for immutable values

Example:
```typescript
interface TaskProps {
  task: Task;
  onPress: () => void;
}

export function MyComponent({ task, onPress }: TaskProps): React.ReactElement {
  return <View />;
}
```

### React Native Components
- Functional components only
- Use React.ReactElement return type
- Extract styles into StyleSheet when possible
- Prop drilling is okay for small component trees; use context for larger ones

### File Naming
- Components: PascalCase (`TaskCard.tsx`)
- Services: camelCase (`taskService.ts`)
- Utilities: camelCase (`taskUtils.ts`)
- Types: PascalCase in index files (`index.ts`)

## State Management Patterns

### Using Zustand Stores
```typescript
// In a component
const tasks = useTaskStore((state) => state.tasks);
const addTask = useTaskStore((state) => state.addTask);

// Subscribe to specific slices
const count = useTaskStore((state) => state.tasks.length);
```

## Component Hierarchy

```
_layout.tsx (Root)
├── Navigation Stack
│   ├── Home Screen (index.tsx)
│   ├── Task Detail Screen
│   ├── Create Task Screen
│   └── Profile Screen
```

## API Integration

All API calls go through `services/api.ts`. Add new service methods in `services/taskService.ts`:

```typescript
export const taskService = {
  methodName: async (params): Promise<ReturnType> => {
    const { data } = await apiClient.get('/endpoint', { params });
    return data;
  },
};
```

## Component Organization

### Presentational vs Container
- Components in `components/` are presentational (no business logic)
- Screens in `screens/` handle business logic and state
- Services handle API communication

### Props Interface Pattern
```typescript
interface ComponentNameProps {
  requiredProp: string;
  optionalProp?: boolean;
  onEvent: (data: any) => void;
}

function ComponentName(props: ComponentNameProps): React.ReactElement {
  // Implementation
}
```

## Testing

- Write tests in `__tests__` folders parallel to source
- Test component behavior, not implementation
- Mock API responses in tests
- Use React Testing Library patterns

## Performance Tips

1. **Memoization**: Use React.memo for components that receive stable props
2. **State Optimization**: Only subscribe to store slices you need
3. **List Rendering**: Use keyExtractor for FlatList components
4. **Image Loading**: Always specify width and height

## Debugging

### Useful Tools
- Expo DevTools (shake device or `d` in terminal)
- React DevTools Browser Extension
- Network tab in browser (for web builds)

### Useful Console Methods
```typescript
console.log(); // Standard logging
console.warn(); // Warnings (shown in yellow)
console.error(); // Errors (shown in red)
```

## Git Workflow

```bash
# Feature branch
git checkout -b feature/task-create

# Commit early and often
git commit -m "feat: add task creation UI"

# Push and create PR
git push origin feature/task-create
```

## Common Tasks

### Adding a New Screen
1. Create file in `src/screens/` or `src/app/`
2. Use `useTaskStore` and `useAuthStore` as needed
3. Import reusable components
4. Add routing if needed

### Adding a New Store
1. Create file in `src/store/`
2. Export hook at the bottom
3. Import in components with `use<StoreName>`

### Adding API Integration
1. Add method in `services/taskService.ts`
2. Use in store action or component
3. Handle loading/error states

## Troubleshooting Development

### TypeScript Errors
- Run `npm run type-check` to see all errors
- Check `tsconfig.json` for compiler options

### Module Resolution
- Check path aliases in `tsconfig.json`
- Use `@/` prefix for src imports

### State Management Issues
- Check store initialization in `store/` files
- Verify component subscriptions to store slices
- Use React DevTools to inspect component tree

---

Last Updated: February 6, 2026
