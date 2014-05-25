(function() {
  'use strict';

  var CSV, confirm, format, get;

  // Confirm helper
  confirm = {
    existence: function(possible) {
      return !!(possible && possible !== null);
    },
    number: function(possible) {
      return !isNaN(Number(possible));
    },
    method: function(possible) {
      return !!(possible && possible.constructor && possible.call && possible.apply);
    }
  };

  // Format helper
  format = {
    value: function(string) {
      if (string.charAt(0) === '"') {
        string = string.substring(1, string.length);
      }
      if (string.charAt(string.length - 1) === '"') {
        string = string.substring(0, string.length - 1);
      }
      return string.replace(/(^\s+|\s+$)/g, "").replace(/\"\"/g, '"');
    },
    decode: function(string) {
      if (string === "") {
        return string;
      } else if (confirm.number(string)) {
        return Number(string);
      } else if (string.toLowerCase() === "true") {
        return true;
      } else if (string.toLowerCase() === "false") {
        return false;
      } else {
        return format.value(string);
      }
    },
    encode: function(array) {
      return array.map(function(element) {
        if (confirm.number(element)) {
          return element;
        } else {
          return '"' + element + '"';
        }
      }).join(",") + "\n";
    },
    clean: function(array) {
      return array.map(function(item) {
        return format.decode(item);
      });
    }
  };

  // Get helper
  get = {
    rows: function(text, delimiter) {
      var EOL, EOF, rows, N, I, n, t, eol, token;
      EOL = {}; // Sentinel value for end-of-line
      EOF = {}; // Sentinel value for end-of-file
      rows = []; // Output
      N = text.length;
      I = 0; // Current character index
      n = 0; // Current line number

      token = function() {
        if (I >= N) return EOF;
        if (eol) return eol = false, EOL;

        var c, i, j, k;

        j = I;
        if (text.charCodeAt(j) === 34) {
          i = j;
          while (i++ < N) {
            if (text.charCodeAt(i) === 34) {
              if (text.charCodeAt(i + 1) !== 34) break;
              i += 1;
            }
          }
          I = i + 2;
          c = text.charCodeAt(i + 1);
          if (c === 13) {
            eol = true;
            if (text.charCodeAt(i + 2) === 10) i += 1;
          } else if (c === 10) {
            eol = true;
          }
          return text.substring(j + 1, i);
        }

        while (I < N) {
          c = text.charCodeAt(I++);
          k = 1;
          if (c === 10) eol = true; // \n
          else if (c === 13) { eol = true; if (text.charCodeAt(I) === 10) ++I, ++k; } // \r|\r\n
          else if (c !== delimiter.charCodeAt(0)) continue;
          return text.substring(j, I - k);
        }

        return text.substring(j);
      };

      while ((t = token()) !== EOF) {
        var a = [];
        while (t !== EOL && t !== EOF) {
          a.push(t);
          t = token();
        }
        if (a[0] !== "" && a.length !== 1) rows.push(a);
      }

      return rows;
    },
    keys: function(object) {
      var results = [];
      for (var key in object) results.push(key);
      return results;
    },
    values: function(object) {
      var results = [];
      if (object instanceof Array) {
        results.concat(object);
      } else {
        for (var key in object) results.push(object[key]);
      }
      return results;
    }
  };

  CSV = function(options) {
    options = confirm.existence(options) ? options : {};

    this.options = {
      delimiter: confirm.existence(options.delimiter) ? options.delimiter : ",",
      header: confirm.existence(options.header) ? options.header : false,
      replace: confirm.existence(options.replace) ? options.replace : false,
      stream: confirm.existence(options.stream) ? options.stream : undefined,
      done: confirm.existence(options.done) ? options.done : undefined
    };

    return this;
  };

  CSV.prototype.set = function(option, value) {
    switch (option) {
      case "stream":
        this.stream(value);
        break;
      case "done":
        this.done(value);
        break;
      default:
        this.options[option] = value;
    }
  };

  CSV.prototype.stream = function(method) {
    return confirm.method(method) ? this.options.stream = method : "No function provided.";
  };

  CSV.prototype.done = function(method) {
    return confirm.method(method) ? this.options.done = method : "No function provided.";
  };

  CSV.prototype.encode = function(array) {
    var stream, complete, header, supplied, detailed, response, data;
    stream = this.options.stream;
    complete = this.options.done;
    header = this.options.header;
    supplied = header instanceof Array ? header : false;
    detailed = this.options.detailed;
    data = array;
    response = {};

    if (this.options.header) {
      response.data = supplied ? header : format.encode(get.keys(data[0]));
    } else {
      response.data = "";
    }

    for (var _i = 0, _len = data.length; _i < _len; _i += 1) {
      var object, values;
      object = data[_i];
      values = format.encode(get.values(object));
      if (stream) {
        stream(values);
      } else {
        response.data += values;
      }
    }
    if (complete) complete(response);
    return response;
  };

  CSV.prototype.parse = function(text) {
    var stream, complete, header, replace, rows, response;
    // Aliases
    stream = this.options.stream;
    complete = this.options.done;
    header = this.options.header;
    replace = this.options.replace;

    rows = get.rows(text, this.options.delimiter);
    if (header) {
      var supplied, data, fields;
      supplied = header instanceof Array;
      data = supplied && !replace ? rows : rows.slice(1);
      fields = supplied ? header : format.clean(rows[0]);
      response = data.map(function(record) {
        // Clean the record
        record = format.clean(record);
        // Empty object
        var object = {};
        // Loop through the row's values, and apply those to the object
        for (var _n = 0, _len2 = record.length; _n < _len2; _n += 1) {
          object[fields[_n]] = record[_n];
        }
        if (stream) {
          stream(object);
        } else {
          return object;
        }
      });
    } else {
      response = rows.map(function(record) {
        // Clean the record
        record = format.clean(record);
        // Return the cleaned record
        if (stream) {
          stream(record);
        } else {
          return record;
        }
      });
    }
    if (complete) complete(reponse);
    return response;
  };

  // Define this module
  if (typeof define === "function" && define.amd) {
    define(CSV);
  } else if (typeof module === "object" && module.exports) {
    module.exports = CSV;
  } else {
    window.CSV = CSV;
  }

})();