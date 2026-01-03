const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
const fs = require('fs/promises');
const path = require('path');

// Initialize Document AI client
const client = new DocumentProcessorServiceClient({
  keyFilename: './ocr-demo-app-483112-2d4d28d7db48.json'
});

// You need to create a processor first - see setup steps below
const projectId = 'ocr-demo-app-483112';
const location = 'us'; // or 'eu'
const processorId = '6e542c92ddac3026'; // Get this after creating processor

const processorName = `projects/${projectId}/locations/${location}/processors/${processorId}`;

async function processDocument(imagePath) {
  try {
    const imageFile = await fs.readFile(imagePath);
    const encodedImage = Buffer.from(imageFile).toString('base64');

    const request = {
      name: processorName,
      rawDocument: {
        content: encodedImage,
        mimeType: 'image/png', // or 'image/jpeg'
      },
    };

    const [result] = await client.processDocument(request);
    const { document } = result;

    return {
      text: document.text,
      tables: extractTables(document),
      entities: document.entities || []
    };
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

function extractTables(document) {
  if (!document.pages || document.pages.length === 0) return [];

  const tables = [];
  
  for (const page of document.pages) {
    if (!page.tables) continue;

    for (const table of page.tables) {
      const tableData = {
        rows: [],
        rowCount: table.bodyRows?.length || 0,
        columnCount: table.headerRows?.[0]?.cells?.length || 0
      };

      // Extract header rows
      if (table.headerRows) {
        for (const row of table.headerRows) {
          const rowData = row.cells.map(cell => getText(cell.layout, document.text));
          tableData.rows.push(rowData);
        }
      }

      // Extract body rows
      if (table.bodyRows) {
        for (const row of table.bodyRows) {
          const rowData = row.cells.map(cell => getText(cell.layout, document.text));
          tableData.rows.push(rowData);
        }
      }

      tables.push(tableData);
    }
  }

  return tables;
}

function getText(layout, fullText) {
  if (!layout || !layout.textAnchor) return '';
  
  const textSegments = layout.textAnchor.textSegments || [];
  return textSegments
    .map(segment => {
      const startIndex = parseInt(segment.startIndex) || 0;
      const endIndex = parseInt(segment.endIndex) || fullText.length;
      return fullText.substring(startIndex, endIndex);
    })
    .join('')
    .trim();
}

function convertTableToCSV(tableData) {
  return tableData.rows
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

async function processImagesInFolder(folderPath, outputFolder) {
  try {
    await fs.mkdir(outputFolder, { recursive: true });
    const files = await fs.readdir(folderPath);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|bmp|webp|pdf)$/i.test(file)
    );

    console.log(`Found ${imageFiles.length} files\n`);

    for (const file of imageFiles) {
      const imagePath = path.join(folderPath, file);
      console.log(`Processing: ${file}`);

      const result = await processDocument(imagePath);
      const baseName = path.parse(file).name;

      // Save full JSON
      await fs.writeFile(
        path.join(outputFolder, `${baseName}_full.json`),
        JSON.stringify(result, null, 2)
      );

      // Save each table as CSV
      result.tables.forEach((table, idx) => {
        const csv = convertTableToCSV(table);
        fs.writeFile(
          path.join(outputFolder, `${baseName}_table_${idx + 1}.csv`),
          csv
        );
      });

      console.log(`✓ Extracted ${result.tables.length} table(s)\n`);
    }

    console.log('All files processed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run
processImagesInFolder('./images', './output');