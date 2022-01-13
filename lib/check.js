import fetch from 'node-fetch'
import cheerio from 'cheerio'
import intervalPromise from 'interval-promise'

export {monitor, get}

function monitor(item, callback) {
  const {url, selector, ignoreText, interval} = item
  let content = null
  const check = async () => {
    try {
      let text = await get(url, selector, ignoreText)
      if (text === null)  // this get is ignored
        return
      if (text !== content) {  // text changed
        if (content !== null)  // do not report the initial fetch
          callback(null, text)
        content = text
      }
    } catch (error) {
      callback(error)
    }
    // If first fetch was not sucessfully, mark content as empty so we will
    // know when the website is back.
    if (content === null)
      content = ''
  }
  check().finally(() => intervalPromise(check, interval))
}

async function get(url, selector, ignoreText) {
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Safari/605.1.15'
    }
  }
  let text = ''
  const fullText = await (await fetch(url, options)).text()
  if (includesIgnoreText(fullText, ignoreText))
    return null
  if (selector) {
    const $ = cheerio.load(fullText, {decodeEntities: false})
    const collection = $(selector)
    if (collection)
      text = collection.toArray().map(node => $(node).html()).join('\n')
    else  // null is returned when there is no matching
      text = ''
  } else {
    text = fullText
  }
  return text.trim()
}

function includesIgnoreText(text, ignoreText) {
  if (!ignoreText)
    return false
  if (typeof ignoreText === 'string')
    return text.includes(ignoreText)
  if (Array.isArray(ignoreText)) {
    for (const t of ignoreText) {
      if (includesIgnoreText(text, t))
        return true
    }
    return false
  }
  return false
}
