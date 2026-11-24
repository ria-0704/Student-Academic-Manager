const pdfParse = require('pdf-parse');
const officeParser = require('officeparser');
const CFB = require('cfb');

/**
 * Extract text from a PPTX file using officeparser.
 */
async function extractFromPPTX(buffer) {
  const document = await officeParser.parseOffice(buffer);
  if (typeof document === 'string') return document; // older officeparser versions
  // officeparser v8: to('text') is async and resolves to { value, messages }
  const result = await document.to('text');
  return typeof result === 'string' ? result : (result?.value || '');
}

// PowerPoint 97-2003 record types that hold slide text
const TEXT_CHARS_ATOM = 0x0FA0; // UTF-16LE text
const TEXT_BYTES_ATOM = 0x0FA8; // 8-bit (Latin-1) text
const CSTRING = 0x0FBA;         // UTF-16LE string (titles, notes etc.)

/**
 * Extract text from a legacy binary .ppt file.
 * officeparser doesn't support .ppt, so we read the "PowerPoint Document"
 * stream from the compound file and collect the text atoms.
 */
function extractFromPPT(buffer) {
  const cfb = CFB.read(buffer, { type: 'buffer' });
  const entry = CFB.find(cfb, 'PowerPoint Document');
  if (!entry || !entry.content) {
    throw new Error('Not a valid PowerPoint 97-2003 file.');
  }
  const data = Buffer.from(entry.content);
  const pieces = [];

  let pos = 0;
  while (pos + 8 <= data.length) {
    const verInst = data.readUInt16LE(pos);
    const recType = data.readUInt16LE(pos + 2);
    const recLen = data.readUInt32LE(pos + 4);
    const recVer = verInst & 0x000F;
    pos += 8;

    // Container record: step inside it (its children follow immediately)
    if (recVer === 0x0F) continue;

    if (pos + recLen > data.length) break;

    if (recType === TEXT_CHARS_ATOM || recType === CSTRING) {
      pieces.push(data.toString('utf16le', pos, pos + recLen));
    } else if (recType === TEXT_BYTES_ATOM) {
      pieces.push(data.toString('latin1', pos, pos + recLen));
    }
    pos += recLen;
  }

  // Clean up: PPT uses \r (and \v) as line breaks; drop placeholder junk and duplicates in a row
  const lines = [];
  for (const piece of pieces) {
    for (const raw of piece.split(/[\r\n\v]+/)) {
      const line = raw.replace(/[\u0000-\u0008\u000B-\u001F]/g, '').trim();
      if (!line) continue;
      if (/^(Click to edit|Click to add)/i.test(line)) continue;
      // Slide-master placeholders / internal tags
      if (/^___PPT\d+$/.test(line)) continue;
      if (/^(First|Second|Third|Fourth|Fifth) level$/i.test(line)) continue;
      if (/^[\d.]*\*$/.test(line)) continue;
      if (lines[lines.length - 1] === line) continue;
      lines.push(line);
    }
  }

  // Drop footer/header lines that repeat on many slides (e.g. copyright, book title)
  const counts = new Map();
  for (const l of lines) counts.set(l, (counts.get(l) || 0) + 1);
  const seen = new Set();
  return lines
    .filter(l => {
      if (counts.get(l) < 3) return true;
      if (seen.has(l)) return false; // keep only the first occurrence
      seen.add(l);
      return true;
    })
    .join('\n');
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
  } else if (type === 'pptx') {
    return await extractFromPPTX(buffer);
  } else if (type === 'ppt') {
    try {
      return extractFromPPT(buffer);
    } catch (err) {
      // Some files saved as .ppt are actually .pptx — try that as a fallback
      try { return await extractFromPPTX(buffer); } catch { throw err; }
    }
  }
  throw new Error(`Unsupported file type: ${fileType}`);
}

module.exports = { extractText };
