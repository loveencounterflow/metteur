(function() {
  'use strict';
  var GUY, PATH, debug, declare, echo, help, id, info, known_layouts, rpr, types, urge, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({debug, info, whisper, warn, urge, help} = GUY.trm.get_loggers('METTEUR/types'));

  ({rpr, echo} = GUY.trm);

  module.exports = types = new (require('intertype')).Intertype();

  ({declare} = types);

  PATH = require('node:path');

  //-----------------------------------------------------------------------------------------------------------
  declare.mtr_new_template({
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
  declare.mtr_template_fill({
    isa: function(x) {
      return true;
    },
    default: null
  });

  //-----------------------------------------------------------------------------------------------------------
  declare.mtr_orientation(function(x) {
    return x === 'ltr' || x === 'rtl';
  });

  //-----------------------------------------------------------------------------------------------------------
  declare.mtr_quantity({
    extras: false,
    fields: {
      value: 'float',
      unit: 'nonempty.text'
    },
    default: {
      value: 0,
      unit: null
    },
    cast: function(x) {
      var match, unit, value;
      if (!types.isa.nonempty.text(x)) {
        return x;
      }
      if ((match = x.match(/^(?<value>.*?)(?<unit>\D*)$/)) == null) {
        return x;
      }
      ({value, unit} = match.groups);
      value = parseFloat(value);
      if (!types.isa.float(value)) {
        return x;
      }
      if (!types.isa.nonempty.text(unit)) {
        return x;
      }
      return {value, unit};
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  declare.mtr_rectangle({
    extras: false,
    fields: {
      width: 'mtr_length',
      height: 'mtr_length'
    },
    default: {
      width: {
        value: 0,
        unit: 'mm'
      },
      height: {
        value: 0,
        unit: 'mm'
      }
    }
  });

  // cast: ( width, height ) ->
  //   return
  //     width:  { value: width,   unit: 'mm', }
  //     height: { value: height,  unit: 'mm', }

  //-----------------------------------------------------------------------------------------------------------
  declare.mtr_length({
    extras: false,
    isa: function(x) {
      if (!this.isa.mtr_quantity(x)) {
        return false;
      }
      if (x.unit !== 'mm') {
        return false;
      }
      return true;
    },
    default: {
      value: 0,
      unit: 'mm'
    },
    cast: function(x) {
      return this.registry.mtr_quantity.cast(x);
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  declare.mtr_layouts(function(x) {
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
  declare.mtr_layout({
    // isa:        'mtr_layout_str.or.mtr_layout_obj'
    isa: 'anything',
    cast: function(x) {
      var R, known_layout_names, name;
      if (!this.isa.nonempty.text(x)) {
        // x ?= @registry.mtr_layout_str.default
        return x;
      }
      if ((R = known_layouts[x]) == null) {
        known_layout_names = ((function() {
          var results;
          results = [];
          for (name in known_layouts) {
            results.push(rpr(name));
          }
          return results;
        })()).join(', ');
        throw new Error(`^metteur/types@24^ unknown layout name: ${rpr(x)}; known layouts are: ${known_layout_names}`);
      }
      debug('^43-1^', R);
      return this.registry.mtr_layout_obj.create(R);
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  declare.mtr_layout_str({
    isa: 'nonempty.text',
    default: 'pps16'
  });

  //-----------------------------------------------------------------------------------------------------------
  declare.mtr_layout_obj({
    extras: false,
    fields: {
      name: 'nonempty.text',
      recto: 'mtr_sheet_side_layout',
      verso: 'mtr_sheet_side_layout',
      angles: 'optional.list.of.mtr_angle'
    },
    // pps:          'positive1.integer'
    // pages_standing: 'boolean'
    default: {
      name: null,
      recto: null,
      verso: null,
      angles: null
    },
    // pps:            null
    // pages_standing: null
    create: function(x) {
      var i, j, len, len1, p, ref, ref1, ref2;
      /* TAINT this should go into `prepare()` method when implemented */
      /* TAINT should also check for consistency of angles */
      debug('^43-2^', x.recto.angles);
      x.pps = 0;
      ref = x.recto.pages;
      for (i = 0, len = ref.length; i < len; i++) {
        p = ref[i];
        x.pps += p.length;
      }
      ref1 = x.verso.pages;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        p = ref1[j];
        x.pps += p.length;
      }
      x.pages_standing = (ref2 = x.recto.angles[0][0]) === 0 || ref2 === 180;
      debug('^43-3^', x);
      return x;
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  declare.mtr_pagenr(function(x) {
    return (this.isa.integer(x)) && (x >= -1);
  });

  //-----------------------------------------------------------------------------------------------------------
  /* TAINT may want to use words like up, upsidedown, left, right or similar */
  declare.mtr_angle(function(x) {
    return x === 0 || x === 90 || x === 180 || x === 270 || x === (-90);
  });

  //-----------------------------------------------------------------------------------------------------------
  declare.mtr_sheet_side_layout({
    extras: false,
    $pages: 'list.of.list.of.mtr_pagenr',
    $angles: 'optional.list.of.list.of.mtr_angle',
    default: {
      pages: null,
      angles: null
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  declare.mtr_split(function(x) {
    var count, i, idx, len, pair, part, parts, pnr, pnrs;
    if (!this.isa.nonempty.text(x)) {
      return false;
    }
    parts = (function() {
      var i, len, ref, results;
      ref = x.split(',');
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        part = ref[i];
        results.push(part.trim());
      }
      return results;
    })();
    pnrs = [];
    for (idx = i = 0, len = parts.length; i < len; idx = ++i) {
      part = parts[idx];
      pair = part.split(':');
      switch (pair.length) {
        case 1:
          [pnr, count] = [part, '-1'];
          break;
        case 2:
          [pnr, count] = pair;
          break;
        case 3:
          return false/* TAINT can we give reason for rejection? */;
      }
      if (this.isa.nan(pnr = parseInt(pnr))) {
        return false;
      }
      if (this.isa.nan(count = parseInt(count))) {
/* TAINT use @isa.nan when available */        return false;
      }
      if (count < 0) {
        // debug '^45-1^', { pnr, count, }
        /* TAINT use @isa.nan when available */        count = +2e308;
      }
      pnrs.push({pnr, count});
    }
    this.data.mtr_split = pnrs;
    return true;
  });

  //-----------------------------------------------------------------------------------------------------------
  declare.guy_strict_owner(function(x) {
    return true; // x instanceof GUY.props.Strict_owner
  });

  
  //-----------------------------------------------------------------------------------------------------------
  declare.mtr_impose_cfg({
    extras: false,
    $input: 'nonempty.text',
    $output: 'nonempty.text',
    $overwrite: 'boolean',
    $split: 'mtr_split',
    $orientation: 'mtr_orientation',
    $tempdir: 'optional.nonempty.text',
    $backdrop: 'optional.nonempty.text',
    $sheet: 'mtr_rectangle',
    $layout: 'mtr_layout',
    isa: 'guy_strict_owner',
    default: {
      input: null,
      output: null,
      overwrite: false,
      split: '-0',
      orientation: 'ltr', // or 'rtl' which will invert the orientation of all pages, allowing for CJK, Arabic RTL books
      tempdir: null,
      // backdrop:     PATH.join __dirname, '../page-elements/blank.png'
      // backdrop:     PATH.join __dirname, '../page-elements/diagnostic-overlay.png'
      backdrop: PATH.join(__dirname, '../page-elements/paper1.jpg'),
      sheet: {
        width: '210mm',
        height: '297mm'
      },
      layout: 'pps16'
    },
    create: function(cfg) {
      var R;
      R = {...this.registry.mtr_impose_cfg.default, ...cfg};
      R.layout = this.cast.mtr_layout(R.layout);
      if (this.isa.text(R.sheet.width)) {
        R.sheet.width = this.cast.mtr_length(R.sheet.width);
      }
      if (this.isa.text(R.sheet.height)) {
        R.sheet.height = this.cast.mtr_length(R.sheet.height);
      }
      debug('^456456^', R);
      // R = new GUY.props.Strict_owner { target: R, seal: true, freeze: true, }
      return new GUY.props.Strict_owner({
        target: R
      });
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  /* we put known layouts here for the time being: */
  known_layouts = {
    pps4: {
      name: 'pps4',
      // pps:      8 ### TAINT should not have to be set explicitly; pending implementation of Intertype `prepare()` ###
      recto: {
        angles: [[+90, +90]],
        pages: [[4, 1]]
      },
      verso: {
        angles: [[-90, -90]],
        pages: [[3, 2]]
      }
    },
    pps8: {
      name: 'pps8',
      // pps:      8 ### TAINT should not have to be set explicitly; pending implementation of Intertype `prepare()` ###
      recto: {
        angles: [[180, 0], [180, 0]],
        pages: [
          [
            5,
            8 // column 1 (left)
          ],
          [
            4,
            1 // column 2 (right)
          ]
        ]
      },
      verso: {
        angles: [[180, 0], [180, 0]],
        pages: [
          [
            3,
            2 // column 1 (left)
          ],
          [
            6,
            7 // column 2 (right)
          ]
        ]
      }
    },
    pps16: {
      name: 'pps16',
      // pps:      16 ### TAINT should not have to be set explicitly; pending implementation of Intertype `prepare()` ###
      recto: {
        angles: [
          [
            +90,
            +90,
            +90,
            +90 // column 1 (left)
          ],
          [
            -90,
            -90,
            -90,
            -90 // column 2 (right)
          ]
        ],
        pages: [
          [
            4,
            13,
            16,
            1 // column 1 (left)
          ],
          [
            5,
            12,
            9,
            8 // column 2 (right)
          ]
        ]
      },
      verso: {
        angles: [
          [
            +90,
            +90,
            +90,
            +90 // column 1 (left)
          ],
          [
            -90,
            -90,
            -90,
            -90 // column 2 (right)
          ]
        ],
        pages: [
          [
            6,
            11,
            10,
            7 // column 1 (left)
          ],
          [
            3,
            14,
            15,
            2 // column 2 (right)
          ]
        ]
      }
    }
  };

}).call(this);

//# sourceMappingURL=types.js.map