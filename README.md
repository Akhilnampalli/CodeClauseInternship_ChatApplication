# CodeClauseInternship_ChatApplication

Simple real-time chat app using Socket.io.

## Structure
- backend/ - Node.js + Express + Socket.io server (serves frontend)
- frontend/ - static HTML/CSS/JS client

## Setup & Run (locally)
1. Open a terminal at `backend/`
2. Install:
```

npm install

```
3. Start:
```

npm run start

```
or during development:
```

npm run dev

```
4. Open browser: http://localhost:3000

## Notes
- Multi-room support included.
- No persistent DB (in-memory). For production, add database & authentication.