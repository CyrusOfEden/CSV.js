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

    var STANDARD_OPTIONS = {
        lineDelimiter: "\r\n",
        cellDelimiter: ",",
        skip: 0,
        optimize: true,
        headers: false
    };

    function assign() {
        var args = Array.prototype.slice.call(arguments);
        var base = args[0];
        var rest = args.slice(1);
        for (var i = 0, len = rest.length; i < len; i++) {
            var obj = rest[i];
            for (var attr in obj) {
                base[attr] = obj[attr];
            }
        }
        return base;
    }

    var toString = Object.prototype.toString;

    var quoteMark = '"';

    var CSV = {};

    function parse(text, opts, callback) {
        var rows = [];

        // Normalize options and callback
        if (opts == null) {
            opts = {};
        } else if (typeof(opts) === "function") {
            callback = opts;
        }

        opts = assign({}, STANDARD_OPTIONS, opts);
        text = text.trim();

        // Return early in case of empty text
        if (text.length === 0) {
            return callback == null ? [] : false;
        }

        // Set a callback, if one wasn't set already
        if (callback == null) {
            rows = [];
            callback = rows.push.bind(rows);
        }

        // Local references
        var headers = opts.headers;
        var cellDelimiter = opts.cellDelimiter;
        var lineDelimiter = opts.lineDelimiter;

        var line = [];
        var lineNum = 0;
        var skip = opts.skip;

        // If the text doesn't contain any quotation marks,
        // we can safely split on newlines and cell delimiters
        if (text.indexOf(quoteMark) === -1) {
            var lines = text.split(lineDelimiter);
            for (lineNum = skip; lineNum < lines.length; lineNum++) {
                line = lines[lineNum];
                if (line.length > 0) {
                    callback(line.split(cellDelimiter));
                }
            }
            return rows.length > 0 ? rows : true;
        }

        // As far as we're concerned, it's only the first character
        lineDelimiter = lineDelimiter[0];

        var lineDelimiterOffset = lineDelimiter.length;
        var lastIndex = text.length - 1;
        var char;
        var result;

        // Flags
        var cell = true;
        var quoted = false;
        var escaped = false;

        // For optimization
        var constructor = function(arg) {
            return arg;
        };

        // Save an individual cell
        function saveCell(left, right) {
            line.push(escaped ?
                      text.slice(left + 1, right - 1).replace(/""/g, quoteMark) :
                      text.slice(left, right));
            // Reset flags
            cell = true;
            quoted = false;
            escaped = false;
        }

        // Save a line
        function saveLineUnchecked() {
            result = callback(constructor(line));
            line = [];
            return result;
        }

        // In case a certain number of lines want to be skipped
        var saveLine;
        if (skip <= 0) {
            saveLine = saveLineUnchecked;
        } else {
            saveLine = function() {
                if (skip-- > 0) {
                    return;
                }
                saveLine = saveLineUnchecked;
            };
        }

        // The main, tight loop
        for (var cursor = 0, marker = 0; cursor <= lastIndex; cursor++) {
            char = text[cursor];

            if (cell) {
                cell = false;
                if (char === quoteMark) {
                    escaped = true;
                    continue;
                }
            }

            if (cursor === lastIndex) {
                saveCell(marker, cursor + 1);
                saveLine();
            }

            if (escaped && char === quoteMark) {
                quoted = !quoted;
                continue;
            }

            if (escaped && !(escaped && quoted)) {
                continue;
            }

            // New cell
            if (char === cellDelimiter) {
                saveCell(marker, cursor);
                marker = cursor + 1;
            }
            // Newlines
            else if (char === lineDelimiter) {
                saveCell(marker, cursor);
                cursor = cursor + lineDelimiterOffset;
                marker = cursor + 1;
                // Break early if the callback returns false
                if (saveLine() === false) {
                    break;
                }
            }
        }

        return rows.length > 0 ? rows : true;
    }

    CSV.parse = parse;

    return CSV;
}));

