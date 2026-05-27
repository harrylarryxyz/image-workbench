# Image Workbench

A private AI image creation workbench designed for GPT Image 2 and OpenAI-compatible providers.

This is the long-term replacement for the temporary `image-draw-web` FastAPI demo. It is designed as a TypeScript monorepo with a real task queue, provider profiles, gallery, diagnostics, and a future canvas workflow.

## Target stack

- Web: Next.js + React + TypeScript
- API: NestJS + TypeScript
- DB: PostgreSQL + Prisma
- Queue: Redis + BullMQ
- Storage: local filesystem first, S3-compatible abstraction later
- Image tools: Sharp
- Canvas roadmap: React Flow + Konva
- Deployment: Docker Compose + Nginx

## Apps

- `apps/web`: Next.js UI
- `apps/api`: NestJS API + workers

## Packages

- `packages/shared`: shared types and Zod schemas
- `packages/provider-sdk`: provider adapters and route diagnostics
- `packages/image-utils`: image metadata helpers
