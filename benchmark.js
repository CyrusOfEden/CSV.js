/* jshint esversion: 6 */

let Benchmark = require('benchmark');
let fs = require("fs");

let CSV = require("./csv");
let Baby = require("babyparse");
let D3 = require("d3-dsv");

let csv = fs.readFileSync("./datasets/csv/marriage_census.csv", "utf8");
let json = JSON.parse(fs.readFileSync("./datasets/json/marriage_census.json", "utf8"));

let log = (event) => console.log(String(event.target));
let noop = () => {};

let opts = {
  newline: "\n",
  delimiter: ","
};

let inferredStreamOpts = {
  step: noop
};

let streamOpts = {
  newline: "\n",
  delimiter: ",",
  step: noop
};

let suite = new Benchmark.Suite();

suite.
  // add("CSV.parse", () => {
  //   CSV.parse(csv, opts);
  // }).
  // add("CSV.parse, stream", () => {
  //   CSV.parse(csv, opts, noop);
  // }).
  add("D3.parse", () => {
    D3.csvParseRows(csv);
  }).
  add("Baby.parse", () => {
    Baby.parse(csv, opts);
  }).
  add("Baby.parse, stream", () => {
    Baby.parse(csv, streamOpts);
  }).
  add("CSV.encode", () => {
    CSV.encode(json, opts);
  }).
  add("CSV.encode, stream", () => {
    CSV.encode(json, opts, noop);
  }).
  add("Baby.unparse", () => {
    Baby.unparse(json, opts);
  }).
  add("Baby.unparse, stream", () => {
    Baby.unparse(json, streamOpts);
  }).
  on("cycle", log).
  run();

