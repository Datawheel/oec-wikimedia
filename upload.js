const Bot = require("nodemw"),
      client = new Bot({
        protocol: "https",
        server: "commons.wikimedia.org",
        path: "/w",
        debug: false,
        username: process.env.WIKI_USERNAME,
        password: process.env.WIKI_PASSWORD,
        userAgent: "OEC Uploader (https://oec.world; support@oec.world)"
      }),
      fs = require("fs");

let total;

function upload(files) {

  const fileName = files.pop();
  process.stdout.write(`\nUploading ${total - files.length} of ${total}`);
  const {title} = require(fileName.replace("svg", "js"));

  function deleteFiles(fileName) {
    fs.unlink(fileName, () => {});
    fs.unlink(fileName.replace("svg", "js"), () => {});
    fs.unlink(fileName.replace("svg", "txt"), () => {});
  }

  function next() {

    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(title);

    if (files.length) {
      setTimeout(() => upload(files), 7500);
    }
    else {
      console.log("\n\ndone!");
      process.exit(0);
    }
  }

  fs.readFile(fileName, "utf8", (err, svg) => {
    if (err) {
      console.log("\nSVG readFile:");
      console.error(err);
      next(title);
    }
    else {

      fs.readFile(fileName.replace("svg", "txt"), "utf8", (err, txt) => {
        if (err) {
          console.log("\nTXT readFile:");
          console.error(err);
          next(title);
        }
        else {
          client.upload(title, svg, "updates SVG", err => {
            if (err && err.message.includes("duplicate")) {
              deleteFiles(fileName);
              next(title);
            }
            else if (err) {
              console.log("\nSVG upload:");
              console.error(err);
              next(title);
            }
            else {
              client.edit(`File:${title}.svg`, txt, "updates description", err => {
                if (err) {
                  console.log("\nTXT edit:");
                  console.error(err);
                }
                else {
                  deleteFiles(fileName);
                }
                next(title);
              });
            }
          });
        }
      });

    }
  });

}

client.logIn(err => {
  if (err) throw err;
  fs.readdir("./exports", (err, files) => {
    if (err) throw err;
    files = files.filter(file => file.includes(".svg"))
      .sort((a, b) => b.localeCompare(a))
      .map(file => `./exports/${file}`);
    total = files.length;
    upload(files);
  });
});
