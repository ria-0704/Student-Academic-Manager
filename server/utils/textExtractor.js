const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const officeParser = require('officeparser');

/**
 * Extract text from a PDF file.
 */
async function extractFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text || '';
}

/**
 * Extract text from a PPT or PPTX file using officeparser.
 */
async function extractFromPPT(filePath) {
  return new Promise((resolve, reject) => {
    officeParser.parseOffice(filePath, function(data, err) {
      if (err) {
        reject(err);
      } else {
        resolve(data || '');
      }
    });
  });
}

/**
 * Extract text from any supported file type.
 * Returns extracted text string or throws on failure.
 */
async function extractText(filePath, fileType) {
  const type = fileType.toLowerCase();
  if (type === 'pdf') {
    return await extractFromPDF(filePath);
  } else if (type === 'ppt' || type === 'pptx') {
    return await extractFromPPT(filePath);
  }
  throw new Error(`Unsupported file type: ${fileType}`);
}

module.exports = { extractText };
