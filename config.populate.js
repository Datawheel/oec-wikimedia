const axios = require("axios"),
      d3 = require("d3-array"),
      fs = require("fs");

const prefix = process.env.DOMAIN || "https://oec.world";

const embeds = [
  // "/en/visualize/embed/tree_map/hs92/export/{{memberSlug}}/all/show/2019/", // product exports by country
  "/en/visualize/embed/tree_map/{{slug}}/export/{{id}}/all/show/2020/" // product exports by subnat
];

// const searchURL = "api/profilesearch?profile=1&limit=10000"; // countries
const searchURL = "api/profilesearch?profile=38&limit=10000"; // regional

const profiles = axios.get(new URL(searchURL, prefix).href)
  .then(resp => resp.data)
  .then(data => data.grouped.map(d => d[0]));

Promise.all([profiles])
  .then(data => {
    const locations = d3.merge(data);
    const urls = [];
    embeds
      .forEach(embed => {
        locations
          // .slice(0, 1)
          // .filter(d => ["twn"].includes(d.memberSlug))
          .forEach(({id, memberSlug, slug}) => {
            const embedSlug = slug.replace(/^(subnational_[a-z]{3})_.*$/g, "$1");
            urls.push([
              embed.replace("{{memberSlug}}", memberSlug).replace("{{slug}}", embedSlug).replace("{{id}}", id),
              `https://oec.world/en/profile/${slug}/${memberSlug}`
            ]);
          });
      });
    console.log(`${urls.length} URLs populated\n`);
    fs.writeFileSync("config.js", `module.exports = ${JSON.stringify({urls}, null, 2)};\n`);
    process.exit(0);
  });
