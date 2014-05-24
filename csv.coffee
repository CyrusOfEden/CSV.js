confirm = {
  number: (possible) ->
    !isNaN(Number(possible))
  function: (possible) ->
    !!(possible && possible.constructor && possible.call && possible.apply)
}

format = {
  decode: (string) ->
    if string == ""
      string
    else if confirm.number(string)
      Number(string)
    else
      string.replace(/\"/gi, '').trim()
  encode: (array) ->
    line = for element in array
      if confirm.number(element) then "\"#{element}\"" else element
    line.join(",") + "\n"
  split: (text, delimiter) ->
    format.decode(item) for item in text.split(delimiter)
}


class CSV

  # Set options for the CSV instance
  constructor: (@options = {}) ->
    @options.delimiter ||= ","
    @options.header ||= false
    @options.stream ||= undefined
    @options.done ||= undefined

  set: (setting, value) =>
    @options[setting] = value

  stream: (method) =>
    if confirm.function(method)
      @options.stream = method
    else
      "No function provided."

  done: (method) =>
    if confirm.function(method)
      @options.done = method
    else
      "No function provided."

  # Encode supplied array into CSV
  encode: (array) =>
    if @options.header
      encoded = format.encode(k for k, _ of array[0])
      data = array.slice(1)
    else
      encoded = ""
      data = array
    for object in data
      values = (v for _, v of object)
      encoded += format.encode(values)
    encoded


  # Parse the inputted text, assuming that
  # string values are not delimited by quotes
  parse: (text) =>
    # Callbacks, Empty data array, split rows
    complete = @options.complete
    stream = @options.stream
    header = @options.header
    supplied = header instanceof Array
    data = []
    rows = text.split("\n").filter((item) -> (item.length > 1 && item[0] != ""))

    # If there's a header
    if @options.header
      # Set the fields
      fields = if supplied then header else format.split(rows[0], @options.delimiter)
      # For each row, other than the header
      for row in (if supplied then rows else rows.slice(1))
        # Create a new object
        object = {}
        # Loop through the row's values, and apply those to the object
        for value, index in format.split(row, @options.delimiter)
          # Consider making the value a number
          object[fields[index]] = format.decode(value)
        # If stream is a function
        if confirm.function(stream)
          stream.call(@, object)
        # Otherwise
        else
          # Push the object to data
          data.push(object)
      # Return a JSON object containing the fields array and the data array
      response = {
        fields: fields,
        data: data
      }
    # If there isn't a header
    else
      # Go through each row
      for row in rows
        # Empty object
        object = []
        # Go through each value
        for value, index in format.split(row, @options.delimiter)
          # Set appropriate type
          object.push(format.decode(value))
        # If stream is a function
        if confirm.function(stream)
          stream.call(@, object)
        # Otherwise
        else
          # Push the object to data
          data.push(object)
      # Return a JSON object containing the data array
      response = {
        data: data
      }
    # Call the complete function if provided
    complete.call(@, response) if confirm.function(complete)
    # Return response
    response


window.CSV = CSV
