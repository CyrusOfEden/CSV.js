(function() {
  'use strict';

  var CSV = function(options) {
    options = !!(options && options !== null) ? options : {};

    this.options = {
      delimiter: !!(options.delimiter && options.delimiter !== null) ? options.delimiter : ",",
      header: !!(options.header && options.header !== null) ? options.header : false,
      replace: !!(options.replace && options.replace !== null) ? options.replace : false,
      stream: !!(options.stream && options.stream !== null) ? options.stream : undefined,
      done: !!(options.done && options.done !== null) ? options.done : undefined
    };

    return this;
  };

  // Format helper
  CSV.format = {
    cast: function(string) {
      var match = string.toLowerCase();
      if (match === "") {
        return string;
      } else if (!isNaN(Number(string))) {
        return Number(string);
      } else if (match === "true" || match === "t" || match === "yes" || match === "y") {
        return true;
      } else if (match === "false" || match === "f" || match === "no" || match === "n") {
        return false;
      } else {
        string = string.trim();
        if (string.charAt(0) === '"') string = string.substring(1, string.length);
        if (string.charAt(string.length - 1) === '"') string = string.substring(0, string.length - 1);
        return string.replace(/\"\"/g, '"');
      }
    },
    stringify: function(string) {
      return !isNaN(Number(string)) ? string : '"' + string.replace(/\"/, '""') + '"';
    },
    encode: function(array) {
      return array.map(CSV.format.stringify).join(",") + "\r\n";
    }
  };

  CSV.rows = function(text, delimiter, stream) {
    stream = !!(stream && stream.constructor && stream.call && stream.apply) ? stream : false;

    var EOL, EOF, rows, N, I, n, t, eol, token;
    EOL = {}; // Sentinel value for end-of-line
    EOF = {}; // Sentinel value for end-of-file
    rows = []; // Output
    N = text.length;
    I = 0; // Current character index
    n = 0; // Current line number

    token = function() {
      if (I >= N) return EOF;
      if (eol) {
        eol = false;
        return EOL;
      }

      var j = I;
      if (text.charCodeAt(j) === 34) {
        var i = j;
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
        var c = text.charCodeAt(I++);
        var k = 1;
        if (c === 10) eol = true; // \n
        else if (c === 13) { eol = true; if (text.charCodeAt(I) === 10) ++I, ++k; } // \r|\r\n
        else if (c !== delimiter.charCodeAt(0)) continue;
        return text.substring(j, I - k);
      }

      return text.substring(j);
    };

    var a;

    if (stream) {
      while ((t = token()) !== EOF) {
        a = [];
        while (t !== EOL && t !== EOF) {
          a.push(t);
          t = token();
        }
        if (a[0] !== "" && a.length !== 1) stream(a.map(CSV.format.cast));
      }
    } else {
      while ((t = token()) !== EOF) {
        a = [];
        while (t !== EOL && t !== EOF) {
          a.push(t);
          t = token();
        }
        if (a[0] !== "" && a.length !== 1) rows.push(a.map(CSV.format.cast));
      }
    }

    return rows;
  };

  CSV.prototype.set = function(option, value) { this.options[option] = value; return value; };
  CSV.prototype.stream = function(method) { this.options.stream = method; return method; };
  CSV.prototype.done = function(method) { this.options.done = method; return method; };

  CSV.prototype.encode = function(data) {
    var stream, complete, header, supplied, detailed, response;
    stream = this.options.stream;
    complete = this.options.done;
    header = this.options.header;
    supplied = header instanceof Array ? header : false;
    detailed = this.options.detailed;
    response = header ? (supplied ? header : CSV.format.encode(Object.keys(data[0]))) : "";

    data.forEach(function(object) {
      var values = CSV.format.encode(
        object instanceof Array ? object : Object.keys(object).map(function(key) { return object[key]; })
      );
      if (stream) {
        stream(values);
      } else {
        response += values;
      }
    });
    // Return as appropriate
    return complete ? complete(response) : response;
  };

  CSV.prototype.parse = function(text) {
    var stream, complete, header, rows, response;
    // Aliases
    stream = this.options.stream;
    complete = this.options.done;
    header = this.options.header;
    rows = CSV.rows(text, this.options.delimiter, stream);

    if (header) {
      var supplied, data, fields;
      supplied = header instanceof Array;
      data = supplied && !this.options.replace ? rows : rows.slice(1);
      fields = supplied ? header : rows[0];
      response = data.map(function(record) {
        // Empty object
        var object = {};
        // Loop through the row's values, and apply those to the object
        record.forEach(function(value, index) { object[fields[index]] = value; });
        // Return as appropriate
        return stream ? stream(object) : object;
      });
    } else {
      response = rows.map(function(record) {
        // Return as appropriate
        return stream ? stream(record) : record;
      });
    }
    // Return as appropriate
    return complete ? complete(response) : response;
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