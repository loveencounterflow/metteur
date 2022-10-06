(function() {
  'use strict';
  var GUY, debug, echo, freeze, get, has, help, hide, info, misfit, rpr, types, urge, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({debug, info, whisper, warn, urge, help} = GUY.trm.get_loggers('METTEUR/templating'));

  ({rpr, echo} = GUY.trm);

  ({hide, get, has} = GUY.props);

  ({freeze} = GUY.lft);

  misfit = Symbol('misfit');

  types = require('./types');

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
        var do_format, i, idx, idxs, isa, isa_text, key, len, ref, type_of, value;
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

  //-----------------------------------------------------------------------------------------------------------
  this.escape_tex_specials = function(text) {
    var R;
    R = text;
    R = R.replace(/\\/g, '\\textbackslash{}');
    R = R.replace(/\{/g, '\\{');
    R = R.replace(/\}/g, '\\}');
    R = R.replace(/\$/g, '\\$');
    R = R.replace(/#/g, '\\#');
    R = R.replace(/%/g, '\\%');
    R = R.replace(/_/g, '\\_');
    R = R.replace(/\^/g, '\\textasciicircum{}');
    R = R.replace(/~/g, '\\textasciitilde{}');
    R = R.replace(/&/g, '\\&');
    return R;
  };

}).call(this);

//# sourceMappingURL=metteur-templating.js.map