var

Benchmark = require('benchmark'),
CSV = require("./csv"),
fs = require("fs"),
csv, json,
results = [],

Parse = new Benchmark.Suite("Parse"),
ParseHeader = new Benchmark.Suite("Parse, Header"),
Encode = new Benchmark.Suite("Encode"),
EncodeHeader = new Benchmark.Suite("Encode, Header"),

options = {
  normal: { line: "\n" },
  header: { line: "\n", header: true }
};


Parse.
  add("CSV#parse", function() {
    new CSV(csv, options.normal).parse();
  }).
  add("CSV#forEach", function() {
    new CSV(csv, options.normal).forEach(function(record) { record; });
  });

ParseHeader.
  add("CSV#parse", function() {
    new CSV(csv, options.header).parse();
  }).
  add("CSV#forEach", function() {
    new CSV(csv, options.header).forEach(function(record) { record; });
  });


Encode.
  add("CSV#encode", function() {
    new CSV(json, options.normal).encode();
  }).
  add("CSV#forEach", function() {
    new CSV(json, options.normal).forEach(function(record) { record; });
  });

EncodeHeader.
  add("CSV#encode", function() {
    new CSV(json, options.header).encode();
  }).
  add("CSV#forEach", function() {
    new CSV(json, options.header).forEach(function(record) { record; });
  });


function log(suite) {
  var result;
  suite.run();
  suite.forEach(function(bench) {
    result = suite.name + ": " + bench.toString();
    results.push(result);
  });
  if (results.length === 8) fs.writeFile("./stats.txt", results.join("\n"));
}


fs.readFile("./datasets/csv/marriage_census.csv", "utf8", function(err, res) {
  csv = res;
  [Parse, ParseHeader].forEach(log);
});

fs.readFile("./datasets/json/marriage_census.json", "utf8", function(err, res) {
  json = JSON.parse(res);
  [Encode, EncodeHeader].forEach(log);
});
