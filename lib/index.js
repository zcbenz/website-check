import fs from 'fs'
import util from 'util'
import sender from 'gmail-send'

import {monitor} from './check.js'

const sleep = util.promisify(setTimeout)

if (process.argv.length != 3) {
  console.error('Usage: website-check /path/to/config.json')
  process.exit(1)
}
main(process.argv[2])

function main(configPath) {
  const controller = new AbortController()
  const signal = controller.signal
  try {
    startChecking(JSON.parse(fs.readFileSync(configPath)), signal)
  } catch (e) {
    console.error('Error:', e.message)
  }
  fs.watch(configPath, {signal}, () => {
    console.log('Config file changed')
    controller.abort()
    // Restart after 1s as some editor does multiple changes for one save.
    setTimeout(() => { main(configPath) }, 1000)
  })
}

async function startChecking(config, signal) {
  if (!config.gmail)
    console.warn('Warn: specify "gmail" to send emails')
  if (!config.websites)
    throw new Error('Specify "websites" to monitor')

  const sendMail = config.gmail ? sender(config.gmail) : null
  for (const item of config.websites) {
    await sleep(1000)
    startCheckingItem(item, {signal, sendMail})
  }
}

function startCheckingItem(item, options) {
  if (!item.url || !item.interval)
    throw new Error('Must specify url and interval')
  item.staus = 'wait'
  monitor(item, options.signal, (error, text) => {
    if (error) {
      if (error.name == 'AbortError')
        return
      item.status = 'error'
      if (error.message != item.error?.message) {
        item.error = error
        notifyChange(item, options)
      }
    } else {
      item.status = 'trigger'
      notifyChange(item, options)
    }
  })
}

function notifyChange(item, {sendMail}) {
  const title = item.name ? item.name : item.url
  console.log('Notify:', title, item.status, item.error)
  if (!sendMail)
    return
  sendMail({
    subject: `${title} Updated`,
    text: item.url
  }, (error) => {
    if (error)
      console.error('Error:', 'Failed to send mail', error)
  })
}
