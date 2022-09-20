(function() {
  'use strict';
  var FS, GUY, Metteur, PATH, debug, echo, freeze, get, has, help, hide, info, layout, misfit, page_template, resolve, rpr, types, urge, warn, whisper,
    splice = [].splice;

  //###########################################################################################################
  GUY = require('guy');

  ({debug, info, whisper, warn, urge, help} = GUY.trm.get_loggers('METTEUR'));

  ({rpr, echo} = GUY.trm);

  PATH = require('path');

  FS = require('fs');

  resolve = function(...P) {
    return PATH.resolve(PATH.join(__dirname, '..', ...P));
  };

  types = require('./types');

  misfit = Symbol('misfit');

  ({hide, get, has} = GUY.props);

  ({freeze} = GUY.lft);

  // { equals }                = types
  // { HDML }                  = require 'hdml'
  page_template = `\\begin{tikzpicture}[overlay,remember picture]
\\node[anchor=north west,xshift=❰xshift❱mm,yshift=❰yshift❱mm] at (current page.north west){
  \\fbox{\\includegraphics[width=❰width❱mm,height=❰height❱mm,angle=❰angle❱,page=❰page_nr❱]{❰source_path❱}}};
  \\end{tikzpicture}`.replace(/\s*\n\s*/g, '');

  layout = {
    orientation: 'ltr', // or 'rtl' which will invert the orientation of all pages, allowing for CJK, Arabic RTL books
    recto: {
      left: [4, 13, 16, 1],
      right: [5, 12, 9, 8]
    },
    verso: {
      left: [6, 11, 10, 7],
      right: [3, 14, 15, 2]
    }
  };

  //===========================================================================================================
  // types.declare 'tmpltr_cfg',

  //===========================================================================================================
  this.Template = (function() {
    class Template extends GUY.props.Strict_owner {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        var close, open;
        super();
        hide(this, 'types', types);
        this.cfg = new GUY.props.Strict_owner({
          target: this.types.create.mtr_new_template(cfg),
          freeze: true
        });
        //.......................................................................................................
        open = this._escape_literal_for_regex(this.cfg.open);
        close = this._escape_literal_for_regex(this.cfg.close);
        hide(this, '_intermediate');
        hide(this, '_cfg', freeze({
          open: open,
          close: close,
          rx: RegExp(`${open}(?<key>[^${close}]*)${close}`, "g")
        }));
        //.......................................................................................................
        // for
        return void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      _fill(mode, cfg) {
        /* TAINT when only filling some keys, might be better to search for those patterns only */
        var R, do_format, isa, isa_text, type_of;
        cfg = this.types.create.mtr_template_fill(cfg);
        if (this._intermediate == null) {
          this._intermediate = this.cfg.template;
        }
        R = this._intermediate;
        ({isa, type_of} = this.types);
        isa_text = isa.text;
        do_format = this.cfg.format != null;
        R = R.replace(this._cfg.rx, ($0, ...args) => {
          var dots, key, ref, value;
          ref = args, [...args] = ref, [{key}] = splice.call(args, -1);
          dots = false;
          if (key.startsWith('...')) {
            dots = 'open';
            key = key.slice(3);
          }
          value = get(cfg, key, misfit);
          if (value === misfit) {
            if (mode === 'some') {
              return $0;
            }
            throw new Error(`unknown key ${rpr(key)}`);
          }
          if (do_format) {
            value = this.cfg.format(value, key);
          }
          if (!isa_text(value)) {
            throw new Error(`expected text, got a ${type_of(value)}`);
          }
          switch (dots) {
            case 'open':
              return `${value}${this.cfg.open}...${key}${this.cfg.close}`;
            default:
              return value;
          }
        });
        this._intermediate = R;
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      fill_all(cfg) {
        return this._fill('all', cfg);
      }

      fill_some(cfg) {
        return this._fill('some', cfg);
      }

      //---------------------------------------------------------------------------------------------------------
      finish() {
        var ref;
        return this._intermediate = ((ref = this._intermediate) != null ? ref : this.cfg.template).replace(this._cfg.rx, '');
      }

      peek() {
        var ref;
        return (ref = this._intermediate) != null ? ref : this.cfg.template;
      }

      //---------------------------------------------------------------------------------------------------------
      /* thx to https://stackoverflow.com/a/6969486/7568091 and
       https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping */
      _escape_literal_for_regex(literal) {
        return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }

    };

    //---------------------------------------------------------------------------------------------------------
    hide(Template, 'misfit', misfit);

    return Template;

  }).call(this);

  //===========================================================================================================
  Metteur = class Metteur extends GUY.props.Strict_owner {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      super();
      return void 0;
    }

  };

  //-----------------------------------------------------------------------------------------------------------
  this.demo = function() {
    /* TAINT precompute using named values */
    var Q, angle, column, correction, height, i, j, k, len, len1, len2, orientation, page, page_idx, page_nr, ref, ref1, ref2, sheet, side, source_path, template, template_path, tex_target_path, width, xshift, yshift;
    template_path = resolve('tex/booklet.template.tex');
    tex_target_path = resolve('tex/booklet.tex');
    source_path = resolve('../metteur-booklets/textura.booklet.pdf');
    // source_path     = resolve '16-page-booklet.pdf'
    template = FS.readFileSync(template_path, {
      encoding: 'utf-8'
    });
    //.........................................................................................................
    Q = {
      // frame_weight:     '0.25mm'
      frame_weight: '0mm'
    };
    //.........................................................................................................
    // correction      = { x: -3.5, y: +3.5, }
    correction = {
      x: -2,
      y: +1.5
    };
    width = 297 / 4;
    height = 210 / 2;
    orientation = layout.orientation === 'ltr' ? +1 : -1;
    ref = ['recto', 'verso'];
    for (i = 0, len = ref.length; i < len; i++) {
      side = ref[i];
      if (side === 'verso') {
        template = template.replace(/(?=❰\.\.\.content❱)/g, '\\newpage%\n');
      }
      sheet = layout[side];
      ref1 = ['left', 'right'];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        column = ref1[j];
        /* TAINT precompute using named values */
        if (column === 'left') {
          xshift = 0 + correction.x;
          angle = -90 * orientation;
        } else {
          xshift = 210 / 2 + correction.x;
          angle = +90 * orientation;
        }
        ref2 = sheet[column];
        for (page_idx = k = 0, len2 = ref2.length; k < len2; page_idx = ++k) {
          page_nr = ref2[page_idx];
          yshift = -(297 / 4) * page_idx + correction.y/* TAINT precompute using named values */
          page = page_template;
          page = page.replace(/❰xshift❱/g, xshift);
          page = page.replace(/❰yshift❱/g, yshift);
          page = page.replace(/❰angle❱/g, angle);
          page = page.replace(/❰width❱/g, width);
          page = page.replace(/❰height❱/g, height);
          page = page.replace(/❰page_nr❱/g, page_nr);
          page = page.replace(/❰source_path❱/g, source_path);
          page += ` % ${side} ${column} r${page_idx + 1} p${page_nr}\n`;
          template = template.replace(/(?=❰\.\.\.content❱)/g, page);
        }
      }
    }
    template = template.replace(/❰\.\.\.content❱/g, '');
    template = template.replace(/❰frame_weight❱/g, Q.frame_weight);
    // template = @interpolate template, Q
    FS.writeFileSync(tex_target_path, template);
    help(`wrote output to ${tex_target_path}`);
    return null;
  };

  //###########################################################################################################
  if (module === require.main) {
    (async() => {
      return (await this.demo());
    })();
  }

}).call(this);

//# sourceMappingURL=main.js.map