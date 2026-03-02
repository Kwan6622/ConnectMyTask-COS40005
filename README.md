## ConnectMyTask Backend API

Node.js / Express backend for the **ConnectMyTask** capstone project. This service provides task management, bidding, reviews, AI-assisted recommendations, and IoT-style GPS tracking with real-time updates via Socket.io.

### Tech Stack

- **Runtime**: Node.js (CommonJS)
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: Socket.io
- **HTTP Client**: Axios (AI integration)
- **Validation**: Zod
- **Containerisation**: Docker

### Project Structure

- `src/server.js` – HTTP + Socket.io bootstrap
- `src/app.js` – Express app, middleware, and route mounting
- `src/config/env.js` – Environment variable handling
- `src/database/prisma.js` – Prisma client singleton
- `src/shared/` – Cross-cutting helpers (logging, errors, validation, socket)
- `src/modules/` – Modular monolith feature modules:
  - `users/`
  - `tasks/`
  - `bids/`
  - `reviews/`
  - `tracking/` (IoT GPS ingestion)
  - `ai-integration/` (AI orchestration layer)

### Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

- `NODE_ENV` – `development` | `production`
- `PORT` – HTTP port (default `4000`)
- `DATABASE_URL` – Postgres connection string (Prisma)
- `AI_SERVICE_URL` – Base URL of external AI service (e.g. `http://ai-service`)

### Database & Prisma

1. Ensure PostgreSQL is running and the database exists:

```bash
createdb connectmytask
```

2. Create tables (recommended for local development):

```bash
npx prisma db push
```

If you enable the login lockout feature, ensure migrations include new user fields:

```bash
npx prisma migrate dev --name add-login-lockout-fields
```

3. Generate Prisma client:

```bash
npx prisma generate
```

### Migrations & Seed

Run migrations:

```bash
npm run prisma:migrate
```

Seed database:

```bash
npm run prisma:seed
```

Seed output includes requester credentials and created task count.

Notes:

- If your DB user does not have permission on the `public` schema, set `DATABASE_URL` to use a dedicated schema (example: `...?schema=app`) and create it once:

```bash
echo "CREATE SCHEMA IF NOT EXISTS app;" | npx prisma db execute --stdin
```

### Running Locally

Install dependencies:

```bash
npm install
```

Run in development mode:

```bash
npm run dev
```

Run in production mode:

```bash
npm run start
```

The API will be available at `http://localhost:4000`.

### Core REST Endpoints

All routes are prefixed with `/api` unless noted.

- **Tasks**
  - `POST /api/tasks` – Create a task
  - `GET /api/tasks` – List tasks (optional `status`, `category` query)
  - `GET /api/tasks/:id` – Get task details
  - `PATCH /api/tasks/:id/status` – Update task status

- **Bids**
  - `POST /api/bids` – Create a bid
  - `GET /api/tasks/:id/bids` – List bids for a task
  - `POST /api/bids/:id/accept` – Accept a bid (assigns provider and rejects others)

- **Reviews**
  - `POST /api/reviews` – Create a review
  - `GET /api/providers/:id/reviews` – List reviews for a provider

- **Tracking (Simulated IoT GPS)**
  - `POST /api/tracking/update`

Request body:

```json
{
  "taskId": 1,
  "providerId": 2,
  "lat": -37.8136,
  "lng": 144.9631,
  "timestamp": "2026-02-23T10:00:00.000Z"
}
```

Flow:

- Persisted into `TRACKING_LOGS` via Prisma.
- Emits Socket.io event `location:update` with `{ taskId, providerId, lat, lng, timestamp }`.

- **AI Integration**
  - `POST /api/ai/recommend/:taskId`

Flow:

1. Fetch task from DB.
2. Call external AI service:

   - **URL**: `POST ${AI_SERVICE_URL}/recommend`
   - **Payload**:

   ```json
   {
     "category": "Cleaning",
     "description": "Clean a 3 bedroom apartment",
     "location": "Melbourne CBD",
     "budget": 150
   }
   ```

3. Expect response:

   ```json
   {
     "suggestedPrice": 160,
     "recommendedProviders": [1, 2, 3],
     "confidenceScore": 0.92
   }
   ```

4. Store in `AI_INSIGHTS` table.
5. Return structured JSON to frontend with the same fields (`taskId`, `suggestedPrice`, `recommendedProviders`, `confidenceScore`).

### Real-Time Tracking (Socket.io)

- Socket.io server is attached to the same HTTP server (`src/server.js`).
- Clients (web or mobile) should connect to:

```js
const socket = io("http://localhost:4000");

socket.on("location:update", (payload) => {
  // handle live GPS updates
});
```

- Event payload:

```json
{
  "taskId": 1,
  "providerId": 2,
  "lat": -37.8136,
  "lng": 144.9631,
  "timestamp": "2026-02-23T10:00:00.000Z"
}
```

### Docker Usage

Build the image:

```bash
docker build -t connectmytask-api .
```

Run the container (with Postgres available and envs set):

```bash
docker run -p 4000:4000 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/connectmytask?schema=public" \
  -e AI_SERVICE_URL="http://ai-service" \
  --name connectmytask-api \
  connectmytask-api
```

You can then point:

- **Frontend (React)** at `http://localhost:4000/api/...`
- **AI Service (FastAPI)** at the host / network name you configure in `AI_SERVICE_URL`
- **Mobile GPS simulation** at `POST http://localhost:4000/api/tracking/update` and Socket.io at `ws://localhost:4000`

