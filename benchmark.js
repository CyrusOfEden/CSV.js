var

Benchmark = require('benchmark'),
CSV = require("./csv"),
fs = require("fs"),
csv, json,
results = [],

Parse = new Benchmark.Suite("Parse"),
ParseOptimize = new Benchmark.Suite("Parse, Optimize"),
ParseHeader = new Benchmark.Suite("Parse, Header"),
Encode = new Benchmark.Suite("Encode"),
EncodeHeader = new Benchmark.Suite("Encode, Header"),

options = {
  normal: { line: "\n" },
  header: { line: "\n", header: true },
  optimize: { line: "\n", optimize: true }
};

function noop() {}

Parse.
  add("CSV#parse", function() {
    new CSV(csv, options.normal).parse();
  }).
  add("CSV#forEach", function() {
    new CSV(csv, options.normal).forEach(noop);
  });

ParseOptimize.
  add("CSV#parse", function() {
    new CSV(csv, options.optimize).parse();
  }).
  add("CSV#forEach", function() {
    new CSV(csv, options.optimize).forEach(noop);
  });

ParseHeader.
  add("CSV#parse", function() {
    new CSV(csv, options.header).parse();
  }).
  add("CSV#forEach", function() {
    new CSV(csv, options.header).forEach(noop);
  });


Encode.
  add("CSV#encode", function() {
    new CSV(json, options.normal).encode();
  }).
  add("CSV#forEach", function() {
    new CSV(json, options.normal).forEach(noop);
  });

EncodeHeader.
  add("CSV#encode", function() {
    new CSV(json, options.header).encode();
  }).
  add("CSV#forEach", function() {
    new CSV(json, options.header).forEach(noop);
  });


function log(suite) {
  var result;
  suite.run();
  suite.forEach(function(bench) {
    result = suite.name + ": " + bench.toString();
    results.push(result);
    console.log(result);
  });
  if (results.length == 10) fs.writeFile('./stats.txt', results.join('\n'));
}


fs.readFile("./datasets/csv/marriage_census.csv", 'utf8', function(err, res) {
  csv = res;
  [Parse, ParseOptimize, ParseHeader].forEach(log);
});

fs.readFile("./datasets/json/marriage_census.json", 'utf8', function(err, res) {
  json = JSON.parse(res);
  [Encode, EncodeHeader].forEach(log);
});
