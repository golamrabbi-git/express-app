# express-app

Basic Express.js API starter.

## Setup

```bash
yarn install
cp .env.example .env
yarn dev        # development with auto-reload (nodemon)
yarn start      # production
```

## Endpoints

- `GET /` — welcome message
- `GET /api/health` — health check

## Structure

```
src/
  app.js          # Express app & middleware
  server.js       # entry point
  config/         # env config
  routes/         # route definitions
  controllers/    # request handlers
  middlewares/    # 404 + error handler
```
