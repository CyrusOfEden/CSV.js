CSV.js
======

Simple CSV parsing/encoding in JavaScript. Full [RFC 4180](http://tools.ietf.org/html/rfc4180) compliance.

Compatible with browsers, AMD, and NodeJS.


Installation
------------

Download `csv.min.js` and reference to it using your preferred method.

If you use **Bower**, or **npm**, install the `comma-separated-values` package.


Instantiation
-------------

Create a CSV instance by running `var csv = new CSV();`. You can supply options with the format `var csv = new CSV({ option: value });`.


Options
-------

- **`delimiter`** Set to a 1-character-long `string` that seperates values from one another. Defaults to `','`.
- **`header`** Set to `true` if the first row of the CSV contains header values, or supply your own (`array`). Defaults to `false`.
- **`stream`** Set to a `function` that is run immediately after _a row_ is parsed. Receives the row's data as its only argument. Defaults to `undefined`.
- **`done`** Set to a `function` that is run immediately after _all rows_ have been parsed. Receives the parsed CSV as its only argument. If `stream` has been set, receives `[]` as its argument. Defaults to `undefined`.

You can update an option's value any time after instantiation with `csv.set(option, value)`.


Parsing
-------

By default CSV.js will return an `array of arrays`.

```javascript
var csv = new CSV();
csv.parse('\
1850,20,0,1,1017281\r\n\
1850,20,0,2,1003841\r\n\
...
');
/*
Returns:
  [
    [1850, 20, 0, 1, 1017281],
    [1850, 20, 0, 2, 1003841]
    ...
  ];
*/
```


If the CSV's first row is a header, set `header` to `true`, and CSV.js will return an `array of objects`.

```javascript
var csv = new CSV({ header: true });
csv.parse('\
year,age,status,sex,population\r\n\
1850,20,0,1,1017281\r\n\
1850,20,0,2,1003841\r\n\
...
');
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
var csv = new CSV({ header: ['year', 'age', 'status', 'sex', 'population'] });
csv.parse('\
1850,20,0,1,1017281\r\n\
1850,20,0,2,1003841\r\n\
...
');
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

By default, `csv.encode` accepts an `array of arrays` or an `array of objects`.

```javascript
var csv = new CSV();
csv.encode([[1850, 20, 0, 1, 1017281], [1850, 20, 0, 2, 1003841]]);
/*
Returns:
  1850,20,0,1,1017281\r\n\
  1850,20,0,2,1003841\r\n\
*/
```


To add headers to an `array of arrays`, set `header` to an `array` of header field values.

```javascript
var csv = new CSV({ header: ["year", "age", "status", "sex", "population"] });
csv.encode([[1850, 20, 0, 1, 1017281], [1850, 20, 0, 2, 1003841]]);
/*
Returns:
  "year","age","status","sex","population"\r\n\
  1850,20,0,1,1017281\r\n\
  1850,20,0,2,1003841\r\n\
*/
```


To add headers to an `array of objects`, just set `header` to `true`.

```javascript
var csv = new CSV({ header: true });
csv.encode([
  { year: 1850, age: 20, status: 0, sex: 1, population: 1017281 },
  { year: 1850, age: 20, status: 0, sex: 2, population: 1003841 }
]);
/*
Returns:
  "year","age","status","sex","population"\r\n\
  1850,20,0,1,1017281\r\n\
  1850,20,0,2,1003841\r\n\
*/
```
