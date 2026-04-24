/* eslint-disable no-undef */
const fs = require('fs')
const path = require('path')
const pdf = require('pdf-parse')

async function extract() {
  try {
    const inPath = path.resolve(__dirname, '..', 'imported_code', 'Final Project I Module (First Draft).pdf')
    const outPath = path.resolve(__dirname, '..', 'imported_code', 'project_doc.txt')

    if (!fs.existsSync(inPath)) {
      console.error('Input PDF not found at', inPath)
      process.exit(2)
    }

    const dataBuffer = fs.readFileSync(inPath)
    const data = await pdf(dataBuffer)

    fs.writeFileSync(outPath, data.text, 'utf8')
    console.log('PDF text extracted to', outPath)
  } catch (err) {
    console.error('Failed to extract PDF text:', err)
    process.exit(1)
  }
}

extract()
