# oec-wikimedia

Must install the Google Font "Noto Sans" before proceeding.

Local configuration needs to be stored in `config.js` file with the following structure:

```js
module.exports = {
  urls: [
    [
      "/en/visualize/embed/tree_map/hs92/export/chn/all/show/2019/",
      "https://oec.world/en/profile/country/chn"
    ],
    [
      "/en/visualize/embed/tree_map/hs92/export/usa/all/show/2019/",
      "https://oec.world/en/profile/country/chn"
    ]
  ]
};
```

## Scripts

`npm run scrape` - references the "urls" array from the config and creates SVGs and meta TXT files in an "exports/" folder.
