const fs = require('fs')
const path = require('path')

const DATA_DIR = path.resolve(__dirname, '..', 'data', 'markets')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

// Basic CSV-like mapping of a few countries to seeds
const seeds = {
  ET: [
    { name: 'Maize', price: 2450, change: 5, unit: 'per quintal' },
    { name: 'Wheat', price: 3100, change: 2, unit: 'per quintal' },
    { name: 'Teff', price: 5200, change: -3, unit: 'per quintal' }
  ],
  US: [
    { name: 'Corn', price: 180, change: 1, unit: 'per bushel' },
    { name: 'Wheat', price: 700, change: -2, unit: 'per bushel' },
    { name: 'Soybeans', price: 1200, change: 3, unit: 'per bushel' }
  ]
}

const countries = process.argv.slice(2)
if (!countries.length) {
  console.log('Usage: node generate-market-seed.js ET US ET-AB ...')
  process.exit(1)
}

countries.forEach(c => {
  const code = String(c).toUpperCase().replace(/[^A-Z0-9]/g, '_')
  const data = seeds[code] || [ { name: 'Sample', price: 100, change: 0, unit: 'unit' } ]
  fs.writeFileSync(path.join(DATA_DIR, `${code}.json`), JSON.stringify(data, null, 2))
  console.log('wrote', `${code}.json`)
})
