var colorscheme = (function() {
  "use strict";

  var module = {};

  var STATE_NAMES = ['OFF', 'GHOST', 'SUSTAIN', 'ON'];

  module.scheme = null;

  var schemes = {};
  var customCounter = 1;

  module.init = function(schemeName) {
    this.setScheme(schemeName);

    $('#color-scheme').change(function() {
      module.setScheme($('#color-scheme').val());
      tonnetz.draw(true);
    });

    $('#clone-scheme').click(function(event) {
      event.preventDefault();

      // clone the current scheme and add it with a new name
      var name = 'custom' + customCounter;
      var data = $.extend(true, {}, module.scheme.data,
        {'display-name': 'Custom ' + customCounter++});
      module.addScheme(name, data);
      $('#color-scheme').val(name).change();

      showEditor();
    });

    $('#edit-scheme').click(function(event) {
      event.preventDefault();
      showEditor();
    });
  };

  module.addScheme = function(name, data) {
    var displayName = data['display-name'];
    schemes[name] = {
      'data': data,
      'name': name,
      'stylesheet': addStylesheet(data)
    };

    $('#color-scheme')
      .append($("<option></option>")
      .attr("value", name)
      .text(displayName));
  };

  module.setScheme = function(name) {
    this.scheme = schemes[name];
    var data = this.scheme.data;

    this.stroke = [];
    this.fill = [];
    for (var i = 0; i < STATE_NAMES.length; i++) {
      this.stroke.push(data['nodes'][STATE_NAMES[i]]['stroke']);
      this.fill.push(data['nodes'][STATE_NAMES[i]]['fill']);
    }

    this.minorFill = data['faces']['minor']['fill'];
    this.majorFill = data['faces']['major']['fill'];

    $('#edit-scheme').parent().toggle(name.startsWith('custom'));
  };

  /**
   * Called by `tonnetz` before drawing.
   */
  module.update = function() {
    this.scheme.stylesheet.disabled = false;

    for (name in schemes) {
      if (name != this.scheme.name)
        schemes[name].stylesheet.disabled = true;
    }
  };


  var showEditor = function() {
    $('#scheme-code').val(JSON.stringify(module.scheme.data, null, 2));

    collapseNavAndTabs();
    $('#scheme-editor').modal('show');
  };

  var addStylesheet = function(scheme) {
    var style = document.createElement("style");
    style.appendChild(document.createTextNode(""));
    document.head.appendChild(style);
    var sheet = style.sheet || style.styleSheet;

    sheet.insertRule('#tonnetz { background: ' + scheme['background'] + '}', 0);

    $.each(STATE_NAMES, function(i, state) {
      sheet.insertRule('#note-labels .state-' + state + ' { color: ' +
        scheme['nodes'][state]['label'] + ' }', 0);
    });

    $.each(['minor', 'major'], function(i, type) {
      sheet.insertRule('#triad-labels .' + type + ' { color: ' +
        scheme['faces'][type]['label-off'] + '}', 0);
    });

    sheet.disabled = true;

    return sheet;
  };

  return module;
})();
