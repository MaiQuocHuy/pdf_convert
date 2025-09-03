# HTML to PDF Server

A Node.js server that uses Puppeteer to convert HTML content to PDF documents.

## Features

- HTTP server running on port 1234
- HTML to PDF conversion with Puppeteer
- Configurable PDF options (format, margins, orientation, etc.)
- Support for CSS styling and custom fonts
- Binary PDF response for direct download
- Docker containerization support
- Health check endpoint

### Health Check

```
GET /
```

Returns server status and available endpoints.

### HTML to PDF Conversion

#### POST Method

```
POST /html-to-pdf
Content-Type: application/json

{
  "html": "<html><body><h1>Hello World</h1></body></html>",
  "options": {
    "format": "A4",
    "margin": {
      "top": "1cm",
      "right": "1cm",
      "bottom": "1cm",
      "left": "1cm"
    },
    "printBackground": true,
    "landscape": false
  }
}
```

#### Available PDF Options

- `format`: Paper format (A4, A3, A2, A1, A0, Letter, Legal, Tabloid, Ledger)
- `width`/`height`: Custom dimensions (e.g., '210mm', '8.5in')
- `margin`: Object with top, right, bottom, left margins
- `displayHeaderFooter`: Boolean to show header/footer
- `headerTemplate`: HTML template for header
- `footerTemplate`: HTML template for footer
- `printBackground`: Boolean to include background graphics
- `landscape`: Boolean for landscape orientation
- `pageRanges`: String of page ranges (e.g., '1-3, 5')
- `scale`: Number between 0.1 and 2

#### Test Endpoint

```
GET /test-pdf
```

Generates a test PDF with sample content for testing purposes.

### Response Format

The server returns a binary PDF file with appropriate headers:

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="document.pdf"`

## Running Locally

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

3. Test the server:

```bash
curl -X POST http://localhost:1234/html-to-pdf \
  -H "Content-Type: application/json" \
  -d '{"html": "<html><body><h1>Hello World</h1><p>This is a test PDF.</p></body></html>"}'
```

Or test with the simple endpoint:

```bash
curl http://localhost:1234/test-pdf --output test.pdf
```

## Running with Docker

1. Build the Docker image:

```bash
docker build -t html-to-pdf-server .
```

2. Run the container:

```bash
docker run -p 1234:1234 html-to-pdf-server
```

3. Test the containerized server:

```bash
curl -X POST http://localhost:1234/html-to-pdf \
  -H "Content-Type: application/json" \
  -d '{"html": "<html><body><h1>Hello from Docker</h1></body></html>"}' \
  --output docker-test.pdf
```

## Docker Configuration

The Dockerfile includes:

- Node.js 18 Alpine base image
- Chromium browser installation
- Puppeteer dependencies
- Non-root user for security
- Health check configuration
- Optimized for production use

## Environment Variables

- `PORT`: Server port (default: 1234)
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`: Set to true in Docker
- `PUPPETEER_EXECUTABLE_PATH`: Path to Chromium in Docker

## Example HTML Content

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>My Document</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 20px;
        line-height: 1.6;
      }
      h1 {
        color: #333;
        border-bottom: 2px solid #007acc;
        padding-bottom: 10px;
      }
      .highlight {
        background-color: #ffff99;
        padding: 2px 4px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      th,
      td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f2f2f2;
      }
    </style>
  </head>
  <body>
    <h1>My PDF Document</h1>
    <p>
      This is a <span class="highlight">sample document</span> that will be
      converted to PDF.
    </p>

    <h2>Features</h2>
    <ul>
      <li>CSS styling support</li>
      <li>Table formatting</li>
      <li>Custom fonts and colors</li>
      <li>Images and graphics</li>
    </ul>

    <table>
      <tr>
        <th>Feature</th>
        <th>Status</th>
      </tr>
      <tr>
        <td>HTML to PDF</td>
        <td>✓ Supported</td>
      </tr>
      <tr>
        <td>CSS Styling</td>
        <td>✓ Supported</td>
      </tr>
    </table>
  </body>
</html>
```

## Notes

- The server is configured to work in Docker containers with proper Chromium setup
- PDFs are returned as binary content for direct download or saving
- The server includes proper error handling and logging
- Health checks are included for container orchestration
- Supports up to 50MB HTML content size
- CSS styles and fonts are preserved in the PDF output
