const vision = require('@google-cloud/vision');
const fs = require('fs/promises');
const path = require('path');

// Initialize client with your credentials
const client = new vision.ImageAnnotatorClient({
  keyFilename: './ocr-demo-app-483112-2d4d28d7db48.json'
});

async function extractTextFromImage(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const [result] = await client.documentTextDetection(imageBuffer);
    const fullText = result.fullTextAnnotation;
    
    if (!fullText) {
      return { text: '', blocks: [] };
    }

    return {
      fullText: fullText.text,
      blocks: fullText.pages[0]?.blocks.map(block => ({
        text: block.paragraphs.map(p => 
          p.words.map(w => 
            w.symbols.map(s => s.text).join('')
          ).join(' ')
        ).join('\n'),
        confidence: block.confidence
      })) || []
    };
  } catch (error) {
    console.error(`Error processing ${imagePath}:`, error.message);
    throw error;
  }
}

function convertToCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.map(line => 
    line.split(/\s{2,}|\t/).join(',')
  ).join('\n');
}

async function processImagesInFolder(folderPath, outputFolder) {
  try {
    await fs.mkdir(outputFolder, { recursive: true });
    const files = await fs.readdir(folderPath);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file)
    );

    console.log(`Found ${imageFiles.length} images\n`);
    const results = [];

    for (const file of imageFiles) {
      const imagePath = path.join(folderPath, file);
      console.log(`Processing: ${file}`);

      const ocrData = await extractTextFromImage(imagePath);
      const baseName = path.parse(file).name;
      
      // Save JSON
      await fs.writeFile(
        path.join(outputFolder, `${baseName}.json`),
        JSON.stringify(ocrData, null, 2)
      );

      // Save CSV
      const csvData = convertToCSV(ocrData.fullText);
      await fs.writeFile(
        path.join(outputFolder, `${baseName}.csv`),
        csvData
      );

      results.push({
        fileName: file,
        textLength: ocrData.fullText.length,
        status: 'success'
      });

      console.log(`✓ Completed: ${baseName}\n`);
    }

    await fs.writeFile(
      path.join(outputFolder, 'summary.json'),
      JSON.stringify(results, null, 2)
    );
    
    console.log(`\nProcessed ${results.length} images successfully!`);
    return results;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Run
processImagesInFolder('./images', './output')
  .then(() => console.log('Done!'))
  .catch(err => console.error('Fatal error:', err));
