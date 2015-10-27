(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CSV = factory();
  }
}(this, function() {
  'use strict';

  var ESCAPE_DELIMITERS = ['|', '^'],
      CELL_DELIMITERS = [',', ';', '\t', '|', '^'],
      LINE_DELIMITERS = ['\r\n', '\r', '\n'];

  function isObject(object) {
    var type = typeof object;
    return type === 'function' || type === 'object' && !!object;
  }
  var isArray = Array.isArray || function(object) {
    return toString.call(object) === '[object Array]';
  }
  function isString(object) {
    return typeof object === 'string';
  }
  function isNumber(object) {
    return !isNaN(Number(object));
  }
  function isBoolean(value) {
    return value == false || value == true;
  }
  function isNull(value) {
    return value == null;
  }
  function isPresent(value) {
    return value != null;
  }

  function fallback(value, fallback) {
    return isPresent(value) ? value : fallback;
  }

  function forEach(collection, iterator) {
    for (var _i = 0, _len = collection.length; _i < _len; _i += 1) {
      if (iterator(collection[_i], _i) === false) break;
    }
  }

  function sanitizeString(string) {
    return string.replace(/"/g,'\\"');
  }

  function buildCell(index) {
    return 'attrs[' + index + ']';
  }

  function castCell(value, index) {
    if (isNumber(value)) {
      return 'Number(' + buildCell(index) + ')';
    } else if (isBoolean(value)) {
      return 'Boolean(' + buildCell(index) + ' == true)';
    } else {
      return 'String(' + buildCell(index) + ')';
    }
  }

  function buildConstructor(deserialize, cast, values, attrs) {
    var definition = [];
    if (arguments.length == 3) {
      if (cast) {
        if (isArray(cast)) {
          forEach(values, function(value, index) {
            if (isString(cast[index])) {
              cast[index] = cast[index].toLowerCase();
            } else {
              deserialize[cast[index]] = cast[index];
            }
            definition.push('deserialize[cast[' + index + ']](' + buildCell(index) + ')');
          });
        } else {
          forEach(values, function(value, index) {
            definition.push(castCell(value, index));
          });
        }
      } else {
        forEach(values, function(value, index) {
          definition.push(buildCell(index));
        });
      }
      definition = 'return [' + definition.join(',') + ']';
    } else {
      if (cast) {
        if (isArray(cast)) {
          forEach(values, function(value, index) {
            if (isString(cast[index])) {
              cast[index] = cast[index].toLowerCase();
            } else {
              deserialize[cast[index]] = cast[index];
            }
            definition.push('"' + sanitizeString(attrs[index]) + '": deserialize[cast[' + index + ']](' + buildCell(index) + ')');
          });
        } else {
          forEach(values, function(value, index) {
            definition.push('"' + sanitizeString(attrs[index]) + '": ' + castCell(value, index));
          });
        }
      } else {
        forEach(values, function(value, index) {
          definition.push('"' + sanitizeString(attrs[index]) + '": ' + buildCell(index));
        });
      }
      definition = 'return {' + definition.join(',') + '}';
    }
    return new Function('attrs', 'deserialize', 'cast', definition);
  }

  function detectDelimiter(string, delimiters) {
    var count = 0,
        detected;

    forEach(delimiters, function(delimiter) {
      var needle = delimiter,
          matches;
      if (ESCAPE_DELIMITERS.indexOf(delimiter) != -1) {
        needle = '\\' + needle;
      }
      matches = string.match(new RegExp(needle, 'g'));
      if (matches && matches.length > count) {
        count = matches.length;
        detected = delimiter;
      }
    });
    return (detected || delimiters[0]);
  }

  var CSV = (function() {
    function CSV(data, options) {
      if (!options) options = {};

      if (isArray(data)) {
        this.mode = 'encode';
      } else if (isString(data)) {
        this.mode = 'parse';
      } else {
        throw new Error("Incompatible format!");
      }

      this.data = data;

      this.options = {
        header: fallback(options.header, false),
        cast: fallback(options.cast, true)
      }

      var lineDelimiter = options.lineDelimiter || options.line,
          cellDelimiter = options.cellDelimiter || options.delimiter;

      if (this.isParser()) {
        this.options.lineDelimiter = lineDelimiter || detectDelimiter(this.data, LINE_DELIMITERS);
        this.options.cellDelimiter = cellDelimiter || detectDelimiter(this.data, CELL_DELIMITERS);
        this.data = normalizeCSV(this.data, this.options.lineDelimiter);
      } else if (this.isEncoder()) {
        this.options.lineDelimiter = lineDelimiter || '\r\n';
        this.options.cellDelimiter = cellDelimiter || ',';
      }
    }

    function invoke(method, constructor, attributes, deserialize, cast) {
      method(new constructor(attributes, deserialize, cast));
    }

    function normalizeCSV(text, lineDelimiter) {
      if (text.slice(-lineDelimiter.length) != lineDelimiter) text += lineDelimiter;
      return text;
    }

    CSV.prototype.set = function(setting, value) {
      return this.options[setting] = value;
    }

    CSV.prototype.isParser = function() {
      return this.mode == 'parse';
    }

    CSV.prototype.isEncoder = function() {
      return this.mode == 'encode';
    }

    CSV.prototype.parse = function(callback) {
      if (this.mode != 'parse') return;
      if (this.data.trim().length === 0) return [];

      var data = this.data,
          options = this.options,
          header = options.header,
          current = { cell: '', line: [] },
          deserialize = this.deserialize,
          flag, record, response;

      if (!callback) {
        response = [];
        callback = function(record) {
          response.push(record);
        }
      }

      function resetFlags() {
        flag = { escaped: false, quote: false, cell: true };
      }
      function resetCell() {
        current.cell = '';
      }
      function resetLine() {
        current.line = [];
      }

      function saveCell(cell) {
        current.line.push(flag.escaped ? cell.slice(1, -1).replace(/""/g, '"') : cell);
        resetCell();
        resetFlags();
      }
      function saveLastCell(cell) {
        saveCell(cell.slice(0, 1 - options.lineDelimiter.length));
      }
      function saveLine() {
        if (header) {
          if (isArray(header)) {
            record = buildConstructor(deserialize, options.cast, current.line, header);
            saveLine = function() {
              invoke(callback, record, current.line, deserialize, options.cast);
            };
            saveLine();
          } else {
            header = current.line;
          }
        } else {
          if (!record) {
            record = buildConstructor(deserialize, options.cast, current.line);
          }
          saveLine = function() {
            invoke(callback, record, current.line, deserialize, options.cast);
          };
          saveLine();
        }
      }

      if (options.lineDelimiter.length == 1) saveLastCell = saveCell;

      var dataLength = data.length,
          cellDelimiter = options.cellDelimiter.charCodeAt(0),
          lineDelimiter = options.lineDelimiter.charCodeAt(options.lineDelimiter.length - 1),
          _i, _c, _ch;

      resetFlags();

      for (_i = 0, _c = 0; _i < dataLength; _i++) {
        _ch = data.charCodeAt(_i);

        if (flag.cell) {
          flag.cell = false;
          if (_ch == 34) {
            flag.escaped = true;
            continue;
          }
        }

        if (flag.escaped && _ch == 34) {
          flag.quote = !flag.quote;
          continue;
        }

        if ((flag.escaped && flag.quote) || !flag.escaped) {
          if (_ch == cellDelimiter) {
            saveCell(current.cell + data.slice(_c, _i));
            _c = _i + 1;
          } else if (_ch == lineDelimiter) {
            saveLastCell(current.cell + data.slice(_c, _i));
            _c = _i + 1;
            if (current.line.length > 1 || current.line[0] !== "") {
              saveLine();
            }
            resetLine();
          }
        }
      }

      if (response) {
        return response;
      } else {
        return this;
      }
    }

    function serializeType(object) {
      if (isArray(object)) {
        return 'array';
      } else if (isObject(object)) {
        return 'object';
      } else if (isString(object)) {
        return 'string';
      } else if (isNull(object)) {
        return 'null';
      } else {
        return 'primitive';
      }
    }

    CSV.prototype.deserialize = {
      "string": function(string) {
        return String(string);
      },
      "number": function(number) {
        return Number(number);
      },
      "boolean": function(b) {
        return Boolean(b);
      }
    }

    CSV.prototype.serialize = {
      "object": function(object) {
        var that = this,
            attributes = Object.keys(object),
            serialized = Array(attributes.length);
        forEach(attributes, function(attr, index) {
          serialized[index] = that[serializeType(object[attr])](object[attr]);
        });
        return serialized;
      },
      "array": function(array) {
        var that = this,
            serialized = Array(array.length);
        forEach(array, function(value, index) {
          serialized[index] = that[serializeType(value)](value);
        });
        return serialized;
      },
      "string": function(string) {
        return '"' + String(string).replace(/"/g, '""') + '"';
      },
      "null": function(value) {
        return '';
      },
      "primitive": function(value) {
        return value;
      }
    }

    CSV.prototype.encode = function(callback) {
      if (this.mode != 'encode') return;

      if (this.data.length == 0) return '';

      var data = this.data,
          options = this.options,
          header = options.header,
          sample = data[0],
          serialize = this.serialize,
          offset = 0,
          attributes, response;

      if (!callback) {
        response = Array(data.length);
        callback = function(record, index) {
          response[index + offset] = record;
        }
      }

      function serializeLine(record) {
        return record.join(options.cellDelimiter);
      }

      if (header) {
        if (!isArray(header)) {
          attributes = Object.keys(sample);
          header = attributes;
        }
        callback(serializeLine(serialize.array(header)), 0);
        offset = 1;
      }

      var recordType = serializeType(sample),
          map;

      if (recordType == 'array') {
        if (isArray(options.cast)) {
          map = Array(options.cast.length);
          forEach(options.cast, function(type, index) {
            if (isString(type)) {
              map[index] = type.toLowerCase();
            } else {
              map[index] = type;
              serialize[type] = type;
            }
          });
        } else {
          map = Array(sample.length);
          forEach(sample, function(value, index) {
            map[index] = serializeType(value);
          });
        }
        forEach(data, function(record, recordIndex) {
          var serializedRecord = Array(map.length);
          forEach(record, function(value, valueIndex) {
            serializedRecord[valueIndex] = serialize[map[valueIndex]](value);
          });
          callback(serializeLine(serializedRecord), recordIndex);
        });
      } else if (recordType == 'object') {
        attributes = Object.keys(sample);
        if (isArray(options.cast)) {
          map = Array(options.cast.length);
          forEach(options.cast, function(type, index) {
            if (isString(type)) {
              map[index] = type.toLowerCase();
            } else {
              map[index] = type;
              serialize[type] = type;
            }
          });
        } else {
          map = Array(attributes.length);
          forEach(attributes, function(attr, index) {
            map[index] = serializeType(sample[attr]);
          });
        }
        forEach(data, function(record, recordIndex) {
          var serializedRecord = Array(attributes.length);
          forEach(attributes, function(attr, attrIndex) {
            serializedRecord[attrIndex] = serialize[map[attrIndex]](record[attr]);
          });
          callback(serializeLine(serializedRecord), recordIndex);
        });
      }

      if (response) {
        return response.join(options.lineDelimiter);
      } else {
        return this;
      }
    }

    CSV.prototype.forEach = function(callback) {
      return this[this.mode](callback);
    }

    return CSV;
  })();

  CSV.parse = function(data, options) {
    return new CSV(data, options).parse();
  }

  CSV.encode = function(data, options) {
    return new CSV(data, options).encode();
  }

  CSV.forEach = function(data, options, callback) {
    if (arguments.length == 2) {
      callback = options;
    }
    return new CSV(data, options).forEach(callback);
  }

  return CSV;
}));
