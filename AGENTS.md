# AGENTS.md

## Project Goal

Create a modern SaaS-style web application for uploading PDF files, splitting each PDF into individual pages, converting each page into an image, and preprocessing the images to make them suitable for OCR.

The project already includes an `ocr_preprocess.py` script. The web application must integrate with this script or follow the same preprocessing logic.

The application should also include Docker support using `Dockerfile` and `docker-compose.yml` so it can be run easily in a containerized environment.

---

## Core Features

Build a web application with the following features:

1. PDF Upload
   - Allow users to upload one or multiple PDF files.
   - Support drag-and-drop upload.
   - Show uploaded file name, file size, and upload status.
   - Validate file type to accept only PDF files.

2. PDF Split
   - Split uploaded PDF into individual pages.
   - Each page should become a separate image.
   - Preserve correct page order.
   - Show page number for each generated image.

3. PDF to Image Conversion
   - Convert each PDF page into a high-quality image suitable for OCR.
   - Use recommended DPI around 300 DPI.
   - Output image format should be PNG by default.
   - Store or expose generated images in a predictable output folder.

4. OCR Image Preprocessing
   - Use or integrate the existing `ocr_preprocess.py`.
   - Preprocess each page image to improve OCR accuracy.
   - The preprocessing flow should include:
     - Convert PDF page to image at high resolution.
     - Crop document area if needed.
     - Deskew image if tilted.
     - Convert to grayscale.
     - Denoise lightly.
     - Improve contrast.
     - Sharpen text.
     - Optional thresholding when suitable.
   - Avoid aggressive preprocessing that may remove text, table lines, stamps, or important document details.

5. Preview Result
   - Show preview images after conversion and preprocessing.
   - Allow users to compare original page image and processed image.
   - Display status for each page:
     - Waiting
     - Processing
     - Completed
     - Failed

6. Download Output
   - Allow users to download:
     - Each processed image
     - All processed images as a ZIP file
   - Optional: provide download for split page images before preprocessing.

7. Processing Logs
   - Show simple processing logs in the UI.
   - Logs should be user-friendly.
   - Example:
     - PDF uploaded successfully
     - Page 1 converted to image
     - Page 1 preprocessing completed
     - ZIP file generated

---

## UI Design Direction

Design a modern SaaS dashboard web interface inspired by Untitled UI.

Create a clean, minimal, professional web UI for uploading PDF files and preparing them for OCR.

The design should feel like a premium B2B dashboard product with:
- White background
- Soft gray borders
- Subtle shadows
- Rounded corners
- Excellent spacing
- Clear visual hierarchy

Style direction:
- Clean SaaS dashboard design
- Minimal and professional
- White and light gray color palette
- Soft border radius
- Subtle drop shadows
- Modern typography
- Clear hierarchy
- Neutral UI icons
- Spacious layout
- Polished enterprise product feel

Visual details:
- Use 12-column grid layout
- Use 16px to 24px spacing system
- Font similar to Inter
- Border color: #EAECF0
- Text color: #101828
- Muted text: #667085
- Background: #F9FAFB
- Card background: #FFFFFF
- Rounded corners: 12px to 16px
- Light shadow: subtle and soft

Mood:
Premium, clean, calm, trustworthy, modern, simple, elegant, developer-tool dashboard, Figma design system style.

---

## Main UI Requirements

Create a desktop web interface with 1440px layout width.

Main screen should include:

1. App Shell
   - Left sidebar navigation
   - Top header
   - Main content area
   - Clean dashboard layout

2. Sidebar Menu
   Suggested menu items:
   - Dashboard
   - PDF Upload
   - OCR Preprocess
   - History
   - Settings

3. Header
   - Page title: “PDF OCR Preprocessor”
   - Short description:
     “Upload PDF files, split them into pages, convert pages to images, and preprocess them for better OCR accuracy.”
   - Optional action button:
     “New Upload”

