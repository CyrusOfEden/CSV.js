(function() {
  'use strict';

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
        cast = function(element, index) {
          if (FLOAT.test(element)) {
            return "Number(values[" + index + "]),";
          } else if (BOOL(element)) {
            return "Boolean(values[" + index + "].toLowerCase() === 'true'),";
          } else {
            return "values[" + index + "],";
          }
        },
        _index;

    if (type === "object") {
      code += "{";
      for (_index = 0; _index < schema.length; ++_index) {
        code += '"' + schema[_index] + '": ' + cast(sample[_index], _index);
      }
      code = code.slice(0, -1) + "}";
    } else {
      code += "[";
      for (_index = 0; _index < schema.length; ++_index) {
        code += cast(schema[_index], _index);
      }
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

        sendLine = stream ? function(line) {
          stream(line.join(delimiter));
        } : function(line) {
          response.push(line.join(delimiter));
        },

        _dataLength = data.length,
        _index, _keys, fields, _fieldsLength, line, record;

    if (kind === "object") {
      fields = Object.keys(data[0]);
      _fieldsLength = fields.length;
    } else {
      _fieldsLength = data[0].length;
    }

    record = new Array(_fieldsLength);

    if (header) {
      var columns = header instanceof Array ? header : fields;
      for (_keys = 0; _keys < _fieldsLength; ++_keys) {
        record[_keys] = stringify(columns[_keys]);
      }
      sendLine(record);
    }

    if (kind === "object") {
      for (_index = 0; _index < _dataLength; ++_index) {
        line = data[_index];
        for (_keys = 0; _keys < _fieldsLength; ++_keys) {
          record[_keys] = stringify(line[fields[_keys]]);
        }
        sendLine(record);
      }
    } else {
      for (_index = 0; _index < _dataLength; ++_index) {
        line = data[_index];
        for (_keys = 0; _keys < _fieldsLength; ++_keys) {
          record[_keys] = stringify(line[_keys]);
        }
        sendLine(record);
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

        _line = this.options.line,
        _fieldsLength = fields.length,

        current = { row: [], cell: "" },
        flag = { escaped: false, quote: false, cell: true },

        Record,
        saveCell = function(cell) {
          current.row.push(
            (flag.escaped ? cell.slice(1, -1).replace(/""/g, '"') : cell).trim()
          );
          current.cell = "";
          flag = { escaped: false, quote: false, cell: true };
        },
        saveLastCell = _line.length === 1 ? saveCell : function(cell) {
          saveCell(cell.slice(0, 1 - _line.length));
        },
        apply = stream ? function() {
          stream(new Record(current.row));
        } : function() {
          response.push(new Record(current.row));
        },
        sendRow = function() {
          if (header) {
            if (_fieldsLength) {
              Record = new Builder("object", fields, current.row);
              apply();
              sendRow = apply;
            } else {
              fields = current.row, _fieldsLength = fields.length;
            }
          } else {
            if (!Record) Record = new Builder("array", current.row);
            apply();
            sendRow = apply;
          }
        },

        start,
        _index,
        _dataLength = data.length,
        _lineDelim = _line.charCodeAt(_line.length - 1),
        _cellDelim = this.options.delimiter.charCodeAt(0),
        currentChar;


    for (start = 0, _index = 0; _index <= _dataLength; ++_index) {
      currentChar = data.charCodeAt(_index);
      if (flag.cell) {
        flag.cell = false;
        if (currentChar === 34) {
          flag.escaped = true;
          continue;
        }
      }
      if (flag.escaped && currentChar === 34) {
        flag.quote = !flag.quote;
        continue;
      }
      if ((flag.escaped && flag.quote) || !flag.escaped) {
        if (currentChar === _cellDelim) {
          saveCell(current.cell + data.slice(start, _index));
          start = _index + 1;
        } else if (currentChar === _lineDelim) {
          saveLastCell(current.cell + data.slice(start, _index));
          start = _index + 1;
          sendRow();
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
  if (typeof define === "function" && define.amd) {
    define(CSV);
  } else if (typeof module === "object" && module.exports) {
    module.exports = CSV;
  } else {
    this.CSV = CSV;
  }

}).call(this);