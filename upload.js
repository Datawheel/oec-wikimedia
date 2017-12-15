const Bot = require("nodemw"),
      client = new Bot({
        protocol: "https",
        server: "commons.wikimedia.org",
        path: "/w",
        debug: true,
        username: "dave-landry-datawheel",
        password: "Qg7-kTW-6Z2-pw5",
        userAgent: "DataUSA Uploader (https://datausa.io; hello@datausa.io)"
      }),
      fs = require("fs");

function upload(files) {

  const fileName = files.pop();
  const {title} = require(fileName.replace("svg", "js"));
  fs.readFile(fileName, "utf8", (err, svg) => {
    if (err) throw err;
    fs.readFile(fileName.replace("svg", "txt"), "utf8", (err, txt) => {
      if (err) throw err;
      client.getArticle(`File:${title}.svg`, (err, data) => {
        if (err) throw err;
        if (data && data.trim() === txt.trim()) {
          console.log(`matched: ${title}`);
          if (files.length) upload(files);
          else console.log("done!");
        }
        else {
          client.upload(title, svg, "Initial Upload", () => {
            client.edit(`File:${title}.svg`, txt, "Adding a file description", () => {
              console.log(`uploaded: ${title}`);
              if (files.length) upload(files);
              else console.log("done!");
            });
          });
        }
      });
    });
  });

}

client.logIn(err => {
  if (err) throw err;
  fs.readdir("./exports", (err, files) => {
    if (err) throw err;
    upload(files.filter(file => file.includes(".svg")).map(file => `./exports/${file}`));
  });
});