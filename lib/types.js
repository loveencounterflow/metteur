(function() {
  'use strict';
  var GUY, debug, help, id, info, types, urge, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({debug, info, whisper, warn, urge, help} = GUY.trm.get_loggers('METTEUR/types'));

  module.exports = types = new (require('intertype')).Intertype();

  //-----------------------------------------------------------------------------------------------------------
  types.declare.mtr_new_template({
    $template: 'text',
    $open: 'nonempty.text',
    $close: 'nonempty.text',
    /* TAINT would use default `optional.function` but for outstanding bug in `intertype` */
    $format: 'function',
    // extras:       false
    default: {
      template: null,
      open: '{',
      close: '}',
      /* TAINT would use default `null` but for outstanding bug in `intertype` */
      // format:       null
      format: id = function(value, key) {
        return value;
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  types.declare.mtr_template_fill({
    isa: function(x) {
      return true;
    },
    default: null
  });

  //-----------------------------------------------------------------------------------------------------------
  types.declare.mtr_orientation(function(x) {
    return x === 'ltr' || x === 'rtl';
  });

  //-----------------------------------------------------------------------------------------------------------
  types.declare.mtr_layouts(function(x) {
    var key, value;
    if (!this.isa.object(x)) {
      return false;
    }
    for (key in x) {
      value = x[key];
      if (!this.isa.nonempty.text(key)) {
        return false;
      }
      if (!this.isa.mtr_layout(value)) {
        return false;
      }
    }
    return true;
  });

  //-----------------------------------------------------------------------------------------------------------
  types.declare.mtr_layout({
    $name: 'nonempty.text',
    $recto: 'optional.mtr_sheet_side_layout',
    $verso: 'optional.mtr_sheet_side_layout'
  });

  //-----------------------------------------------------------------------------------------------------------
  types.declare.mtr_sheet_side_layout({
    $left: 'list.of.positive1.integer',
    $right: 'list.of.positive1.integer'
  });

  //-----------------------------------------------------------------------------------------------------------
  types.declare.mtr_impose_cfg({
    $input: 'nonempty.text',
    $output: 'nonempty.text',
    $overwrite: 'boolean',
    $split: 'integer',
    $orientation: 'mtr_orientation',
    $layout: 'mtr_layout',
    $layouts: 'mtr_layouts',
    default: {
      input: null,
      output: null,
      overwrite: false,
      split: 0,
      orientation: 'ltr', // or 'rtl' which will invert the orientation of all pages, allowing for CJK, Arabic RTL books
      layout: {
        name: 'pps16'
      },
      layouts: {
        pps16: {
          name: 'pps16',
          recto: {
            left: [4, 13, 16, 1],
            right: [5, 12, 9, 8]
          },
          verso: {
            left: [6, 11, 10, 7],
            right: [3, 14, 15, 2]
          }
        }
      }
    },
    create: function(cfg) {
      var R, layout;
      R = {...this.registry.mtr_impose_cfg.default, ...cfg};
      if (!((R.recto != null) && (R.verso != null))) {
        if ((layout = R.layouts[R.layout.name]) == null) {
          throw new Error(`^metteur/types@23^ unknown layout name ${rpr(R.layout.name)}`);
        }
        R.layout = {...layout, ...R.layout};
      }
      return R;
    }
  });

  //-----------------------------------------------------------------------------------------------------------
// types.declare.mtr_cli_impose_cfg 'mtr_impose_cfg'
// $input:       'nonempty.text'
// $output:      'nonempty.text'
// $overwrite:   'boolean'
// $split:       'integer'
// default:
//   input:      null
//   output:     null
//   overwrite:  false
//   split:      0

}).call(this);

//# sourceMappingURL=types.js.map