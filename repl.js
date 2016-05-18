/* jshint esversion: 6 */

let fs = require("fs");
let load = require("require-reload")(require);
let CSV;

// Bootstrap data
let data = {
  csv: {},
  json: {}
};
let path = (dataset, format) => `./datasets/${format}/${dataset}.${format}`;
let readFile = (dataset, format) => (err, file) => {
  if (err) throw err;
  data[format][dataset] = format === "json" ? JSON.parse(file) : file;
};
for (let dataset of ["worldbank", "marriage_census", "malformed"]) {
  for (let format of ["csv", "json"]) {
    fs.readFile(path(dataset, format), "utf8", readFile(dataset, format));
  }
}

// Setup the export
let reload = () => load("./csv.src");
CSV = reload(); // Run it once

module.exports = {CSV, reload, data};

