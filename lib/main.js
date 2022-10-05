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
  // page_tpl                  = """
  //   \\begin{tikzpicture}[overlay,remember picture]%
  //   \\node[anchor=north west,xshift=❰xshift❱mm,yshift=❰yshift❱mm] at (current page.north west){%
  //     \\fbox{\\includegraphics[width=❰page_width❱mm,height=❰page_height❱mm,angle=❰angle_ccw❱,page=❰page_nr❱]{❰source_path❱}}};%
  //     \\end{tikzpicture}% sheet ❰sheet_nr❱ ❰side_name❱ col ❰column_nr❱ row ❰slot_nr❱, pos ❰slot_map❱, p❰page_nr❱ ↷ ❰angle_cw❱°\n"""#.replace /\s*\n\s*/g, ''
  page_tpl = `\\begin{tikzpicture}[overlay,remember picture]%
\\node[anchor=north west,xshift=❰xshift❱mm,yshift=❰yshift❱mm] at (current page.north west){%
  \\rotatebox{❰angle_cw❱}{%
  \\fbox{\\includegraphics[width=❰page_width❱mm,height=❰page_height❱mm,page=❰page_nr❱]{❰source_path❱}}}};%
  \\end{tikzpicture}% sheet ❰sheet_nr❱ ❰side_name❱ col ❰column_nr❱ row ❰slot_nr❱, pos ❰slot_map❱, p❰page_nr❱ ↷ ❰angle_cw❱°\n`; //.replace /\s*\n\s*/g, ''

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
      var Q, _column, _column_idx, _side_name, _slot_idx, _slot_map, doc_tpl, doc_tpl_path, format, i, j, k, len, len1, len2, pdistro_idx, ref, ref1, ref2, ref3;
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
          column_count: Template.misfit,
          row_count: Template.misfit,
          column_width: Template.misfit,
          row_height: Template.misfit,
          page_width: Template.misfit,
          page_height: Template.misfit,
          side_name: Template.misfit,
          side: Template.misfit,
          column: Template.misfit,
          column_idx: Template.misfit,
          column_nr: Template.misfit,
          angles: Template.misfit,
          orientation: Template.misfit,
          sheet_nr: 0,
          page_nr: Template.misfit,
          page_idx: Template.misfit,
          slot_map: Template.misfit,
          slot_idx: Template.misfit,
          slot_nr: Template.misfit,
          angle_cw: Template.misfit,
          angle_ccw: Template.misfit,
          source_path: cfg.input,
          correction: {
            x: -2,
            y: +1.5
          }
        }
      });
      //.......................................................................................................
      Q.column_count = cfg.layout.recto.pages.length;
      Q.row_count = cfg.layout.recto.pages[0].length;
      Q.column_width = cfg.sheet.width.value / Q.column_count;
      Q.row_height = cfg.sheet.height.value / Q.row_count;
      if (cfg.layout.pages_standing) {
        Q.page_width = Q.column_width;
        Q.page_height = Q.row_height;
      } else {
        Q.page_width = Q.row_height;
        Q.page_height = Q.column_width;
      }
      Q.orientation = cfg.orientation === 'ltr' ? +1 : -1;
      while (true) {
        Q.sheet_nr++;
        if (Q.sheet_nr > cfg.sheetcount) {
          break;
        }
        ref = ['recto', 'verso'];
        for (i = 0, len = ref.length; i < len; i++) {
          _side_name = ref[i];
          Q.side_name = _side_name;
          Q.side = cfg.layout[Q.side_name];
          if (Q.sheet_nr > 1 || Q.side_name === 'verso') {
            doc_tpl.fill_some({
              content: '\\newpage%\n'
            });
          }
          ref1 = Q.side.pages;
          for (_column_idx = j = 0, len1 = ref1.length; j < len1; _column_idx = ++j) {
            _column = ref1[_column_idx];
            Q.column = _column;
            Q.column_idx = _column_idx;
            Q.column_nr = Q.column_idx + 1;
            Q.angles = Q.side.angles[_column_idx];
            debug('^3353^', {
              _column,
              _column_idx,
              angles: Q.angles
            });
            ref2 = Q.column;
            for (_slot_idx = k = 0, len2 = ref2.length; k < len2; _slot_idx = ++k) {
              _slot_map = ref2[_slot_idx];
              Q.slot_map = _slot_map;
              Q.slot_idx = _slot_idx;
              Q.slot_nr = Q.slot_idx + 1;
              Q.angle_cw = Q.angles[_slot_idx];
              Q.angle_ccw = -Q.angle_cw/* NOTE converting from anti-clockwise to clockwise */
              pdistro_idx = (Q.sheet_nr - 1) * cfg.layout.pps + Q.slot_map - 1;
              Q.page_nr = (ref3 = cfg.pagedistro[pdistro_idx]) != null ? ref3 : -1/* NOTE: using -1 as error code */
              Q.xshift = (Q.column_width * Q.column_idx) + Q.correction.x;
              Q.yshift = (-Q.row_height * Q.slot_idx) + Q.correction.y;
              urge('^234^', `sheet ${Q.sheet_nr} ${Q.side_name} slot c${Q.column_idx + 1},s${Q.slot_idx + 1}, pos ${Q.slot_map}, p${Q.page_nr} ↷ ${Q.angle_cw}`);
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