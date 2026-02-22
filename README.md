# Face Recognition Attendance System (FRAS)

A production-ready Face Recognition Attendance System using Next.js, Cloud Run, and Firestore.

## Architecture

This project is divided into two main components:
- `backend/`: FastAPI application utilizing InsightFace for CPU-optimized embedding generation
- `frontend/`: Next.js 14 App Router application with MediaPipe liveness detection

## Features

- Sub-300ms total response time via stateless architecture
- CPU-only inference using `buffalo_l` model
- Zero-cost idle time with Cloud Run scale-to-zero capabilities
- Real-time dashboard powered by Firestore listeners
- In-memory embedding matrix for rapid cosine similarity matching

## Setup Instructions

### Prerequisites
- Docker
- Node.js 18+
- GCP Project with Firestore & Cloud Run enabled

See the `FRAS-Implementation-Guide.docx` for complete deployment instructions.