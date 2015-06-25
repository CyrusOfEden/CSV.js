var CSV = require("./csv"),
    assert = require("assert"),
    deepEqual = require("deep-equal"),
    fs = require("fs"),

    sets = ["marriage_census", "worldbank"],
    data = {
      marriage_census: {},
      worldbank: {}
    };

sets.forEach(function(set) {
  fs.readFile("./datasets/csv/" + set + ".csv", "utf8", function(err, res) {
    data[set].csv = res;
  });
  fs.readFile("./datasets/json/" + set + ".json", "utf8", function(err, res) {
    data[set].json = JSON.parse(res);
  });
});

describe("CSV", function() {

  describe("#parse()", function() {
    it("should return nothing if no data", function() {
      var expected = [],
          actual = "";
      assert.deepEqual(expected, new CSV(actual).parse());
    });
    it("should parse edge cases", function() {
      var expected = [
            [[1, 2, "3,4"]],
            [[1, 2, "\"3,4\""]],
            [[1, 2, "3\n4"]]
          ],
          actual = [
            '1,2,"3,4"',
            '1,2,"""3,4"""',
            '1,2,"3\n4"'
          ];

      expected.map(function(result, index) {
        assert.deepEqual(result, new CSV(actual[index]).parse());
      });
    });
    it("should parse with no headers", function() {
      var expected = [[1, 2, 3, 4], [5, 6, 7, 8]],
          actual = '1,2,3,4\r\n5,6,7,8\r\n';
      assert.deepEqual(expected, new CSV(actual).parse());
    });
    it("should parse with headers", function() {
      var expected = [{ name: "Will", age: 32 }],
          actual = "name,age\r\nWill,32\r\n";
      assert.deepEqual(expected, new CSV(actual, { header: true }).parse());
    });
    it("should parse files", function() {
      sets.forEach(function(set) {
        assert.deepEqual(data[set].json, new CSV(data[set].csv, { header: true }).parse());
      });
    });
    it("should parse with headers and cast", function() {
      var expected = [{ name: "Will", age: 32, tel: "1009999" }],
          actual = "name,age,tel\r\nWill,32,1009999\r\n";
      assert.ok(deepEqual(expected, new CSV(actual, { header: true, cast: ["String", "Number", "String"] }).parse(), {strict: true}));
    });
    it("should parse with cast", function() {
      var expected = [["123", 456], ["", 0]],
          actual = "123,456\r\n,\r\n";
      assert.deepEqual(expected, new CSV(actual, { cast: ["String", "Number"] }).parse());
    });
    it("should parse with custom cast", function() {
      var customFunc = function(val) { return val === '' ? null : String(val); },
          options = { cast: [customFunc, customFunc] },
          expected = [["123", "456"], [null, ""]],
          actual = "123,456\r\n,\r\n";
      assert.deepEqual(expected, new CSV(actual, { cast: [customFunc, "String"] }).parse());
    });
  });

  describe("#encode()", function() {
    it("should return an empty string if no data", function() {
      var expected = "",
          actual = [];
      assert.deepEqual(expected, new CSV(actual).encode());
    });
    it("should encode edge cases", function() {
      var expected = [
            '1,2,"3,4"',
            '1,2,"""3,4"""',
            '1,2,"3\n4"',
            '1,2,"3\n4"',
            '1,2,"3\n4"'
          ],
          actual = [
            [[1, 2, "3,4"]],
            [[1, 2, "\"3,4\""]],
            [[1, 2, "3\n4"]],
            [[1, 2, "3\n4"]],
            [[1, 2, "3\n4"]]
          ];

      expected.map(function(result, index) {
        assert.deepEqual(result, new CSV(actual[index], { line: "\n" }).encode());
      });
    });
    it("should encode with no headers", function() {
      var expected = '1,2,3,4\r\n5,6,7,8',
          actual = [[1, 2, 3, 4], [5, 6, 7, 8]];
      assert.deepEqual(expected, new CSV(actual).encode());
    });
    it("should encode with headers", function() {
      var expected = "\"name\",\"age\"\r\n\"Will\",32",
          actual = [{ name: "Will", age: 32 }];
      assert.deepEqual(expected, new CSV(actual, { header: true }).encode());
    });
    it("should encode files", function() {
      var options = { header: true, lineDelimiter: "\n" };
      sets.forEach(function(set) {
        assert.deepEqual(data[set].csv, new CSV(data[set].json, options).encode());
      });
    });
    it("should encode with cast", function() {
      var options = { cast: ["String", "Primitive"] },
          expected = "\"123\",\r\n\"null\",456",
          actual = [["123", null], [null, "456"]];
      assert.deepEqual(expected, new CSV(actual, options).encode());
    });
    it("should encode with custom cast", function() {
      var customFunc = function(val) { return val === null ? '' : this.string(val); },
          options = { cast: [customFunc, customFunc] },
          expected = "\"123\",\r\n,\"456\"",
          actual = [["123", null], [null, "456"]];
      assert.deepEqual(expected, new CSV(actual, options).encode());
    });
  });

});
