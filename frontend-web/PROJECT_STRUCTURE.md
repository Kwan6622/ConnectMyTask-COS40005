# ConnectMyTask - Frontend Project Structure

## 📁 Project Structure

```
frontend-web/
├── public/                              # Static assets
│   ├── index.html
│   ├── favicon.ico
│   └── locales/                         # i18n translation files
│       ├── en.json
│       └── vi.json
│
├── src/
│   ├── components/                      # Reusable UI components
│   │   ├── common/                      # Common UI components
│   │   │   ├── Button.tsx              # Button component
│   │   │   ├── Input.tsx               # Input component
│   │   │   ├── Card.tsx                # Card component
│   │   │   ├── Modal.tsx               # Modal component
│   │   │   └── index.ts                # Exports
│   │   │
│   │   ├── layout/                      # Layout components
│   │   │   ├── Header.tsx              # Navigation header
│   │   │   ├── Footer.tsx              # Footer
│   │   │   └── index.ts
│   │   │
│   │   ├── task/                        # Task-related components
│   │   │   ├── TaskCard.tsx            # Task card component
│   │   │   └── index.ts
│   │   │
│   │   └── map/                         # Map & tracking components
│   │       └── index.ts
│   │
│   ├── pages/                           # Page components
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── TaskPostPage.tsx
│   │   ├── TaskBrowsePage.tsx
│   │   ├── TaskDetailPage.tsx
│   │   ├── TrackingPage.tsx
│   │   ├── Auth/
│   │   └── Admin/
│   │
│   ├── hooks/                           # Custom React hooks
│   │   ├── useAuth.ts                  # Auth utilities
│   │   ├── useAsync.ts                 # Async data fetching
│   │   └── index.ts
│   │
│   ├── services/                        # API service layer
│   │   └── api.ts                       # Axios API client with interceptors
│   │
│   ├── stores/                          # Zustand state management
│   │   ├── auth.store.ts               # Auth state
│   │   └── task.store.ts               # Task state
│   │
│   ├── utils/                           # Helper functions
│   │   └── index.ts                     # Utility functions
│   │
│   ├── types/                           # TypeScript interfaces
│   │   └── index.ts                     # Type definitions
│   │
│   ├── constants/                       # App constants
│   │   └── index.ts                     # Constants & configs
│   │
│   ├── i18n/                            # Internationalization
│   │   └── index.ts                     # i18next configuration
│   │
│   ├── App.tsx                          # Main App component
│   ├── main.tsx                         # Entry point
│   ├── index.css                        # Global styles
│   └── config.ts                        # Environment config
│
├── public/
│   └── locales/
│       ├── en.json                      # English translations
│       └── vi.json                      # Vietnamese translations
│
├── vite.config.ts                       # Vite configuration
├── tailwind.config.js                   # Tailwind CSS configuration
├── tsconfig.json                        # TypeScript configuration
├── package.json                         # Dependencies
├── .env.example                         # Environment variables template
└── README.md                            # Documentation
```

## 🚀 Key Features

### Components
- **Button**: Variant styles (primary, outline, ghost, danger)
- **Input**: Form input with icons and error handling
- **Card**: Reusable card container
- **Modal**: Dialog component
- **Header**: Navigation with auth-aware menu
- **Footer**: Site footer with links
- **TaskCard**: Task display card

### Pages
- **HomePage**: Landing page with task browsing
- **LoginPage**: Authentication (login/signup toggle)
- **ProfilePage**: User profile management
- **TaskPostPage**: Create new tasks
- **TaskBrowsePage**: Browse and filter tasks
- **TaskDetailPage**: Task details and bidding
- **TrackingPage**: Real-time tracking

### State Management (Zustand)
- **auth.store**: User authentication & profile
- **task.store**: Tasks, filters, bidding

### Services
- **API Service**: Centralized API client with interceptors
  - Auth endpoints
  - Task endpoints
  - Bid endpoints
  - User endpoints
  - Tracking endpoints
  - AI endpoints
  - Payment endpoints

### Utilities
- Currency formatting
- Date formatting
- Distance calculation
- Status colors
- Text truncation
- Email/phone validation
- Local storage helpers

### i18n Support
- English (en)
- Vietnamese (vi)
- Extensible structure for more languages

## 📦 Dependencies

### Core
- React 18+
- React Router DOM v6
- TypeScript
- Vite

### UI & Styling
- Tailwind CSS
- Heroicons (icons)

### State & Data
- Zustand (state management)
- Axios (HTTP client)

### Forms
- React Hook Form

### Localization
- i18next
- react-i18next

### Notifications
- React Hot Toast

### Code Quality
- ESLint
- Prettier

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Update with your values:
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
VITE_STRIPE_KEY=your_stripe_key
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 4. Build for Production
```bash
npm run build
```

### 5. Preview Build
```bash
npm run preview
```

## 🔐 Protected Routes

Certain routes require authentication:
- `/post-task` - CLIENT role required
- `/profile` - Authenticated users only
- `/tasks/:id/tracking` - Authenticated users only

## 🎨 Styling

The project uses:
- **Tailwind CSS**: Utility-first CSS framework
- **Custom CSS**: Global styles in `index.css`
- **Component Variants**: CVA library for component variations

### Color Scheme
- Primary: Blue (`blue-600`)
- Secondary: Purple (`purple-600`)
- Success: Green
- Warning: Yellow
- Error: Red

## 🌐 Internationalization

Translation files are in `public/locales/`:
- `en.json` - English
- `vi.json` - Vietnamese

Add new languages by creating new JSON files and updating i18n config.

## 📝 API Integration

The API service in `src/services/api.ts` includes:

### Authentication
- `login(email, password)`
- `signup(data)`
- `logout()`
- `getCurrentUser()`

### Tasks
- `getAll(filters)`
- `getById(id)`
- `create(data)`
- `update(id, data)`
- `delete(id)`

### Bids
- `create(taskId, data)`
- `accept(taskId, bidId)`
- `reject(taskId, bidId)`

### Tracking
- `getTracking(taskId)`
- `updateLocation(data)`
- `getHistory(taskId)`

## 🧪 Testing

(Add test setup instructions here)

## 📄 License

MIT

## 👥 Contributors

ConnectMyTask Team
