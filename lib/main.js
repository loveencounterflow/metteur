(function() {
  'use strict';
  var FS, GUY, Metteur, PATH, Template, debug, demo, echo, freeze, get, has, help, hide, info, isa, misfit, page_tpl, resolve, rpr, types, urge, warn, whisper;

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

  ({isa} = types);

  misfit = Symbol('misfit');

  ({hide, get, has} = GUY.props);

  ({freeze} = GUY.lft);

  // { equals }                = types
  // { HDML }                  = require 'hdml'
  page_tpl = `\\begin{tikzpicture}[overlay,remember picture]%
\\node[anchor=north west,xshift=❰xshift❱mm,yshift=❰yshift❱mm] at (current page.north west){%
  \\fbox{\\includegraphics[width=❰width❱mm,height=❰height❱mm,angle=❰angle❱,page=❰page_nr❱]{❰source_path❱}}};%
  \\end{tikzpicture}% ❰side❱ ❰column❱ p❰page_nr❱\n`; //.replace /\s*\n\s*/g, ''

  Template = (function() {
    
      //===========================================================================================================
    // types.declare 'tmpltr_cfg',

      //===========================================================================================================
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
        hide(this, '_segments', []);
        hide(this, '_mark_idxs', {});
        hide(this, '_idx_directions', {});
        hide(this, '_cfg', freeze({
          open: open,
          close: close,
          rx: RegExp(`${open}(?<key>[^${close}]*)${close}`, "g")
        }));
        //.......................................................................................................
        this._compile();
        return void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      _compile() {
        var base, direction, i, idx, is_mark, len, ref, segment_or_mark;
        is_mark = true;
        ref = this.cfg.template.split(this._cfg.rx);
        for (idx = i = 0, len = ref.length; i < len; idx = ++i) {
          segment_or_mark = ref[idx];
          if (is_mark = !is_mark) {
            direction = 'append';
            if (segment_or_mark.startsWith('...')) {
              segment_or_mark = segment_or_mark.slice(3);
            } else if (segment_or_mark.endsWith('...')) {
              segment_or_mark = segment_or_mark.slice(0, segment_or_mark.length - 3);
              direction = 'prepend';
            }
            this._segments.push([]);
            ((base = this._mark_idxs)[segment_or_mark] != null ? base[segment_or_mark] : base[segment_or_mark] = []).push(idx);
            this._idx_directions[idx] = direction;
          } else {
            this._segments.push(segment_or_mark);
          }
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _fill(mode, cfg) {
        var do_format, i, idx, idxs, isa_text, key, len, ref, type_of, value;
        cfg = this.types.create.mtr_template_fill(cfg);
        ({isa, type_of} = this.types);
        isa_text = isa.text;
        do_format = this.cfg.format != null;
        ref = this._mark_idxs;
        for (key in ref) {
          idxs = ref[key];
          if ((value = get(cfg, key, misfit)) === misfit) {
            if (mode === 'some') {
              continue;
            }
            throw new Error(`unknown key ${rpr(key)}`);
          }
          if (do_format) {
            value = this.cfg.format(value, key);
          }
          if (!isa_text(value)) {
            throw new Error(`expected text, got a ${type_of(value)} for key ${rpr(key)}`);
          }
          for (i = 0, len = idxs.length; i < len; i++) {
            idx = idxs[i];
            if (this._idx_directions[idx] === 'append') {
              this._segments[idx].push(value);
            } else {
              this._segments[idx].unshift(value);
            }
          }
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      fill_all(cfg) {
        return this._fill('all', cfg);
      }

      fill_some(cfg) {
        return this._fill('some', cfg);
      }

      //---------------------------------------------------------------------------------------------------------
      clear() {
        var i, idx, ref;
        for (idx = i = 1, ref = this._segments.length; i < ref; idx = i += +2) {
          this._segments[idx] = [];
        }
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      finish() {
        var R;
        R = this.peek();
        this.clear();
        return R;
      }

      peek() {
        return this._segments.flat().join('');
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
      hide(this, 'types', types);
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    impose(cfg) {
      return this._impose(types.create.mtr_impose_cfg(cfg));
    }

    //---------------------------------------------------------------------------------------------------------
    _impose(cfg) {
      var Q, _column, _side, doc_tpl, doc_tpl_path, format, i, j, k, len, len1, len2, page_idx, page_nr, pdistro_idx, ref, ref1, ref2, ref3, sheet;
      doc_tpl_path = resolve('tex/booklet.template.tex');
      doc_tpl = FS.readFileSync(doc_tpl_path, {
        encoding: 'utf-8'
      });
      format = function(x) {
        if (isa.text(x)) {
          return x;
        } else {
          return rpr(x);
        }
      };
      doc_tpl = new Template({
        template: doc_tpl,
        open: '❰',
        close: '❱',
        format
      });
      page_tpl = new Template({
        template: page_tpl,
        open: '❰',
        close: '❱',
        format
      });
      //.......................................................................................................
      Q = new GUY.props.Strict_owner({
        seal: true,
        target: {
          // frame_weight:     '0.25mm'
          frame_weight: '0.125mm',
          xshift: Template.misfit,
          yshift: Template.misfit,
          angle: Template.misfit,
          width: Template.misfit,
          height: Template.misfit,
          side: Template.misfit,
          column: Template.misfit,
          orientation: Template.misfit,
          sheet_nr: 0,
          page_nr: Template.misfit,
          source_path: cfg.input,
          correction: {
            x: -2,
            y: +1.5
          }
        }
      });
      //.......................................................................................................
      /* TAINT precompute using named values */
      Q.width = 297 / 4;
      Q.height = 210 / 2;
      Q.orientation = cfg.orientation === 'ltr' ? +1 : -1;
      while (true) {
        Q.sheet_nr++;
        if (Q.sheet_nr >= 4) {
          break;
        }
        ref = ['recto', 'verso'];
        for (i = 0, len = ref.length; i < len; i++) {
          _side = ref[i];
          Q.side = _side;
          sheet = cfg.layout[Q.side];
          if (Q.sheet_nr > 1 || Q.side === 'verso') {
            doc_tpl.fill_some({
              content: '\\newpage%\n'
            });
          }
          ref1 = ['left', 'right'];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            _column = ref1[j];
            Q.column = _column;
            /* TAINT precompute using named values */
            if (Q.column === 'left') {
              Q.xshift = 0 + Q.correction.x;
              Q.angle = -90 * Q.orientation;
            } else {
              Q.xshift = 210 / 2 + Q.correction.x;
              Q.angle = +90 * Q.orientation;
            }
            ref2 = sheet[Q.column];
            for (page_idx = k = 0, len2 = ref2.length; k < len2; page_idx = ++k) {
              page_nr = ref2[page_idx];
              Q.page_nr = page_nr;
              pdistro_idx = (Q.sheet_nr - 1) * cfg.pps + page_nr - 1;
              Q.page_nr = (ref3 = cfg.pagedistro[pdistro_idx]) != null ? ref3 : -1/* NOTE: using -1 as error code */
              debug('^234^', page_nr, '->', Q.page_nr);
              Q.yshift = -(297 / 4) * page_idx + Q.correction.y/* TAINT precompute using named values */
              page_tpl.fill_all(Q);
              doc_tpl.fill_some({
                content: page_tpl.finish()
              });
            }
          }
        }
      }
      doc_tpl.fill_some({
        frame_weight: Q.frame_weight
      });
      // template = @interpolate template, Q
      //.......................................................................................................
      return doc_tpl.finish();
    }

  };

  //-----------------------------------------------------------------------------------------------------------
  demo = function() {
    var mtr;
    mtr = new Metteur();
    mtr.impose();
    return null;
  };

  //===========================================================================================================
  module.exports = {Template, Metteur, demo};

  //###########################################################################################################
  if (module === require.main) {
    (async() => {
      return (await demo());
    })();
  }

}).call(this);

//# sourceMappingURL=main.js.map