CSVjs
=====

Basic CSV parsing/encoding in JavaScript.


Instatiation
------------

Instantiate CSV by calling `new CSV()`. You can supply options with the format `new CSV({ option: value })`.

Available options:
```javascript
{
  delimiter: string // the character(s) seperating values in a row. Defaults to ','
  header: boolean   // whether or not the first row of the CSV contains the fields. Defaults to false.
  stream: function  // A function to call after every row is parsed
  done: function    // A funciton to call after all rows are parsed
}
```

You can update an option's value any time after instantiation with `csv.set(option, value)`.


Parsing
-------

If the CSV contains headers, `.parse()` will return an object with two properties: `fields` and `data`.

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

The response would be:

```javascript
{
  fields: ["Year", "Age", "Marital Status", "Sex", "People"],
  data: [
    {Year: 1850, Age: 20, Marital Status: 0, Sex: 1, People: 1017281},
    {Year: 1850, Age: 20, Marital Status: 0, Sex: 2, People: 1003841},
    ...
  ]
}
```

If the csv does not contain headers, and `header` is set to false, the data property will contain arrays. With the same data as above, the response would be:

```javascript
{
  data: [
    [1850, 20, 0, 1, 1017281],
    [1850, 20, 0, 2, 1003841],
    ...
  ]
}
```


Encoding
--------

Pass an array of objects to `csv.encode()` and it'll return a CSV. If the `csv` instance has `header` set to `true`, the first row will contain the fields.


Events
------

If memory is an issue, you can have CSVjs call a function after each row is parsed (or encoded) by setting `stream` to a function that receives an object or an array, as appropriate.

When all the CSV has been parsed (or encoded), CSVjs will call `done`, and supply the full response. **Note that the response will be empty if `stream` has been set**.