var CSV = require("./csv"),
    assert = require("assert"),
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
  });

});