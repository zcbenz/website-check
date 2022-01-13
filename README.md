# website-check

An utility to monitor changes in websites and send emails when found.

Usage:

```sh
$ npm i -g website-check
$ website-check /path/to/config.json
```

Format of `config.json`:

```json
{
  "gmail": {
    "user": "user@gmail.com",
    "pass": "abcdefghijklmnop",
    "to": "user@gmail.com"
  },
  "websites": [
    {
      "name": "NintendoRingFit",
      "url": "https://store.nintendo.co.jp/category/STORELIMITEDGOODS/HAC_Q_AL3PA.html",
      "selector": ".item-cart-and-wish-button-area",
      "ignoreText": "大変混雑している",
      "interval": 300000
    }
  ]
}
```

* `gmail`
  * `user`: User account.
  * `pass`: Application-specific password.
  * `to`: Optional, Array or String.
* `website` Array of websites to monitor.
  * `url`: The URL to monitor.
  * `interval`: Check interval in ms.
  * `selector`: Optional, CSS selector used for filtering content.
  * `ignoreText`: Optional, Array or String, do nothing if the page contains the text.

Source code is published under public domain.
