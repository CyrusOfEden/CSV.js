let Benchmark = require('benchmark');
let fs = require("fs");

let CSV = require("./csv");

let csv = fs.readFileSync("./datasets/csv/marriage_census.csv", "utf8");
// let json = JSON.parse(fs.readFileSync("./datasets/json/marriage_census.json", "utf8"));

let options = {
    normal: { lineDelimiter: "\n", cellDelimiter: "," },
    header: { lineDelimiter: "\n", cellDelimiter: ",", header: true }
};

let log = (event) => console.log(String(event.target));
let noop = () => {};

let suite = new Benchmark.Suite;

suite.
    add("CSV#parse", () => {
        CSV.parse(csv, options.normal);
    }).
    add("CSV#parse, stream", () => {
        CSV.parse(csv, options.normal, noop);
    }).
    on("cycle", log).
    run();

