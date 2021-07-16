const Nightmare = require("nightmare"),
      config = require("./config.js"),
      fs = require("fs"),
      {titleCase} = require("d3plus-text");

const dir = "./exports";
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const browser = new Nightmare({show: false})
  .viewport(1100, 800);

function scrape(urls) {

  const [fullUrl, profileUrl] = urls;

  const filename = fullUrl
    .replace(/^[a-zA-Z]{3,5}\:\/{2}[a-zA-Z0-9_.:-]+\//, "")
    .replace(/\/$/, "")
    .replace(/\//g, "-")
    .replace(/^[a-z]{2}\-/, "");

  return browser
    .goto(fullUrl)
    .wait("svg.d3plus-viz")
    .evaluate((filename, url, profileUrl, done) => {

      const viz = document.querySelector("svg.d3plus-viz");
      const title = document.querySelector("h1.title")
        .innerText.toLowerCase()
        .replace("what does ", "")
        .replace("?", "")
        .replace(/([eximp]{2}port)/, "Product $1s");

      const sources = [
        {
          topic: "International",
          table: "HS6 REV. 1992 (1995 - 2019)",
          subtopic: "Trade",
          dataset_link: "http://www.cepii.fr/CEPII/en/bdd_modele/presentation.asp?id=37",
          source_name: "BACI",
          source_description: "Product Trade by Year and Country (HS 6-digit depth)",
          dataset_name: "HS6 REV. 1992 (1995 - 2019)"
        }
      ];

      const legend = [];

      // viz specific
      const key = document.querySelector("g.d3plus-viz-legend");
      if (key) {

        const height = parseFloat(viz.getAttribute("height"), 10) - key.getBoundingClientRect().height - 5;
        viz.setAttribute("height", `${height}px`);
        viz.style.height = `${height}px`;

        key.querySelectorAll("rect.d3plus-Shape")
          .forEach(elem => {
            const color = elem.getAttribute("fill");
            const label = elem.getAttribute("aria-label");
            if (label && color) legend.push({color, label});
          });
        key.remove();

      }
      viz.querySelector("title").remove();
      viz.querySelector("desc").remove();
      viz.querySelector(".d3plus-viz-back").remove();
      viz.querySelector(".d3plus-viz-title").remove();
      viz.querySelector("g.d3plus-Rect-image").remove();
      viz.querySelector("g.d3plus-Rect-hover").remove();
      viz.querySelector("g.d3plus-Rect-active").remove();
      viz.querySelectorAll("clipPath").forEach(el => el.remove());
      viz.querySelectorAll("defs").forEach(el => el.remove());

      function recursiveFormat(node) {

        if (!node.tagName) return;

        const style = window.getComputedStyle(node);

        if (node.tagName.toLowerCase() === "svg") {
          node.setAttribute("xmlns", "http://www.w3.org/2000/svg");
          node.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
          node.style.backgroundColor = null;
        }

        if (node.getAttribute("font-size")) {
          const fontSize = Math.floor(parseFloat(node.getAttribute("font-size"), 10) * 0.9);
          node.setAttribute("font-family", `${fontSize}px`);
          node.style.fontSize = `${fontSize}px`;
        }
        if (node.getAttribute("font-family")) {
          node.setAttribute("font-family", "Noto Sans, sans-serif");
          node.style.fontFamily = "Noto Sans, sans-serif";
        }

        const removals = ["clip-path", "vector-effect"];
        removals.forEach(r => {
          if (node.getAttribute(r)) node.removeAttribute(r);
        });

        if (node.getAttribute("opacity")) node.setAttribute("opacity", 1);
        if (node.getAttribute("stroke-opacity")) node.setAttribute("stroke-opacity", 1);

        const strokeWidth = node.getAttribute("stroke-width");
        node.setAttribute("stroke-width", !strokeWidth ? 0 : strokeWidth);
        if (!strokeWidth) node.setAttribute("stroke", "transparent");

        let fill = node.getAttribute("fill");
        if (fill !== style.fill) {
          fill = style.fill;
          node.setAttribute("fill", style.fill);
        }

        // sets "fill-opacity" attribute to `0` if fill is "transparent" or "none"
        const transparent = ["none", "transparent"].includes(fill);
        const fillOpacity = node.getAttribute("fill-opacity");
        if (transparent) node.setAttribute("fill-opacity", transparent ? 0 : fillOpacity);

        if (node.getAttribute("aria-label")) {
          node.setAttribute("aria-label", node.getAttribute("aria-label")
            .replace(/\&/g, "&amp;")
            .replace(/\</g, "&lt;")
            .replace(/\>/g, "&gt;")
            .replace(/\"/g, "&quot;")
          );
        }

        const transform = style.textTransform;
        if (transform) {
          if (transform === "uppercase") node.innerText = node.innerText.toUpperCase();
          else if (transform === "lowercase") node.innerText = node.innerText.toLowerCase();
          else node.style.textTransform = null;
        }

        Array.from(node.childNodes).map(recursiveFormat);

      }

      recursiveFormat(viz);

      done(null, {filename, legend, sources, title, url, link: profileUrl, viz: viz.outerHTML});

    }, filename, fullUrl, profileUrl)
    .then(data => {

      data.title = titleCase(data.title);

      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(data.title);

      const contents = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">

${data.viz
    .replace(/\>\</g, ">\n<")
    .replace(/transform="\n\s{1,}([^\n]{1,})\n\s{1,}([^\n]{1,})\n\s{1,}([^\"]{1,})/g, "transform=\"$1$2$3")
    .replace(/\s([a-z\-]{2,}\=\"[^\"]{1,}\")/g, "\n  $1")}`;

      delete data.viz;

      fs.writeFileSync(`${dir}/${data.filename}.svg`, contents);
      fs.writeFileSync(`${dir}/${data.filename}.js`, `module.exports = ${JSON.stringify(data)}`);

      const today = new Date();
      let dd = today.getDate();
      let mm = today.getMonth() + 1;
      const yyyy = today.getFullYear();
      if (dd < 10) dd = `0${dd}`;
      if (mm < 10) mm = `0${mm}`;
      const date = `${yyyy}-${mm}-${dd}`;
      const meta = `=={{int:filedesc}}==
{{Information
|description={{en|1=${data.title}}}
${data.legend.map(d => `{{legend|${d.color}|${d.label}}}`).join("\n")}
|date=${date}
|source=*Interactive Visualization: [${data.link || data.url} OEC - ${data.title}]
${data.sources.map((d, i) => `${i ? "\n" : ""}*Data Source: [${d.dataset_link} ${d.source_name} - ${d.dataset_name}]`)}
|author=[http://datawheel.us/ Datawheel]
|permission=
|other versions=
}}

{{ValidSVG}}

=={{int:license-header}}==
{{OEC license}}

[[Category:Media contributed by OEC]]
`;
      fs.writeFileSync(`${dir}/${data.filename}.txt`, meta);
    })
    .catch(e => {
      console.log("");
      console.error("Failed:", fullUrl);
      console.log(e);
    });

}

function scrapeNext(index) {
  process.stdout.write(`\nScraping ${index + 1} of ${config.urls.length}`);
  scrape(config.urls[index])
    .then(() => {
      if (index < config.urls.length - 1) scrapeNext(index + 1);
      else {
        console.log("\n");
        browser.end();
        process.exit(0);
      }
    });
}
scrapeNext(0);
