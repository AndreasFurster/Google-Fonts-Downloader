require('dotenv').config()

const Axios = require('axios')
const Path = require('path')
const Fs = require('fs')
const pThrottle = require('p-throttle');

const apiKey = process.env.GOOGLE_API_KEY;
const downloadAmount = process.env.DOWNLOAD_AMOUND;

// Every 30s download a max of 100 files
const throttle = pThrottle({
	limit: 100,
	interval: 30000
});

const now = Date.now();

const throttled = throttle(index => {
	const secDiff = ((Date.now() - now) / 1000).toFixed();
	return Promise.resolve(`${index}: ${secDiff}s`);
});


async function download() {
  if (!apiKey) {
    console.error('GOOGLE_API_KEY key not found in .env file!')
    return
  }

  try {
    await makeFontsDir()
    let response = await Axios.get(`https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=${apiKey}`)
    let items = response.data.items;
    let fontsToDownload = Math.min(items.length, downloadAmount || items.length)
    
    let totalFontFileCount = 0;
    let currentFontFileCount = 0;

    // For each font (or top n fonts)
    for (let i = 0; i < fontsToDownload; i++) {
      const font = items[i];
      const family = font.family

      // For each file
      for (const [variant, url] of Object.entries(font.files)) {
        totalFontFileCount += 1;

        const promise = () => downloadFont(url, family, variant)
          .then(() => console.log(`Finished ${currentFontFileCount++}/${totalFontFileCount}`))
          .catch(e => console.log(`Could not download ${family}/${variant}`));

        throttled(totalFontFileCount).then(promise)
      }
    }

    console.log(`Downloading ${promises.length} font files from ${fontsToDownload} families... Estimated download size: ${promises.length * 0.3} MB.`);
  } catch (error) {
    console.log(error);
  }
}

async function makeFontsDir() {
  const path = Path.resolve(__dirname, 'fonts')
  return new Promise((resolve) => Fs.mkdir(path, resolve))
}

async function downloadFont(url, family, variant) {
  const path = Path.resolve(__dirname, 'fonts', `${family} - ${variant}.ttf`)
  const writer = Fs.createWriteStream(path)

  const response = await Axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

download()