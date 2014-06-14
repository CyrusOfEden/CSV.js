CSV.js
======

Simple, blazing-fast CSV parsing/encoding in JavaScript. Full [RFC 4180](http://tools.ietf.org/html/rfc4180) compliance.

Compatible with browsers, AMD, and NodeJS.


Installation
------------

Download `csv.min.js` and reference to it using your preferred method.

If you use **Bower**, or **npm**, install the `comma-separated-values` package.


Instantiation
-------------

Create a CSV instance with `var csv = new CSV(data);`, where `data` is the plain-text CSV file you want to work with. You can supply options with the format `var csv = new CSV(data, { option: value });`.


Options
-------

- **`cast`**: `true` to automatically cast numbers and booleans to their JavaScript equivalents. `false` otherwise. Defaults to `true`.
- **`line`**: The `string` that separates lines from one another. Defaults to `'\r\n'`.
- **`delimiter`**: A 1-character-long `string` that separates values from one another. Defaults to `','`.
- **`header`**: `true` if the first row of the CSV contains header values, or supply your own `array`. Defaults to `false`.
- **`done`**: A `function` that is run immediately after _all rows_ have been parsed. Receives the parsed/encoded CSV as its only argument. Defaults to `undefined`.

You can update an option's value any time after instantiation with `csv.set(option, value)`.


Parsing
-------

By default CSV.js will return an `array of arrays`.

```javascript
var data = '\
1850,20,0,1,1017281\r\n\
1850,20,0,2,1003841\r\n\
...
';
new CSV(data).parse();
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

If the dataset that you've provided is to be parsed, calling `CSV.prototype.forEach` (or `CSV.prototype.each`) and supplying a function will call your function and supply it with the parsed record immediately after it's been parsed.

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


Special Thanks
--------------

- [Benjamin Gruenbaum](https://github.com/benjamingr) for helping improve performance.
