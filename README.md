# Kin Story

A full-stack web application with a React frontend and Node.js/Express backend.

## Project Structure

```
project-root/
│
├── client/                     # React Frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── api/                # Axios instances and API calls
│   │   ├── assets/             # Images, icons, fonts
│   │   ├── components/         # Reusable components
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── forms/
│   │   │   └── ui/
│   │   ├── pages/              # Page components
│   │   │   ├── Auth/
│   │   │   ├── Dashboard/
│   │   │   ├── Profile/
│   │   │   └── Settings/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── redux/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── validations/
│   │   └── styles/
│   └── package.json
│
├── server/                     # Node.js / Express Backend
│   ├── config/                 # DB, env, cloudinary config
│   ├── controllers/            # Request handlers
│   ├── models/                 # Data models
│   ├── routes/                 # Express routes
│   ├── middlewares/            # Auth, error, upload, validation
│   ├── services/               # Business logic
│   ├── repositories/           # Data access layer
│   ├── utils/                  # Helpers, JWT, email, logger
│   ├── validations/
│   ├── socket/                 # Socket.io
│   ├── cron/                   # Scheduled jobs
│   ├── uploads/
│   ├── app.ts
│   ├── index.ts
│   └── package.json
│
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
├── docker/                     # Docker files
├── docker-compose.yml
├── tsconfig.base.json
├── package.json                # Root workspace config
└── README.md
```

## Getting Started

### Install dependencies
```bash
npm install
```

### Run in development
```bash
npm run dev
```

### Build for production
```bash
npm run build
```
