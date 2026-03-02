# ConnectMyTask Mobile

A React Native mobile application for task management built with Expo, TypeScript, and modern mobile development practices.

## 📱 Features

- **Task Management**: Create, read, update, and delete tasks
- **Priority Levels**: Organize tasks by high, medium, and low priority
- **Task Status**: Mark tasks as complete or incomplete
- **Due Dates**: Set and track task deadlines
- **User Authentication**: Secure login and logout functionality
- **State Management**: Efficient state management with Zustand
- **Responsive Design**: Mobile-first UI design with React Native

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Emulator (Windows/Mac/Linux)

### Installation

1. **Navigate to the project directory**:
   ```bash
   cd frontend-mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Run on your platform**:
   - **iOS**: Press `i` in the terminal or run `npm run ios`
   - **Android**: Press `a` in the terminal or run `npm run android`
   - **Web**: Press `w` in the terminal or run `npm run web`

## 📂 Project Structure

```
src/
├── app/                    # Expo Router navigation structure
│   ├── _layout.tsx        # Root layout with safe area handling
│   └── index.tsx          # Home screen
├── components/            # Reusable React Native components
│   ├── Button.tsx         # Customizable button component
│   ├── Input.tsx          # Text input component
│   ├── TaskCard.tsx       # Task display card component
│   └── Badge.tsx          # Badge/label component
├── screens/               # Full-screen components
├── services/              # API services and integrations
│   ├── api.ts            # Axios API client setup
│   └── taskService.ts    # Task API methods
├── store/                 # Zustand state management
│   ├── authStore.ts      # Authentication state
│   └── taskStore.ts      # Task state management
├── types/                 # TypeScript type definitions
│   └── index.ts          # Task, User, Project types
└── utils/                 # Utility functions
    └── taskUtils.ts      # Task-related helpers
```

## 🛠️ Technology Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and build system
- **TypeScript**: Type-safe JavaScript
- **Zustand**: Lightweight state management
- **Axios**: HTTP client for API requests
- **React Navigation**: Navigation library (via Expo Router)
- **TailwindCSS/NativeWind**: Utility-first styling (can be added)

## 📝 Available Scripts

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web browser
npm run web

# Type checking
npm run type-check

# Linting
npm run lint

# Run tests
npm run test

# Run tests in CI mode
npm run test:ci

# Prebuild for native development
npm run prebuild
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```env
EXPO_PUBLIC_API_URL=http://localhost:4000/api
```

### API Configuration

Edit [src/services/api.ts](src/services/api.ts) to configure the API base URL and interceptors.

## 📦 State Management

### Task Store
Manages all task-related state using Zustand:

```typescript
import { useTaskStore } from "@/store/taskStore";

const tasks = useTaskStore((state) => state.tasks);
```

### Auth Store
Manages authentication state:

```typescript
import { useAuthStore } from "@/store/authStore";

const { user, isAuthenticated, login, logout } = useAuthStore();
```

## 🎨 Components

### Button Component
```typescript
<Button
  title="Add Task"
  variant="primary"
  onPress={() => handleAdd()}
/>
```

### Input Component
```typescript
<Input
  placeholder="Enter task name"
  value={taskName}
  onChangeText={setTaskName}
/>
```

### TaskCard Component
```typescript
<TaskCard
  task={task}
  onPress={() => navigate(`/task/${task.id}`)}
  onToggle={() => handleToggle(task.id)}
  onDelete={() => handleDelete(task.id)}
/>
```

## 🔌 API Integration

Task service methods:

```typescript
import { taskService } from "@/services/taskService";

// Get all tasks
const tasks = await taskService.getAllTasks();

// Create task
const newTask = await taskService.createTask({
  title: "My Task",
  description: "Task description",
  priority: "high",
  completed: false,
});

// Update task
await taskService.updateTask(taskId, { completed: true });

// Delete task
await taskService.deleteTask(taskId);
```

## 🧪 Testing

Run tests with Jest:

```bash
npm run test
```

Run tests in CI mode:

```bash
npm run test:ci
```

## 📱 Building for Production

### iOS Build
```bash
eas build --platform ios
```

### Android Build
```bash
eas build --platform android
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Commit: `git commit -am 'Add feature'`
4. Push: `git push origin feature/your-feature`
5. Create a Pull Request

## 📄 License

This project is part of ConnectMyTask. All rights reserved.

## 🆘 Troubleshooting

### Common Issues

#### Metro Bundler Errors
Clear cache and reinstall:
```bash
rm -rf node_modules
npm install
npm start --clear
```

#### Port Already in Use
Kill the process on port 19000:
```bash
# On Windows
netstat -ano | findstr :19000
taskkill /PID <PID> /F

# On macOS/Linux
lsof -i :19000
kill -9 <PID>
```

#### Android Emulator Issues
Reset the emulator:
```bash
emulator -avd <emulator_name> -wipe-data
```

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📞 Support

For issues or questions, please refer to the main ConnectMyTask repository.

---

**Last Updated**: February 6, 2026
