/* jshint esversion: 6 */

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

  /* =========================================
   * Constants ===============================
   * ========================================= */
  const CELL_DELIMITERS = [",", ";", "\t", "|", "^"];
  const LINE_DELIMITERS = ["\r\n", "\r", "\n"];

  const STANDARD_DECODE_OPTS = {
    skip: 0,
    limit: false,
    header: false,
    cast: false
  };

  const STANDARD_ENCODE_OPTS = {
    delimiter: CELL_DELIMITERS[0],
    newline: LINE_DELIMITERS[0],
    skip: 0,
    limit: false,
    header: false
  };

  const quoteMark = '"';
  const doubleQuoteMark = '""';
  const quoteRegex = /"/g;
  const doubleQuoteRegex = /""/g;

  /* =========================================
   * Utility Functions =======================
   * ========================================= */
  function assign() {
    const args = Array.prototype.slice.call(arguments);
    const base = args[0];
    const rest = args.slice(1);
    for (let i = 0, len = rest.length; i < len; i++) {
      for (let attr in rest[i]) {
        base[attr] = rest[i][attr];
      }
    }
    return base;
  }

  function map(collection, fn) {
    let results = [];
    for (let i = 0, len = collection.length; i < len; i++) {
      results[i] = fn(collection[i], i);
    }
    return results;
  }

  const getType = (obj) => Object.prototype.toString.call(obj).slice(8, -1);

  const getLimit = (limit, len) => limit === false ? len : limit;

  const getter = (index) => `d[${index}]`;

  const getterCast = (value, index) => {
    if (!isNaN(Number(value))) {
      return `Number(${getter(index)})`;
    } else if (value == "false" || value == "true" || value == "t" || value == "f") {
      return `${getter(index)} === "true" || ${getter(index)} === "t"`;
    } else {
      return getter(index);
    }
  };

  function buildObjectConstructor(fields, sample, cast) {
    let body = ["let object = new Object()"];
    let setter = (attr) => `object[${JSON.stringify(attr)}] = `;
    if (cast === true) {
      body = body.concat(map(fields, (attr, idx) => setter(attr) + getterCast(sample[idx], idx)));
    } else {
      body = body.concat(map(fields, (attr, idx) => setter(attr) + getter(idx)));
    }
    body.push("return object;");
    return new Function("d", body.join(";\n"));
  }

  function buildArrayConstructor(sample, cast) {
    let body = ["let row = new Array(" + sample.length + ")"];
    let setter = (idx) =>  `row[${idx}] = `;
    if (cast === true) {
      body = body.concat(map(sample, (val, idx) => setter(idx) + getterCast(val, idx)));
    } else {
      body = body.concat(map(sample, (_, idx) => setter(idx) + getter(idx)));
    }
    body.push("return row;");
    return new Function("d", body.join(";\n"));
  }

  function frequency(coll, needle, limit = false) {
    let count = 0;
    let lastIndex = 0;
    let maxIndex = getLimit(limit, coll.length);

    while (lastIndex < maxIndex) {
      lastIndex = coll.indexOf(needle, lastIndex);
      if (lastIndex === -1) break;
      count++;
    }

    return count;
  }

  function mostFrequent(coll, needles, limit) {
    let max = 0;
    let detected;

    for (let cur = needles.length - 1; cur >= 0; cur--) {
      if (frequency(coll, needles[cur], limit) > max) {
        detected = needles[cur];
      }
    }

    return detected || needles[0];
  }

  function unsafeParse(text, opts, fn) {
    let lines = text.split(opts.newline);

    if (opts.skip > 0) {
      lines.splice(opts.skip);
    }

    let fields;
    let constructor;

    function cells(line) {
      return line.split(opts.delimiter);
    }

    if (opts.header) {
      if (opts.header === true) {
        fields = cells(lines.shift());
      } else if (getType(opts.header) === "Array") {
        fields = opts.header;
      }

      constructor = buildObjectConstructor(fields, cells(lines[0]), opts.cast);
    } else {
      constructor = buildArrayConstructor(cells(lines[0]), opts.cast);
    }

    for (let cur = 0, lim = getLimit(opts.limit, lines.length); cur < lim; cur++) {
      let row = cells(lines[cur]);
      if (row.length > 1) {
        fn(constructor(row));
      }
    }

    return true;
  }

  let iota = (() => {
    let n = 0;
    return () => n++;
  })();

  function safeParse(text, opts, fn) {
    let delimiter = opts.delimiter;
    let newline = opts.newline;

    let skip = opts.skip;

    let EOL = iota();
    let EOF = iota();
    let cur = 0;
    let curLine = 0;
    let len = text.length;

    let eolNext;

    function nextToken() {
      if (cur >= len) {
        return EOF;
      }
      if (eolNext) {
        eolNext = false;
        return EOL;
      }
      let mark = cur;
      let n;
      if (text[cur] === quoteMark) {
        while (cur++ < len) {
          if (text[cur] === quoteMark) {
            if (text[cur+1] !== quoteMark) {
              break;
            }
            cur += 1;
          }
        }
        cur += 2;
        n = text[cur+1];
        if (n === newline[0]) {
          eol = true;
          if (newlineLen > 1 && text[cur+2] === newline[1]) cur++;
        } else if (n === newline[1]) {
          eol = true;
        }

        return text.slice(mark + 1, cur).replace(doubleQuoteRegex, quoteMark);
      }

      while (cur < len) {
        let delta = 1;
        n = text[cur++];
        if (n === newline[0]) {
          eol = true;
          if (text[cur] === newline[1]) {
            cur++;
            delta++;
          }
        }
        return text.slice(mark, cur - delta);
      }

      return text.slice(mark);
    }

    let row;
    for (let token = nextToken(); token !== EOF; token = nextToken()) {
      if (skip-- > 0) {
        while (token !== EOL && token !== EOF) {
          token = nextToken();
        }
      }

      row = [];
      while (token !== EOL && token !== EOF) {
        row.push(token);
        token = nextToken();
      }
      fn(row);
    }

    return true;
  }

  function encodeCells(line, delimiter, newline) {
    let row = line.slice(0);
    for (let i = 0, len = row.length; i < len; i++) {
      if (typeof row[i] !== "string") {
        continue;
      }
      if (row[i].indexOf(quoteMark) !== -1) {
        row[i] = row[i].replace(quoteRegex, doubleQuoteMark);
      }
      if (row[i].indexOf(delimiter) !== -1 || row[i].indexOf(newline) !== -1) {
        row[i] = quoteMark + row[i] + quoteMark;
      }
    }
    return row.join(delimiter);
  }

  function encodeArrays(coll, opts, fn) {
    let delimiter = opts.delimiter;
    let newline = opts.newline;

    if (opts.header && getType(opts.header) === "Array") {
      fn(encodeCells(opts.header, delimiter, newline));
    }

    for (let cur = 0, lim = getLimit(opts.limit, coll.length); cur < lim; cur++) {
      fn(encodeCells(coll[cur], delimiter, newline));
    }

    return true;
  }

  function encodeObjects(coll, opts, fn) {
    let delimiter = opts.delimiter;
    let newline = opts.newline;
    let header;
    let row;

    header = [];
    row = [];
    for (let key in coll[0]) {
      header.push(key);
      row.push(coll[0][key]);
    }

    if (opts.header === true) {
      fn(encodeCells(header, delimiter, newline));
    } else if (getType(opts.header) === "Array") {
      fn(encodeCells(opts.header, delimiter, newline));
    }

    fn(encodeCells(row, delimiter));

    for (let cur = 1, lim = getLimit(opts.limit, coll.length); cur < lim; cur++) {
      row = [];
      for (let key = 0, len = header.length; key < len; key++) {
        row.push(coll[cur][header[key]]);
      }
      fn(encodeCells(row, delimiter, newline));
    }

    return true;
  }

  function read(text, opts, fn) {
    let rows;

    if (getType(opts) === "Function") {
      fn = opts;
      opts = {};
    } else if (getType(fn) !== "Function") {
      rows = [];
      fn = rows.push.bind(rows);
    }

    opts = assign({}, STANDARD_DECODE_OPTS, opts);

    if (!opts.delimiter || !opts.newline) {
      let limit = Math.min(48, Math.floor(text.length / 20), text.length);
      opts.delimiter = opts.delimiter || mostFrequent(text, CELL_DELIMITERS, limit);
      opts.newline = opts.newline || mostFrequent(text, LINE_DELIMITERS, limit);
    }

    return (text.indexOf(quoteMark) === -1 ? unsafeParse : safeParse)(text, opts, fn) &&
           (rows.length > 0 ? rows : true);
  }

  function write(coll, opts, fn) {
    let lines;

    if (getType(opts) === "Function") {
      fn = opts;
      opts = {};
    } else if (getType(fn) !== "Function") {
      lines = [];
      fn = lines.push.bind(lines);
    }

    opts = assign({}, STANDARD_ENCODE_OPTS, opts);

    if (opts.skip > 0) {
      coll = coll.slice(opts.skip);
    }

    return (getType(coll[0]) === "Array" ? encodeArrays : encodeObjects)(coll, opts, fn) &&
           (lines.length > 0 ? lines.join(opts.newline) : true);
  }

  return {
    read: read,
    parse: read,
    write: write,
    encode: write
  };
}));