4. Center Upload Card
   - Title: “Upload PDF for OCR”
   - Description:
     “Upload a PDF file to split it into pages and generate OCR-ready images.”
   - Drag and drop upload area with dashed border
   - Upload icon in the center
   - Text:
     “Click to upload or drag and drop”
   - Supported file note:
     “PDF files only, recommended scanned documents or invoices”
   - Button:
     “Select PDF”

5. Processing Options Card
   Include controls such as:
   - DPI dropdown:
     - 200 DPI
     - 300 DPI
     - 400 DPI
   - Output format:
     - PNG
     - JPG
   - Preprocessing mode:
     - Standard
     - Light
     - Strong
   - Checkboxes:
     - Deskew pages
     - Denoise image
     - Enhance contrast
     - Sharpen text
     - Generate ZIP file

6. File Preview List
   Show uploaded PDFs with:
   - File name
   - File size
   - Number of pages
   - Processing status
   - Progress bar
   - Remove button

7. Page Preview Grid
   After processing, show each page as a card:
   - Page thumbnail
   - Page number
   - Status badge
   - Buttons:
     - View original
     - View processed
     - Download image

8. Bottom Actions
   - Cancel button
   - Start Processing button
   - Download ZIP button after processing is complete

---

## Example UI Text

Use the following text in the interface:

Page title:
“PDF OCR Preprocessor”

Subtitle:
“Upload PDF files, split them into pages, convert pages to images, and preprocess them for better OCR accuracy.”

Upload card title:
“Upload PDF for OCR”

Upload card description:
“Upload a PDF file to generate clean, OCR-ready page images.”

Upload area text:
“Click to upload or drag and drop”

Supported file text:
“PDF only, up to 100MB”

Primary button:
“Start Processing”

Secondary button:
“Cancel”

Download button:
“Download ZIP”

Processing option title:
“OCR Preprocessing Options”

Preview section title:
“Processed Pages”

Log section title:
“Processing Logs”

---

## Technical Requirements

Use a clean and maintainable project structure.

Suggested stack:
- Frontend:
  - React, Next.js, or plain HTML/CSS/JS
  - Use modern component-based structure if possible
- Backend:
  - Python FastAPI or Flask
  - Backend should handle file upload, PDF splitting, image conversion, and preprocessing
- Processing:
  - Use existing `ocr_preprocess.py`
  - Use libraries such as:
    - PyMuPDF / fitz
    - pdf2image
    - OpenCV
    - Pillow
    - NumPy
- Deployment:
  - Provide `Dockerfile`
  - Provide `docker-compose.yml`
  - Web app should run with one command:
    `docker compose up --build`

## Implementation Update

The current implementation is a web app with a plain HTML frontend.

Current stack:
- Frontend:
  - Plain HTML/CSS/JavaScript
  - Main files:
    - `app/static/index.html`
    - `app/static/styles.css`
    - `app/static/app.js`
- Backend:
  - FastAPI
  - Main file:
    - `app/main.py`
- OCR processing integration:
  - `app/processing.py`
  - `ocr_preprocess.py`

Current web UI includes:
- Left sidebar navigation
- Top header
- Drag-and-drop PDF upload area
- Processing options form
- Uploaded file list with status and progress
- Original and processed image compare view
- Processed page card grid
- Processing log panel
- Per-image download
- ZIP download

How to run locally:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open in browser:

```text
http://127.0.0.1:8000
```

---

## Backend API Requirements

Create clear API endpoints.

Suggested endpoints:

### Upload PDF

`POST /api/upload`

Purpose:
Upload PDF file to server.

Response example:

```json
{
  "success": true,
  "file_id": "abc123",
  "filename": "invoice.pdf",
  "pages": 5
}
```

---

## GitHub Repository

GitHub: https://github.com/natthawut-s-gif/WedDocTo.git

## How to Push Code to GitHub

If this folder is not yet a Git repository, run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/natthawut-s-gif/WedDocTo.git
git push -u origin main
```

For the next updates, run:

```bash
git add .
git commit -m "update code"
git push
```
