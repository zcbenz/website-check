import fs from 'fs'
import util from 'util'
import sender from 'gmail-send'

import {monitor} from './check.js'

if (process.argv.length != 3) {
  console.error('Usage: website-check /path/to/config.json')
  process.exit(1)
}

const config = JSON.parse(fs.readFileSync(process.argv[2]))
if (!config.gmail)
  console.warn('Warn: specify "gmail" to send emails')
if (!config.websites) {
  console.error('Error: specify "websites" to monitor')
  process.exit(2)
}

const sendMail = config.gmail ? sender(config.gmail) : null

const sleep = util.promisify(setTimeout)
for (const item of config.websites) {
  await sleep(1000)
  startChecking(item)
}

function startChecking(item) {
  if (!item.url || !item.interval)
    throw new Error('Must specify url and interval')
  item.staus = 'wait'
  monitor(item, (error, text) => {
    if (error) {
      item.status = 'error'
      if (error.message != item.error?.message) {
        item.error = error
        notifyChange(item)
      }
    } else {
      item.status = 'trigger'
      notifyChange(item)
    }
  })
}

function notifyChange(item) {
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
