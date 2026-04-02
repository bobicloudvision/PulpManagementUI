# Pulp Management UI

Web admin console for [Pulp 3](https://pulpproject.org/)—manage users, groups, distributions, RPM content, and file uploads against your Pulp API. Built with **Next.js** (App Router), **React 19**, **TypeScript**, and **Tailwind CSS**. Server routes proxy the Pulp REST API with cookie-based sessions.

## Features

- **Authentication** — Log in against Pulp; protected pages and API routes.
- **Users** — List and create Pulp users (staff/active flags, profile fields).
- **Groups** — List and create access groups.
- **Distributions** — Browse publication endpoints (base path, base URL, linked repository).
- **Content** — List RPM package content; open package detail (checksums, NVRA, artifact).
- **Uploads** — List upload sessions; **chunked upload** for large files; optional **create RPM content** from an artifact; **add content to an RPM repository** by name.

## Screenshots

### RPM package detail

![RPM package instance with checksums and dependencies](screenshots/screenshot1.png)

### Distributions

![Published distributions, base path and base URL](screenshots/screenshot2.png)

### Content list

![RPM content list with pagination](screenshots/screenshot3.png)

### Upload sessions

![Chunked uploads list](screenshots/screenshot4.png)

### Upload file

![Chunked upload form](screenshots/screenshot5.png)

## Getting started

1. Copy environment:

   ```bash
   cp .env.example .env
   ```

   Set `PULP_BASE_URL` to your Pulp API v3 base (e.g. `https://your-host/pulp/api/v3`).

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) (redirects to the users list after login).

## Scripts

| Command        | Description        |
| -------------- | ------------------ |
| `npm run dev`  | Development server |
| `npm run build` | Production build  |
| `npm run start` | Start production  |
| `npm run lint`  | ESLint             |

## Discoverability

**Keywords:** pulp, pulp 3, pulp3, repository manager, RPM repository, YUM/DNF content, artifact upload, chunked file upload, distribution, publication, user management, group management, Next.js admin, React dashboard, TypeScript UI, Tailwind, Pulp REST API v3, content gateway, package hosting.
