var storage = (function() {
  "use strict";

  var module = {};

  module.enabled = (function() {
    var test = 'test';
    try {
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
  })();
  
  module.init = function() {};

  module.get = function(key, defaultValue) {
    if(defaultValue === undefined)
      defaultValue = null;

    if(module.enabled) {
      var value = localStorage.getItem(key);
      if (value === null)
        return defaultValue;
      else
        return value;
    } else return defaultValue;
  };

  module.set = function(key, value) {
    if(module.enabled) {
      var value = localStorage.setItem(key, value);
      if (value === null)
        return defaultValue;
      else
        return value;
    };
  };

  return module;
})();
