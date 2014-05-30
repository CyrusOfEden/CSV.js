(function() {
  'use strict';

  // Environment variables
  var AMD = (typeof define === "function" && define.amd),
      NODE = (typeof module === "object" && module.exports);

  var PRESENT = function(possible) {
        return !!(possible && possible !== null);
      },
      FLOAT = /^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/,
      BOOL = function(possible) {
        possible = possible.toLowerCase();
        return (possible === "true" || possible === "false");
      };

  var Builder = function(type, schema, sample) {
    var code = "return ",
        i = 0,
        cast = function(element, i) {
          if (FLOAT.test(element)) {
            return "Number(values[" + i + "]),";
          } else if (BOOL(element)) {
            return "values[" + i + "].toLowerCase() === 'true',";
          } else {
            return "values[" + i + "],";
          }
        };

    if (type === "object") {
      code += "{";
      for (i = 0; i < schema.length; ++i) code += '"' + schema[i] + '": ' + cast(sample[i], i);
      code = code.slice(0, -1) + "}";
    } else {
      code += "[";
      for (i = 0; i < schema.length; ++i) code += cast(schema[i], i);
      code = code.slice(0, -1) + "]";
    }
    return new Function("values", code);
  };

  var CSV = function(data, set) {
    set = PRESENT(set) ? set : {};

    this.options = {
      line: PRESENT(set.line) ? set.line : "\r\n",
      delimiter: PRESENT(set.delimiter) ? set.delimiter : ",",
      header: PRESENT(set.header) ? set.header : false,
      done: PRESENT(set.done) ? set.done : undefined
    };

    this.action = (data instanceof Array) ? "encode" : "parse";
    this.data = data;

    var line = this.options.line,
        _lil = line.length - 1,
        _lid = data.length - 1,
        cc = function(text, i) { return text.charCodeAt(i); };
    if (this.action === "parse" && cc(data, _lid) !== cc(line, _lil)) {
      this.data += line;
    }

    return this;
  };

  CSV.prototype.set = function(option, value) {
    this.options[option] = value;
    return this;
  };

  CSV.prototype.encode = function(stream) {
    if (this.data.length === 0) return "";

    var data = this.data,
        response = [],
        delimiter = this.options.delimiter,
        kind = data[0] instanceof Array ? "array" : "object",
        header = this.options.header,
        complete = this.options.done,

        stringify = function(value) {
          return FLOAT.test(value) ? value : '"' + value.replace(/\"/g, '""') + '"';
        },

        save = stream ? function(line) {
          stream(line.join(delimiter));
        } : function(line) {
          response.push(line.join(delimiter));
        },

        _lend = data.length,
        _i, _k, fields, _lenf, line, record;

    if (kind === "object") {
      fields = Object.keys(data[0]);
      _lenf = fields.length;
    } else {
      _lenf = data[0].length;
    }

    record = new Array(_lenf);

    if (header) {
      var columns = header instanceof Array ? header : fields;
      for (_k = 0; _k < _lenf; ++_k) record[_k] = stringify(columns[_k]);
      save(record);
    }

    if (kind === "object") {
      for (_i = 0; _i < _lend; ++_i) {
        line = data[_i];
        for (_k = 0; _k < _lenf; ++_k) record[_k] = stringify(line[fields[_k]]);
        save(record);
      }
    } else {
      for (_i = 0; _i < _lend; ++_i) {
        line = data[_i];
        for (_k = 0; _k < _lenf; ++_k) record[_k] = stringify(line[_k]);
        save(record);
      }
    }

    // Return as appropriate
    response = response.join(this.options.line);
    if (complete) complete(response);
    return response;
  };

  CSV.prototype.parse = function(stream) {
    if (this.data.trim().length === 0) return [];

    var data = this.data,
        response = [],
        complete = this.options.done,
        header = this.options.header,
        fields = header instanceof Array ? header : [],

        _lenf = fields.length,

        current = { row: [], cell: "" },
        flag = { escaped: false, quote: false, cell: true },

        Record,
        save = function(cell) {
          current.row.push(
            (flag.escaped ? cell.slice(1, -1).replace(/""/g, '"') : cell).trim()
          );
          current.cell = "";
          flag = { escaped: false, quote: false, cell: true };
        },
        apply = stream ? function() {
          stream(new Record(current.row));
        } : function() {
          response.push(new Record(current.row));
        },
        send = function() {
          if (header) {
            if (_lenf) {
              Record = new Builder("object", fields, current.row);
              apply();
              send = apply;
            } else {
              fields = current.row, _lenf = fields.length;
            }
          } else {
            if (!Record) Record = new Builder("array", current.row);
            apply();
            send = apply;
          }
        },

        start,
        _i,
        _lent = data.length,
        _line = this.options.line.charCodeAt(this.options.line.length - 1),
        _delim = this.options.delimiter.charCodeAt(0),
        prev,
        sign;


    for (start = 0, _i = 0; _i <= _lent; ++_i) {
      prev = data.charCodeAt(_i - 1);
      sign = data.charCodeAt(_i);
      if (flag.cell) {
        flag.cell = false;
        if (sign === 34) {
          flag.escaped = true;
          continue;
        }
      }
      if (flag.escaped && sign === 34) {
        flag.quote = !flag.quote;
        continue;
      }
      if ((flag.escaped && flag.quote) || !flag.escaped) {
        if (sign === _delim) {
          save(current.cell + data.slice(start, _i));
          start = _i + 1;
        } else if (sign === _line) {
          if (prev < 33) {
            save((current.cell + data.slice(start, _i)).slice(0, -1));
          } else {
            save((current.cell + data.slice(start, _i)));
          }
          start = _i + 1;
          send();
          current.row = [];
        }
      }
    }
    // Return as appropriate
    if (complete) complete(response);
    return response;
  };

  CSV.prototype.forEach = function(stream) {
    return this[this.action](stream);
  };

  // Define this module
  if (AMD) {
    define(CSV);
  } else if (NODE) {
    module.exports = CSV;
  } else {
    this.CSV = CSV;
  }

}).call(this);