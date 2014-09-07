(function() {
  'use strict';

  var ESCAPE_DELIMITERS = ['|', '^'],
      CELL_DELIMITERS = [',', ';', '\t', '|', '^'],
      LINE_DELIMITERS = ['\r\n', '\r', '\n'];

  function isObject(object) {
    var type = typeof object;
    return type === 'function' || type === 'object' && !!object;
  }
  function isArray(object) {
    return toString.call(object) == '[object Array]';
  }
  function isString(object) {
    return toString.call(object) === '[object String]';
  }
  function isNumber(string) {
    return !isNaN(Number(string));
  }
  function isBoolean(string) {
    return string == false || string == true;
  }
  function isPresent(value) {
    return value == null;
  }

  function fallback(value, fallback) {
    return isPresent(value) ? value : fallback;
  }

  function forEach(collection, iterator) {
    var currentIndex = 0,
        collectionLength = collection.length;
    while (currentIndex < collectionLength) {
      if (iterator(collection[currentIndex], currentIndex) === false) break;
      currentIndex++;
    }
    return collection;
  }

  function castCell(value, index) {
    if (isNumber(value)) {
      return 'Number(attrs[' + index + '])';
    } else if (isBoolean(value)) {
      return 'Boolean(attrs[' + index + '] == true)';
    } else {
      return 'String(attrs[' + index + '])';
    }
  }

  function buildConstructor(values, attrs) {
    var definition = [];
    if (arguments.length == 1) {
      forEach(values, function(value, index) {
        definition.push(castCell(value, index));
      });
      definition = 'return [' + definition.join(',') + ']';
    } else {
      forEach(values, function(value, index) {
        definition.push('"' + attrs[index] + '": ' + castCell(value, index));
      });
      definition = 'return {' + definition.join(',') + '}';
    }
    return new Function('attrs', definition);
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
        header: fallback(options.header, true),
        lineDelimiter: fallback(options.lineDelimiter, '\r\n'),
        cellDelimiter: fallback(options.cellDelimiter, ',')
      }

      if (this.isParser()) {
        if (!this.options.lineDelimiter) {
          this.options.lineDelimiter = detectDelimiter(this.data, LINE_DELIMITERS);
        }
        if (!this.options.cellDelimiter) {
          this.options.cellDelimiter = detectDelimiter(this.data, CELL_DELIMITERS);
        }
        this.data = normalizeCSV(this.data, this.options.lineDelimiter);
      }
    }

    function invoke(method, constructor, attributes) {
      method(new constructor(attributes));
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
      if (this.data.trim().length === 0) return [];

      var options = this.options,
          header = options.header,
          current = { cell: '', line: [] },
          flag, record, response;

      if (!callback) {
        response = [];
        callback = function(record) {
          response.push(record);
        }
      }

      function resetFlags() { flag = { escaped: false, quote: false, cell: true }; }
      function resetCell() { current.cell = ''; }
      function resetLine() { current.line = []; }

      resetFlags();

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
            record = buildConstructor(current.line, header);
            saveLine = function() {   invoke(callback, record, current.line); };
            saveLine();
          } else {
            header = current.line;
          }
        } else {
          if (!record) record = buildConstructor(current.line);
          saveLine = function() { invoke(callback, record, current.line); };
          saveLine();
        }
      }

      if (options.lineDelimiter.length == 1) {
        saveLastCell = saveCell;
      }

      var data = this.data,
          dataLength = data.length,
          cellDelimiter = options.cellDelimiter.charCodeAt(0),
          lineDelimiter = options.lineDelimiter.charCodeAt(options.lineDelimiter.length - 1),
          currentIndex, cellStart, currentChar;

      for (currentIndex = 0, cellStart = 0; currentIndex <dataLength; currentIndex++) {
        currentChar = data.charCodeAt(currentIndex);

        if (flag.cell) {
          flag.cell = false;
          if (currentChar == 34) {
            flag.escaped = true;
            continue;
          }
        }

        if (flag.escaped && currentChar == 34) {
          flag.quote = !flag.quote;
          continue;
        }

        if ((flag.escaped && flag.quote) || !flag.escaped) {
          if (currentChar == cellDelimiter) {
            saveCell(current.cell + data.slice(cellStart, currentIndex));
            cellStart = currentIndex + 1;
          } else if (currentChar == lineDelimiter) {
            saveLastCell(current.cell + data.slice(cellStart, currentIndex));
            cellStart = currentIndex + 1;
            saveLine();
            resetLine();
          }
        }
      }

      return response;
    }

    CSV.prototype.encode = function(callback) {

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

  if (typeof define === "function" && define.amd) {
    define('CSV', [], function() {
      return CSV;
    });
  } else if (typeof module === "object" && module.exports) {
    module.exports = CSV;
  } else if (window) {
    window.CSV = CSV;
  }
})();
