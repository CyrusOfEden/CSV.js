(function() {
  'use strict';

  var CSV = function(options) {
    var exists = function(possibility) { return !!(possibility && possibility !== null); };

    options = exists(options) ? options : {};

    this.options = {
      delimiter: exists(options.delimiter) ? options.delimiter : ",",
      header: exists(options.header) ? options.header : false,
      stream: exists(options.stream) ? options.stream : undefined,
      done: exists(options.done) ? options.done : undefined
    };

    return this;
  };

  // Format helper
  CSV.format = {
    cast: function(string) {
      var match = string.toLowerCase();
      if (match === "") {
        return undefined;
      }  else if(!isNaN(Number(string))) {
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

  CSV.prototype.set = function(option, value) { this.options[option] = value; return value; };

  CSV.prototype.encode = function(data) {
    var response, kind, fields, header, stream, complete;
    response = [];
    kind = data[0] instanceof Array ? "array" : "object";
    header = this.options.header;
    stream = this.options.stream || [].push;
    complete = this.options.done;

    if (kind === "object") {
      fields = Object.keys(data[0]);
      stream.call(response, CSV.format.encode(fields));
      data.forEach(function(record) {
        record = fields.map(function(key) { return record[key]; });
        stream.call(response, CSV.format.encode(record));
      });
    } else {
      if (header && header instanceof Array) stream.call(response, CSV.format.encode(header));
      data.forEach(function(record) { stream.call(response, CSV.format.encode(record)); });
    }

    // Return as appropriate
    return complete ? complete(response) : response.join("");
  };

  CSV.prototype.parse = function(text) {
    var response, delimiter, stream, complete, header, fields;
    // Response
    response = [];
    // Aliases
    delimiter = this.options.delimiter;
    stream = this.options.stream || [].push;
    complete = this.options.done;
    header = this.options.header;
    fields = header instanceof Array ? header : false;

    /*
     * BEGIN CSV PARSING CODE BORROWED FROM D3.JS
     */
    var EOL, EOF, N, I, n, t, eol, token;
    EOL = {}; // Sentinel value for end-of-line
    EOF = {}; // Sentinel value for end-of-file
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

    var a, object;

    // While loop
    while ((t = token()) !== EOF) {
      a = [];
      while (t !== EOL && t !== EOF) {
        a.push(t);
        t = token();
      }
    /*
     * END CSV PARSING CODE BORROWED FROM D3.JS
     */
      // If valid array
      if (a[0] !== "" && a.length !== 1) {
        if (fields && fields.length) {
          // If fields has already been set
          object = {}, a = a.map(CSV.format.cast);
          for (var _i = 0, _len = fields.length; _i < _len; ++_i) object[fields[_i]] = a[_i];
          stream.call(response, object);
          // Otherwise
        } else if (header) {
          fields = (header instanceof Array ? header : a).map(CSV.format.cast);
        } else {
          stream.call(response, a.map(CSV.format.cast));
        }
      } // If valid array
    } // While loop

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