var Benchmark = require('benchmark'),
    CSV = require("./csv"),
    fs = require("fs"),
    csv, json;

    Parse = new Benchmark.Suite("Parse"),
    ParseHeader = new Benchmark.Suite("Parse, Header"),
    Encode = new Benchmark.Suite("Encode"),
    EncodeHeader = new Benchmark.Suite("Encode, Header"),

    options = {
      normal: { line: "\n" },
      header: { line: "\n", header: true },
      optimize: { line: "\n", optimize: true }
    },

    noop = function() {};


Parse.
  add("CSV#parse", function() {
    CSV.parse(csv, options.normal);
  }).
  add("CSV#forEach", function() {
    CSV.forEach(csv, options.normal, noop);
  });

ParseHeader.
  add("CSV#parse", function() {
    CSV.parse(csv, options.header);
  }).
  add("CSV#forEach", function() {
    CSV.forEach(csv, options.header, noop);
  });


Encode.
  add("CSV#encode", function() {
    CSV.encode(json, options.normal);
  }).
  add("CSV#forEach", function() {
    CSV.forEach(json, options.normal, noop);
  });

EncodeHeader.
  add("CSV#encode", function() {
    CSV.encode(json, options.header);
  }).
  add("CSV#forEach", function() {
    CSV.forEach(json, options.header, noop);
  });


function log(suite) {
  var result;
  suite.run();
  suite.forEach(function(bench) {
    result = suite.name + ": " + bench.toString();
    console.log(result);
  });
}

fs.readFile("./datasets/csv/marriage_census.csv", 'utf8', function(err, res) {
  csv = res;
  [Parse, ParseHeader].forEach(log);
});

fs.readFile("./datasets/json/marriage_census.json", 'utf8', function(err, res) {
  json = JSON.parse(res);
  [Encode, EncodeHeader].forEach(log);
});
