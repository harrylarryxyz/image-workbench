# Architecture

Image Workbench is designed as the long-term implementation, separate from the temporary FastAPI demo.

## Principles

- API keys stay server-side.
- Generation is queued, not tied to a synchronous browser request.
- Provider routing and diagnostics are first-class data.
- Storage is abstracted so local filesystem can later move to S3/R2/MinIO.
- Canvas is a workflow graph, not a Photoshop clone.

## Stack

- Next.js for the UI shell.
- NestJS for API modules and workers.
- PostgreSQL + Prisma for durable metadata.
- Redis + BullMQ for generation jobs.
- Sharp/image-utils for metadata and thumbnails.
- React Flow + Konva planned for canvas/editing phases.
