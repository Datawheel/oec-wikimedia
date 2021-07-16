const axios = require("axios"),
      d3 = require("d3-array"),
      fs = require("fs");

const urls = [];

const embeds = [
  // "https://oec.world/en/visualize/embed/tree_map/hs92/export/{{memberSlug}}/all/show/2019/", // product exports by country
  "https://oec.world/en/visualize/embed/tree_map/{{slug}}/export/{{memberSlug}}/all/show/2020/" // product exports by subnat
];

// const countries = axios.get("https://oec.world/api/profilesearch?profile=1&limit=10000")
//   .then(resp => resp.data)
//   .then(data => data.grouped.map(d => d[0]));

const regionals = axios.get("https://oec.world/api/profilesearch?profile=38&limit=10000")
  .then(resp => resp.data)
  .then(data => data.grouped.map(d => d[0]));

Promise.all([regionals])
  .then(data => {
    const locations = d3.merge(data);
    embeds
      .forEach(embed => {
        locations
          // .slice(0, 1)
          // .filter(d => ["twn"].includes(d.memberSlug))
          .forEach(({memberSlug, slug}) => {
            urls.push([
              embed.replace("{{memberSlug}}", memberSlug).replace("{{slug}}", slug),
              `https://oec.world/en/profile/${slug}/${memberSlug}`
            ]);
          });
      });
    console.log(urls);
    fs.writeFileSync("config.js", `module.exports = ${JSON.stringify({urls}, null, 2)};\n`);
  });
