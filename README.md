CSV.js
======

Basic CSV parsing/encoding in JavaScript.


Instantiation
-------------

Instantiate CSV by calling `new CSV()`. You can supply options with the format `new CSV({ option: value })`.

Available options:
```javascript
{
  delimiter: string          // the character(s) separating values in a row. Defaults to ','.
  header: boolean or array   // whether or not the first row of the CSV contains the fields. Defaults to false.
  stream: function           // A function to call after every row is parsed. Defaults to undefined.
  done: function             // A function to call after all rows are parsed. Defaults to undefined.
  detailed: boolean          // Return an object with details (true) or an array of the data (false). Defaults to false.
}
```

You can update an option's value any time after instantiation with `csv.set(option, value)`.


Parsing
-------

If the CSV contains headers, `.parse()` parse will return objects with properly-set properties.

With the following example:

```javascript
var csv = new CSV({ header: true });
csv.parse('\
  "Year","Age","Marital Status","Sex","People"\n\
  1850,20,0,1,1017281\n\
  1850,20,0,2,1003841\n\
  1850,25,0,1,862547\n\
  1850,25,0,2,799482\n\
  1850,30,0,1,730638\n\
  1850,30,0,2,639636\n\
  1850,35,0,1,588487\n\
  1850,35,0,2,505012\n\
  1850,40,0,1,475911\n\
  1850,40,0,2,428185\
');
```

Optionally, supplying your own header field:

```javascript
var csv = new CSV({ header: ["Year", "Age", "Marital Status", "Sex", "People"] });
csv.parse('\
  1850,20,0,1,1017281\n\
  1850,20,0,2,1003841\n\
  1850,25,0,1,862547\n\
  1850,25,0,2,799482\n\
  1850,30,0,1,730638\n\
  1850,30,0,2,639636\n\
  1850,35,0,1,588487\n\
  1850,35,0,2,505012\n\
  1850,40,0,1,475911\n\
  1850,40,0,2,428185\
');
```

The response would be:

```javascript
[
  {Year: 1850, Age: 20, Marital Status: 0, Sex: 1, People: 1017281},
  {Year: 1850, Age: 20, Marital Status: 0, Sex: 2, People: 1003841},
  ...
]
```

If `header` is set to false, the response will contain arrays as opposed to objects.


Encoding
--------

Pass an **array of objects** to `csv.encode()` to get CSV, sans headers.
Run `csv.set("header", true)` to add headers.

Pass an **array of arrays** to `csv.encode()` to get CSV, sans headers.
Run `csv.set("header", headerValues)`, where `headerValues` is an array to add your own header.


Events
------

If memory is an issue, you can have CSV.js call a function after each row is parsed (or encoded) by setting `stream` to a function that receives an object or an array, as appropriate.

When all the CSV has been parsed (or encoded), CSV.js will call `done`, and supply the full response. **Note that the response will be empty if `stream` has been set**.
