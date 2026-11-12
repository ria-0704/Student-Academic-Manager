const pdfParse = require('pdf-parse');
const officeParser = require('officeparser');

/**
 * Extract text from a PPT or PPTX file using officeparser.
 */
async function extractFromPPT(buffer) {
  const document = await officeParser.parseOffice(buffer);
  return document.to('text');
}

/**
 * Extract text from any supported file type.
 * Returns extracted text string or throws on failure.
 */
async function extractText(buffer, fileType) {
  const type = fileType.toLowerCase();
  if (type === 'pdf') {
    const data = await pdfParse(buffer);
    return data.text || '';
  } else if (type === 'ppt' || type === 'pptx') {
    return await extractFromPPT(buffer);
  }
  throw new Error(`Unsupported file type: ${fileType}`);
}

module.exports = { extractText };
