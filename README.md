# WebDocTo

Modern web application for uploading PDF or image files, converting PDF pages to images, preprocessing them for OCR, previewing results, and managing per-user processing history.

Repository: [natthawut-s-gif/WedDocTo](https://github.com/natthawut-s-gif/WedDocTo.git)

## Features

- Upload PDF and image files
- Split PDF into per-page images
- OCR-oriented image preprocessing
- Original vs processed preview
- Per-page JSON/webhook response viewer
- Role-aware UI (`admin`, `user`, `guest`)
- Google Login settings
- Per-user session history
- Docker support
- Jenkins pipeline for production image build/deploy

## Tech Stack

- Frontend: Plain HTML, CSS, JavaScript
- Backend: FastAPI
- PDF/Image processing:
  - PyMuPDF
  - OpenCV
  - Pillow
  - NumPy
- Deployment:
  - Docker
  - Docker Compose
  - Jenkins

## Project Structure

```text
WebDocTo/
|- app/
|  |- main.py
|  |- processing.py
|  |- static/
|  |  |- index.html
|  |  |- styles.css
|  |  |- app.js
|  |  `- webdocto-logo.png
|  `- asset/
|- data/
|- ocr_preprocess.py
|- requirements.txt
|- Dockerfile
|- docker-compose.yml
|- Jenkinsfile
|- VERSION
```

## Requirements

- Python 3.11+
- Docker Desktop

## Local Development

### 1. Create virtual environment

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the web app

```bash
uvicorn app.main:app --reload
```

Open:

```text
http://127.0.0.1:8000
```

## Docker

### Prepare source code on server

If you want to build and run this project on another server, you must clone the Git repository to that server first.

```bash
git clone https://github.com/natthawut-s-gif/WedDocTo.git
cd WedDocTo
```

Then build or run Docker from inside the project folder.

### Build Docker image

Build the web application image directly with Docker:

```bash
docker build -t webdocto:1.0.0 .
```

If you want to pass a version at build time:

```bash
docker build --build-arg APP_VERSION=1.0.0 -t webdocto:1.0.0 .
```

If you want to control the container user and pip version too:

```bash
docker build \
  --build-arg APP_VERSION=1.0.0 \
  --build-arg APP_UID=10001 \
  --build-arg APP_GID=10001 \
  --build-arg PIP_VERSION=25.1.1 \
  -t webdocto:1.0.0 .
```

### Run Docker image

Run the built image manually:

```bash
docker run --rm -p 8000:8000 webdocto:1.0.0
```

Open:

```text
http://127.0.0.1:8000
```

### Run with Docker Compose

If this is a fresh server, clone the repository first, then run:

```bash
docker compose up --build
```

Open:

```text
http://127.0.0.1:8000
```

### Versioned image

```bash
set APP_VERSION=1.0.1
docker compose up --build
```

## Production Environment Variables

Copy the example file:

```bash
copy .env.production.example .env.production
```

Main variables:

- `APP_VERSION`
- `PYTHON_VERSION`
- `APP_UID`
- `APP_GID`
- `PIP_VERSION`
- `WEB_PORT`
- `WEBDOCTO_SECRET`
- `N8N_WEBHOOK_URL`
- `PUBLIC_WEB_ORIGIN`
- `GOOGLE_LOGIN_ENABLED`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_JAVASCRIPT_ORIGIN`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_LOGIN_URL`
- `GOOGLE_LOGIN_SUCCESS_URL`
- `GOOGLE_ADMIN_EMAIL_LIST`

### Google Login in Docker

If you run the project in Docker and want `Continue with Google` to work on a fresh container, set the Google values in `.env.production` before running `docker compose up`.

Example:

```env
PUBLIC_WEB_ORIGIN=http://127.0.0.1:8000
GOOGLE_LOGIN_ENABLED=true
GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_JAVASCRIPT_ORIGIN=http://127.0.0.1:8000
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/login/oauth2/code/google
GOOGLE_LOGIN_URL=http://127.0.0.1:8000/#login-google
GOOGLE_LOGIN_SUCCESS_URL=http://127.0.0.1:8000/#dashboard
GOOGLE_ADMIN_EMAIL_LIST=admin@gmail.com
```

Without these values, a fresh Docker container will keep Google Login disabled until you configure it from the Settings page.

## Health and Version Endpoints

- Health:

```text
GET /api/health
```

- Version:

```text
GET /api/version
```

## Google Login

The application supports Google-based identity flow and role mapping.

- Google settings are stored on the server
- Admin-only settings are shown only for `admin`
- Email sign-in is allowed only for emails that have previously verified via Google on this system

## Session and History Rules

- Logged-in users only see their own sessions
- Guest users only use temporary sessions
- Guest sessions are cleaned when the browser exits
- Logged-in user sessions persist on the server
- `Clear All History` only removes the current user's own history

## Jenkins

`Jenkinsfile` is included for production build/deploy.

Pipeline supports:

- setting `APP_VERSION`
- building Docker image
- generating `.env.production`
- deploying with Docker Compose

Main Jenkins parameters:

- `APP_VERSION`
- `PYTHON_VERSION`
- `APP_UID`
- `APP_GID`
- `PIP_VERSION`
- `WEB_PORT`
- `DEPLOY`

## GitHub Releases And Packages

The repository now includes a GitHub Actions workflow:

- [`.github/workflows/package-and-release.yml`](.github/workflows/package-and-release.yml)

What it does:

- builds the Docker image
- publishes the image to GitHub Container Registry (`ghcr.io`)
- creates a GitHub Release

How to use it:

1. Push a Git tag like `v1.0.0`
2. GitHub Actions will:
   - create Release `v1.0.0`
   - publish package `ghcr.io/natthawut-s-gif/weddocto:1.0.0`
   - publish package `ghcr.io/natthawut-s-gif/weddocto:latest`

Example:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Main Files

- Backend entry: [app/main.py](app/main.py)
- OCR integration: [app/processing.py](app/processing.py)
- OCR script: [ocr_preprocess.py](ocr_preprocess.py)
- Frontend HTML: [app/static/index.html](app/static/index.html)
- Frontend CSS: [app/static/styles.css](app/static/styles.css)
- Frontend JS: [app/static/app.js](app/static/app.js)

## Notes

- The project stores runtime data under `data/`
- `Client Secret` should not be stored in frontend/localStorage for real production systems
- If you deploy publicly, set a strong `WEBDOCTO_SECRET`

## Git Push

Initial push:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/natthawut-s-gif/WedDocTo.git
git push -u origin main
```

Next updates:

```bash
git add .
git commit -m "update code"
git push
```
