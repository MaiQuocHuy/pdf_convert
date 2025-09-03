const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 1234;

// Middleware to parse JSON bodies (with larger limit for HTML content)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "HTML to PDF server is running",
    endpoints: {
      "html-to-pdf": "POST /html-to-pdf - Convert HTML content to PDF",
      health: "GET / - Health check",
      test: "GET /test-pdf - Generate test PDF",
    },
  });
});

// Helper function to generate PDF with retry logic
async function generatePDF(html, options = {}, maxRetries = 2) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let browser = null;
    let page = null;

    try {
      console.log(`PDF generation attempt ${attempt}/${maxRetries}`);

      // Launch browser with minimal settings for better stability
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
        timeout: 60000,
      });

      page = await browser.newPage();

      console.log("Setting page content...");

      // Set content with simpler wait condition
      await page.setContent(html, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });

      // Wait a bit for any dynamic content
      //   await page.waitForTimeout(1000);
      await delay(2000); // wait 2 seconds between retries

      console.log("Generating PDF...");

      // Default PDF options
      const pdfOptions = {
        format: "A4",
        printBackground: true,
        margin: {
          top: "1cm",
          right: "1cm",
          bottom: "1cm",
          left: "1cm",
        },
        timeout: 30000,
        ...options,
      };

      // Generate PDF with timeout
      const pdf = await page.pdf(pdfOptions);

      console.log(`PDF generated successfully (${pdf.length} bytes)`);

      return pdf;
    } catch (error) {
      lastError = error;
      console.error(`PDF generation attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retry
      console.log(`Waiting before retry attempt ${attempt + 1}...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } finally {
      // Always close page and browser
      if (page) {
        try {
          if (!page.isClosed()) {
            await page.close();
          }
        } catch (closeError) {
          console.warn("Error closing page:", closeError.message);
        }
      }

      if (browser) {
        try {
          await browser.close();
        } catch (browserCloseError) {
          console.warn("Error closing browser:", browserCloseError.message);
        }
      }
    }
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// HTML to PDF endpoint
app.post("/html-to-pdf", async (req, res) => {
  try {
    const { html, options = {} } = req.body;

    if (!html) {
      return res.status(400).json({
        error: "HTML content is required",
        usage:
          'POST /html-to-pdf with { "html": "<html>...</html>", "options": {...} }',
        availableOptions: {
          format: "A4, A3, A2, A1, A0, Letter, Legal, Tabloid, Ledger",
          width: "CSS width (e.g., '210mm', '8.5in')",
          height: "CSS height (e.g., '297mm', '11in')",
          margin: "Object with top, right, bottom, left margins",
          displayHeaderFooter: "Boolean to show header/footer",
          headerTemplate: "HTML template for header",
          footerTemplate: "HTML template for footer",
          printBackground: "Boolean to include background graphics",
          landscape: "Boolean for landscape orientation",
          pageRanges: "String of page ranges (e.g., '1-3, 5')",
          scale: "Number between 0.1 and 2",
        },
      });
    }

    console.log(`Converting HTML to PDF (${html.length} characters)`);

    const pdf = await generatePDF(html, options);

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="document.pdf"');
    res.setHeader("Content-Length", pdf.length);

    // Send PDF as response
    res.send(pdf);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      error: "Failed to generate PDF",
      details: error.message,
    });
  }
});

// GET endpoint for testing with simple HTML
app.get("/test-pdf", async (req, res) => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Test PDF</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            p { line-height: 1.6; }
            .highlight { background-color: yellow; }
        </style>
    </head>
    <body>
        <h1>Test PDF Document</h1>
        <p>This is a <span class="highlight">test PDF</span> generated from HTML content.</p>
        <p>Current time: ${new Date().toISOString()}</p>
        <ul>
            <li>First item</li>
            <li>Second item</li>
            <li>Third item</li>
        </ul>
    </body>
    </html>
  `;

  try {
    console.log("Generating test PDF");

    const pdf = await generatePDF(sampleHtml);

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="test-document.pdf"'
    );
    res.setHeader("Content-Length", pdf.length);

    // Send PDF as response
    res.send(pdf);
  } catch (error) {
    console.error("Test PDF error:", error);
    res.status(500).json({
      error: "Failed to generate test PDF",
      details: error.message,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    details: error.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    available: ["GET /", "POST /html-to-pdf", "GET /test-pdf"],
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`HTML to PDF server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
  console.log(`PDF API: POST http://localhost:${PORT}/html-to-pdf`);
  console.log(`Test PDF: GET http://localhost:${PORT}/test-pdf`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});
