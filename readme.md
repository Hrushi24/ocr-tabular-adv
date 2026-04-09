# OCR Image Batch Processor (JSON/CSV Export)

An open-source Node.js project for extracting text from image files using **Google Cloud Vision OCR** and exporting results into structured **JSON** and **CSV** formats.

## Why this project is useful

- Batch-processes all images in a folder
- Extracts OCR text with confidence metadata
- Saves machine-readable JSON output per image
- Converts extracted content to CSV for tabular workflows
- Creates a processing summary report

This is useful for invoices, receipts, reports, scanned forms, and other document-processing pipelines.

## Tech stack

- Node.js (CommonJS)
- `@google-cloud/vision`
- `dotenv`

## Project structure

```text
.
├── images/          # Input images
├── output/          # Generated JSON/CSV + summary
├── index.js         # Main OCR pipeline
└── package.json
```

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up Google Cloud Vision credentials (service account JSON).
3. In `index.js`, update the `keyFilename` value in the `ImageAnnotatorClient` configuration (near the top of the file) so it points to your Google service-account JSON file.
4. Add input images to `images/`.
5. Run the project:
   ```bash
   node index.js
   ```

## Output

For each image in `images/`, the app writes:

- `<image-name>.json` (OCR text and block confidence)
- `<image-name>.csv` (simple tabular conversion)

It also writes:

- `summary.json` (processing status summary)

## Open-source status

This project is open source and intended for public use, experimentation, and extension. Contributions and improvements are welcome.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

## License

ISC (as defined in `package.json`).
