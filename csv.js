(function() {
  'use strict';

  if (typeof define === "function" && define.amd) {
    define(function() { return CSV; });
  } else if (typeof module === "object" && module.exports) {
    module.exports = CSV;
  } else if (window) {
    window.CSV = CSV;
  }
})();
