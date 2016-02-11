var colorscheme = (function() {
  "use strict";

  var module = {};

  var STATE_NAMES = ['OFF', 'GHOST', 'SUSTAIN', 'ON'];

  module.scheme = null;

  var schemes = {};
  var customSchemes = {};
  var customCounter;
  var editor = null;

  module.init = function(schemeName) {
    loadCustomSchemes();

    this.setScheme(schemeName);

    $('#color-scheme').change(function() {
      module.setScheme($('#color-scheme').val());
      tonnetz.draw(true);
    });

    editor = new JSONEditor(document.getElementById('scheme-editor-holder'), {
      schema: jsonSchema,
      theme: 'bootstrap3',
      iconlib: 'bootstrap3',
      object_layout: 'grid',
      disable_edit_json: true,
      disable_properties: true
    });

    $('#clone-scheme').click(function(event) {
      event.preventDefault();

      // clone the current scheme and add it with a new name
      var name = 'custom' + customCounter;
      var data = $.extend(true, {}, module.scheme.data,
        {'name': 'Custom'});
      module.addScheme(name, data);
      $('#color-scheme').val(name).change();

      showEditor();
    });

    $('#edit-scheme').click(function(event) {
      event.preventDefault();
      showEditor();
    });

    $('#delete-scheme').click(function(event) {
      event.preventDefault();
      deleteScheme();
    });

    $('#save-scheme').click(saveScheme);
  };

  /**
   * Add or replace a color scheme.
   */
  module.addScheme = function(name, data, custom) {
    var displayName = data['name'];

    if (schemes[name]) {  // Replacing an existing scheme
      // Remove old stylesheet
      $(schemes[name].stylesheet.ownerNode).remove();

      // Change option text
      $('#color-scheme option')
        .filter(function() { return $(this).attr('value') == name; })
        .text(displayName);
    } else {
      $('#color-scheme')
        .append($('<option></option>')
        .attr('value', name)
        .text(displayName));
    }

    schemes[name] = {
      'data': data,
      'name': name,
      'stylesheet': addStylesheet(data)
    };
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
    editor.setValue(module.scheme.data);

    //collapseNavAndTabs();
    $('#scheme-editor').modal('show');
  };

  var saveScheme = function() {
    var name = module.scheme.name;

    customSchemes[name] = editor.getValue();
    module.addScheme(name, customSchemes[name]);
    module.setScheme(name);
    tonnetz.draw(true);

    storeCustomSchemes();

    $('#scheme-editor').modal('hide');
  };

  var deleteScheme = function() {
    var name = module.scheme.name;

    $(module.scheme.stylesheet.ownerNode).remove();
    delete schemes[name];
    delete customSchemes[name];
    var $option = $('#color-scheme option')
        .filter(function() { return $(this).attr('value') == name; });
    $('#color-scheme').val($option.prev().attr('value'));
    $option.remove();
    $('#color-scheme').change();

    storeCustomSchemes();
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

  var loadCustomSchemes = function() {
    customCounter = Number(storage.get('colorscheme.customCounter', '1'));
    customSchemes = JSON.parse(storage.get('colorscheme.customSchemes', '{}'));
    for (name in customSchemes) {
      module.addScheme(name, customSchemes[name]);
    }
  };

  var storeCustomSchemes = function() {
    storage.set('colorscheme.customCounter', customCounter);
    storage.set('colorscheme.customSchemes', JSON.stringify(customSchemes));
  };

  var jsonSchema = {
    "type": "object",
    "headerTemplate": "{{ self.name }}",
    "options": {
      "disable_collapse": true
    },
    "properties": {
      "name": {
        "type": "string"
      },
      "background": {
        "type": "string",
        "format": "color"
      },
      "nodes": {
        "type": "object",
        "properties": {
          "OFF": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string",
                "format": "color"
              },
              "fill": {
                "type": "string",
                "format": "color"
              },
              "stroke": {
                "type": "string",
                "format": "color"
              }
            },
            "additionalProperties": false
          },
          "GHOST": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string",
                "format": "color"
              },
              "fill": {
                "type": "string",
                "format": "color"
              },
              "stroke": {
                "type": "string",
                "format": "color"
              }
            },
            "additionalProperties": false
          },
          "SUSTAIN": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string",
                "format": "color"
              },
              "fill": {
                "type": "string",
                "format": "color"
              },
              "stroke": {
                "type": "string",
                "format": "color"
              }
            },
            "additionalProperties": false
          },
          "ON": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string",
                "format": "color"
              },
              "fill": {
                "type": "string",
                "format": "color"
              },
              "stroke": {
                "type": "string",
                "format": "color"
              }
            },
            "additionalProperties": false
          }
        },
        "additionalProperties": false
      },
      "faces": {
        "type": "object",
        "properties": {
          "major": {
            "type": "object",
            "properties": {
              "label-off": {
                "type": "string",
                "format": "color"
              },
              "label-on": {
                "type": "string",
                "format": "color"
              },
              "fill": {
                "type": "string",
                "format": "color"
              }
            },
            "additionalProperties": false
          },
          "minor": {
            "type": "object",
            "properties": {
              "label-off": {
                "type": "string",
                "format": "color"
              },
              "label-on": {
                "type": "string",
                "format": "color"
              },
              "fill": {
                "type": "string",
                "format": "color"
              }
            },
            "additionalProperties": false
          }
        },
        "additionalProperties": false
      }
    },
    "additionalProperties": false
  };

  return module;
})();
