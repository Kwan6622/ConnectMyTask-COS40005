# Frontend Development Quick Reference

## 📁 Quick File Locations

### Add a New Component
```
src/components/common/YourComponent.tsx
src/components/common/index.ts (add export)
```

### Add a New Page
```
src/pages/YourPage.tsx
```

### Add a New API Endpoint
```
src/services/api.ts (add to relevant namespace)
```

### Add State Management
```
src/stores/yourname.store.ts
```

### Add Custom Hook
```
src/hooks/useYourHook.ts
src/hooks/index.ts (add export)
```

### Add Utility Function
```
src/utils/index.ts (add to existing)
```

### Add Type Definition
```
src/types/index.ts (add interface)
```

### Add Constants
```
src/constants/index.ts (add constant)
```

## 🎨 Component Template

```tsx
import React from 'react';
import { Button } from '../components/common/Button';

interface YourComponentProps {
  title: string;
  onClick?: () => void;
}

export const YourComponent: React.FC<YourComponentProps> = ({
  title,
  onClick,
}) => {
  return (
    <div className="p-6 bg-white rounded-lg">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <Button onClick={onClick}>Click me</Button>
    </div>
  );
};
```

## 🛣️ Routing Template

```tsx
// In App.tsx, add route:
<Route
  path="/your-page"
  element={
    <ProtectedRoute roles={['CLIENT']}>
      <YourPage />
    </ProtectedRoute>
  }
/>
```

## 📝 Form Template

```tsx
import { useForm } from 'react-hook-form';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

interface FormData {
  name: string;
  email: string;
}

export const MyForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...register('name', { required: 'Name is required' })}
        placeholder="Your name"
        error={errors.name?.message}
      />

      <Input
        {...register('email', { required: 'Email is required' })}
        type="email"
        placeholder="your@email.com"
        error={errors.email?.message}
      />

      <Button type="submit">Submit</Button>
    </form>
  );
};
```

## 🎣 Custom Hook Template

```tsx
import { useState, useCallback } from 'react';

export const useYourHook = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Your logic here
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, fetchData };
};
```

## 🏪 Store Template

```tsx
import { create } from 'zustand';

interface MyState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useMyStore = create<MyState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

// Usage in component:
// const { count, increment } = useMyStore();
```

## 🔐 Authentication Usage

```tsx
import { useAuth } from '../hooks/useAuth';

export const MyComponent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.fullName}</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
};
```

## 🌐 API Usage

```tsx
import { api } from '../services/api';

// In a component or store:
const response = await api.tasks.getAll({ category: 'DELIVERY' });
const task = await api.tasks.getById('task-id');
await api.tasks.create(taskData);
await api.bids.create(taskId, bidData);
```

## 🎨 Tailwind Classes Reference

### Spacing
- `p-4` - padding 1rem
- `m-4` - margin 1rem
- `gap-4` - gap between items

### Typography
- `text-lg` - large text
- `font-bold` - bold text
- `text-gray-700` - gray text

### Colors
- `bg-blue-600` - blue background
- `text-white` - white text
- `border-gray-300` - gray border

### Layout
- `flex` - flexbox
- `grid` - css grid
- `grid-cols-3` - 3 columns

### Responsive
- `md:` - medium screens (768px+)
- `lg:` - large screens (1024px+)
- `hidden md:block` - hide on mobile, show on medium+

## 🔄 State Updates

```tsx
// Using store in component:
import { useAuthStore } from '../stores/auth.store';

export const MyComponent: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <button onClick={logout}>
      Logout
    </button>
  );
};
```

## 📊 Type Safety

```tsx
// Define types:
import { Task, User } from '../types';

// Use in components:
interface MyComponentProps {
  task: Task;
  user: User;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  task,
  user,
}) => {
  // TypeScript checks all properties
  return <div>{task.title}</div>;
};
```

## 🎯 Common Patterns

### Loading States
```tsx
{isLoading ? (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
) : (
  <div>Content</div>
)}
```

### Error Handling
```tsx
import toast from 'react-hot-toast';

try {
  await api.tasks.create(data);
  toast.success('Task created!');
} catch (error) {
  toast.error('Failed to create task');
}
```

### Conditional Rendering
```tsx
{user?.role === 'PROVIDER' && (
  <Button>Submit Bid</Button>
)}
```

### List Rendering
```tsx
{tasks.map((task) => (
  <TaskCard key={task.id} task={task} />
))}
```

## 🚀 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview build
npm run preview

# Type check
tsc --noEmit

# Lint code
npm run lint
```

## 📚 Documentation Files

- `PROJECT_STRUCTURE.md` - Detailed project structure
- `SETUP_SUMMARY.md` - Setup completion summary
- `QUICK_REFERENCE.md` - This file!

---

**Happy Coding!** 🎉
