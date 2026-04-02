# Pulp Management UI

Web admin console for [Pulp 3](https://pulpproject.org/)—manage users, groups, distributions, RPM content, and file uploads against your Pulp API. Built with **Next.js** (App Router), **React 19**, **TypeScript**, and **Tailwind CSS**. Server routes proxy the Pulp REST API with cookie-based sessions.

## Features

- **Authentication** — Log in against Pulp; protected pages and API routes.
- **Users** — List and create Pulp users (staff/active flags, profile fields).
- **Groups** — List and create access groups.
- **Distributions** — Browse publication endpoints (base path, base URL, linked repository).
- **Content** — List RPM package content; open package detail (checksums, NVRA, artifact).
- **Uploads** — List upload sessions; **chunked upload** for large files; optional **create RPM content** from an artifact; **add content to an RPM repository** by name.

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

**Suggested GitHub repository topics:** `pulp` `pulp3` `pulp-project` `repository-management` `rpm` `rpm-packages` `content-management` `artifact-upload` `chunked-upload` `nextjs` `next-js` `react` `typescript` `tailwindcss` `app-router` `api-proxy` `admin-ui` `devops` `linux-packages` `software-repository`

**Keywords:** pulp, pulp 3, pulp3, repository manager, RPM repository, YUM/DNF content, artifact upload, chunked file upload, distribution, publication, user management, group management, Next.js admin, React dashboard, TypeScript UI, Tailwind, Pulp REST API v3, content gateway, package hosting.
