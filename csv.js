(function() {
  'use strict';

  // Environment variables
  var AMD = (typeof define === "function" && define.amd),
      NODE = (typeof module === "object" && module.exports);

  var FLOAT = /^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/;
  var PRESENT = function(possible) { return !!(possible && possible !== null); };

  var CSV = function(data, set) {
    this.data = data;
    set = PRESENT(set) ? set : {};

    this.options = {
      cast: PRESENT(set.cast) ? set.cast : true,
      delimiter: PRESENT(set.delimiter) ? set.delimiter : ",",
      header: PRESENT(set.header) ? set.header : false,
      done: PRESENT(set.done) ? set.done : undefined
    };

    return this;
  };

  CSV.prototype.set = function(option, value) {
    this.options[option] = value;
    return this;
  };

  CSV.format = {
    cast: function(string) {
      return FLOAT.test(string) ? Number(string) : string;
    },
    stringify: function(string) {
      return FLOAT.test(string) ? string : '"' + string.replace(/\"/, '""') + '"';
    },
    encode: function(array, delimiter) {
      return array.map(CSV.format.stringify).join(delimiter) + "\r\n";
    }
  };

  CSV.prototype.encode = function(stream) {
    stream = stream || [].push;

    var data = this.data,
        response = [],
        kind = data[0] instanceof Array ? "array" : "object",
        header = this.options.header,
        fields = header instanceof Array ? header : [],
        delimiter = this.options.delimiter,
        complete = this.options.done,

        save = function(record) {
          stream.call(response, CSV.format.encode(record, delimiter));
        };

    if (kind === "object" && !fields.length) fields = Object.keys(data[0]);
    if (header) save(fields);

    if (kind === "object") {
      data.forEach(function(record) {
        record = fields.map(function(key) { return record[key]; });
        save(record);
      });
    } else {
      data.forEach(function(record) { save(record); });
    }
    // Return as appropriate
    return complete ? complete(response) : response.join("");
  };

  CSV.prototype.parse = function(stream) {
    stream = stream || [].push;

    var data = this.data,
        response = [],
        complete = this.options.done,
        header = this.options.header,
        fields = header instanceof Array ? header : [],

        _n = 0,
        _lenf = fields.length,

        current = { row: [], cell: "" },
        flag = { escaped: false, quote: false, cell: true },

        Record = function(values) {
          for (_n = 0; _n < _lenf; ++_n) this[fields[_n]] = values[_n];
        },

        reset,
        save,
        send;


    fields.forEach(function(field) { Record.prototype[field] = undefined; });

    reset = function() {
      current.cell = "";
      flag = { escaped: false, quote: false, cell: true };
    };

    if (this.options.cast) {
      save = function(cell) {
        current.row.push(
          CSV.format.cast(
            (flag.escaped ? cell.slice(1, -1).replace(/""/g, '"') : cell).trim()
          )
        );
      };
    } else {
      save = function(cell) {
        current.row.push(
          (flag.escaped ? cell.slice(1, -1).replace(/""/g, '"') : cell).trim()
        );
      };
    }

    if (_lenf) {
      send = function() {
        stream.call(response, new Record(current.row));
      };
    } else if (header) {
      send = function() {
        if (_lenf) {
          stream.call(response, new Record(current.row));
        } else {
          fields = current.row, _lenf = fields.length;
        }
      };
    } else {
      send = function() {
        stream.call(response, current.row);
      };
    }

    var start,
        _i,
        _lent = data.length,
        _delim = this.options.delimiter.charCodeAt(0),
        sign;

    for (start = 0, _i = 0; _i < _lent; ++_i) {
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
          reset();
        } else if (sign === 10) {
          save((current.cell + data.slice(start, _i)).slice(0, -1));
          start = _i + 1;
          send();
          reset();
          current.row = [];
        } else if (_i === _lent - 1) {
          save(current.cell + data.slice(start, _i + 1));
          send();
        }
      }
    }
    // Return as appropriate
    return complete ? complete(response) : response;
  };

  CSV.prototype.forEach = function(stream) {
    return this.data instanceof Array ? this.encode(stream) : this.parse(stream);
  };

  CSV.prototype.each = CSV.prototype.forEach;

  // Define this module
  if (AMD) {
    define(CSV);
  } else if (NODE) {
    module.exports = CSV;
  } else {
    this.CSV = CSV;
  }

}).call(this);