CSV.js
======

Simple, blazing-fast CSV parsing/encoding in JavaScript. Full [RFC 4180](http://tools.ietf.org/html/rfc4180) compliance.

Compatible with browsers (>IE8), AMD, and NodeJS.


Installation
------------

Download `csv.min.js` and reference to it using your preferred method.

If you use **Bower**, or **npm**, install the `comma-separated-values` package.


Instantiation
-------------

Create a CSV instance with `var csv = new CSV(data);`, where `data` is a plain-text CSV string. You can supply options with the format `var csv = new CSV(data, { option: value });`.


Options
-------

- **`cast`**: `true` to automatically cast numbers and booleans to their JavaScript equivalents. `false` otherwise. Supply your own `array` to override autocasting. Defaults to `true`.
- **`lineDelimiter`**: The `string` that separates lines from one another. If parsing, defaults to autodetection. If encoding, defaults to `'\r\n'`.
- **`cellDelimiter`**: A 1-character-long `string` that separates values from one another. If parsing, defaults to autodetection. If encoding, defaults to `','`.
- **`header`**: `true` if the first row of the CSV contains header values, or supply your own `array`. Defaults to `false`.

You can update an option's value any time after instantiation with `csv.set(option, value)`.


Quickstart
----------

For those accustomed to JavaScript, the CSV.js API:

```javascript
// The instance will set itself up for parsing or encoding on instantiation,
// which means that each instance can only either parse or encode.
// The `options` object is optional
var csv = new CSV(data, [options]);

// If the data you've supplied is an array,
// CSV#encode will return the encoded CSV.
// It will otherwise fail silently.
var encoded = csv.encode();

// If the data you've suopplied is a string,
// CSV#parse will return the parsed CSV.
// It will otherwise fail silently.
var parsed = csv.parse();

// The CSV instance can return the record immediately after
// it's been encoded or parsed to prevent storing the results
// in a large array by calling CSV#forEach and passing in a function.
csv.forEach(function(record) {
  // do something with the record
});

// CSV includes some convenience class methods:
CSV.parse(data, options); // identical to `new CSV(data, options).parse()`
CSV.encode(data, options); // identical to `new CSV(data, options).encode()`
CSV.forEach(data, options, callback); // identical to `new CSV(data, options).forEach(callback)`

// For overriding automatic casting, set `options.cast` to an array.
// For `parsing`, valid array values are: 'Number', 'Boolean', and 'String'.
CSV.parse(data, { cast: ['String', 'Number', 'Number', 'Boolean'] });
// For `encoding`, valid array values are 'Array', 'Object', 'String', 'Null', and 'Primitive'.
CSV.encode(data, { cast: ['Primitive', 'Primitive', 'String'] });
```


Parsing
-------

By default CSV.js will return an `array of arrays`.

```javascript
var data = '\
1850,20,0,1,1017281\r\n\
1850,20,0,2,1003841\r\n\
...
';
new CSV(data).parse()
/*
Returns:
[
  [1850, 20, 0, 1, 1017281],
  [1850, 20, 0, 2, 1003841]
  ...
]
*/
```


If the CSV's first row is a header, set `header` to `true`, and CSV.js will return an `array of objects`.

```javascript
var data = '\
year,age,status,sex,population\r\n\
1850,20,0,1,1017281\r\n\
1850,20,0,2,1003841\r\n\
...
';
new CSV(data, { header: true }).parse();
/*
Returns:
[
  { year: 1850, age: 20, status: 0, sex: 1, population: 1017281 },
  { year: 1850, age: 20, status: 0, sex: 2, population: 1003841 }
  ...
]
*/
```


You may also supply your own header values, if the text does not contain them, by setting `header` to an `array` of field values.

```javascript
var data = '\
1850,20,0,1,1017281\r\n\
1850,20,0,2,1003841\r\n\
...
';
new CSV(data, {
  header: ['year', 'age', 'status', 'sex', 'population']
}).parse();
/*
Returns:
[
  { year: 1850, age: 20, status: 0, sex: 1, population: 1017281 },
  { year: 1850, age: 20, status: 0, sex: 2, population: 1003841 }
  ...
]
*/
```


Encoding
--------

CSV.js accepts an `array of arrays` or an `array of objects`.

```javascript
var data = [[1850, 20, 0, 1, 1017281], [1850, 20, 0, 2, 1003841]...];
new CSV(data).encode();
/*
Returns:
1850,20,0,1,1017281\r\n\
1850,20,0,2,1003841\r\n\
...
*/
```


To add headers to an `array of arrays`, set `header` to an `array` of header field values.

```javascript
var data = [[1850, 20, 0, 1, 1017281], [1850, 20, 0, 2, 1003841]];
new CSV(data, { header: ["year", "age", "status", "sex", "population"] }).encode();
/*
Returns:
"year","age","status","sex","population"\r\n\
1850,20,0,1,1017281\r\n\
1850,20,0,2,1003841\r\n\
*/
```


To add headers to an `array of objects`, just set `header` to `true`.

```javascript
var data = [
  { year: 1850, age: 20, status: 0, sex: 1, population: 1017281 },
  { year: 1850, age: 20, status: 0, sex: 2, population: 1003841 }
];
new CSV(data, { header: true }).encode();
/*
Returns:
"year","age","status","sex","population"\r\n\
1850,20,0,1,1017281\r\n\
1850,20,0,2,1003841\r\n\
*/
```


Streaming
---------

If the dataset that you've provided is to be parsed, calling `CSV.prototype.forEach` and supplying a function will call your function and supply it with the parsed record immediately after it's been parsed.

```javascript
var data = '\
1850,20,0,1,1017281\r\n\
1850,20,0,2,1003841\r\n\
...
';
new CSV(data).forEach(function(array) {
  /*
   * do something with the incoming array
   * array example:
   *   [1850, 20, 0, 1, 1017281]
   */
});
```

Likewise, if you've requested an `array of objects`, you can still call `CSV.prototype.forEach`:

```javascript
var data = '\
year,age,status,sex,population\r\n\
1850,20,0,1,1017281\r\n\
1850,20,0,2,1003841\r\n\
...
';
new CSV(data, { header: true }).forEach(function(object) {
  /*
   * do something with the incoming object
   * object example:
   *   { year: 1850, age: 20, status: 0, sex: 1, population: 1017281 }
   */
});
```


If you're dataset is to be encoded, `CSV.prototype.forEach` will call your function and supply the CSV-encoded line immediately after the line has been encoded:

```javascript
var data = [[1850, 20, 0, 1, 1017281], [1850, 20, 0, 2, 1003841]];
new CSV(data).forEach(function(line) {
  /*
   * do something with the incoming line
   * line example:
   *   "1850,20,0,1,1017281\r\n\""
   */
});
```

Casting
-------

```javascript
// For overriding automatic casting, set `options.cast` to an array.
// For `parsing`, valid array values are: 'Number', 'Boolean', and 'String'.
CSV.parse(data, { cast: ['String', 'Number', 'Number', 'Boolean'] });
// For `encoding`, valid array values are 'Array', 'Object', 'String', 'Null', and 'Primitive'.
CSV.encode(data, { cast: ['Primitive', 'Primitive', 'String'] });
```


Convenience Methods
-------------------

```javascript
CSV.parse(data, options) // identical to `new CSV(data, options).parse()`
CSV.encode(data, options) // identical to `new CSV(data, options).encode()`
CSV.forEach(data, options, callback) // identical to `new CSV(data, options).forEach(callback)`
```


Special Thanks
--------------

- [Benjamin Gruenbaum](https://github.com/benjamingr) for helping improve performance.
