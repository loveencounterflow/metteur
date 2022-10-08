(function() {
  'use strict';
  var FS, GUY, H, Metteur, PATH, PDFDocument, Template, debug, echo, fontkit, freeze, get, has, help, hide, info, isa, page_tpl, resolve, rpr, types, urge, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({debug, info, whisper, warn, urge, help} = GUY.trm.get_loggers('METTEUR'));

  ({rpr, echo} = GUY.trm);

  PATH = require('node:path');

  FS = require('node:fs');

  resolve = function(...P) {
    return PATH.resolve(PATH.join(__dirname, '..', ...P));
  };

  H = require('./helpers');

  types = require('./types');

  ({isa} = types);

  ({Template} = require('./metteur-templating'));

  ({hide, get, has} = GUY.props);

  ({freeze} = GUY.lft);

  // { equals }                = types
  // { HDML }                  = require 'hdml'
  ({PDFDocument} = require('pdf-lib'));

  fontkit = require('@pdf-lib/fontkit');

  page_tpl = `\\begin{tikzpicture}[overlay,remember picture]%
\\node[anchor=north west,xshift=❰xshift❱mm,yshift=❰yshift❱mm] at (current page.north west){%
  \\rotatebox{❰angle_ccw❱}{%
  \\includegraphics[width=❰page_width❱mm,height=❰page_height❱mm,page=❰page_nr❱]{❰bdp_path❱}}};%
  \\end{tikzpicture}% sheet ❰sheet_nr❱ ❰side_name❱ col ❰column_nr❱ row ❰slot_nr❱, pos ❰slot_map❱, p❰page_nr❱ ↷ ❰angle_cw❱°\n
\\begin{tikzpicture}[overlay,remember picture]%
\\node[anchor=north west,xshift=❰xshift❱mm,yshift=❰yshift❱mm] at (current page.north west){%
  \\rotatebox{❰angle_ccw❱}{%
  \\fbox{\\includegraphics[width=❰page_width❱mm,height=❰page_height❱mm,page=❰page_nr❱]{❰source_path❱}}}};%
  \\end{tikzpicture}% sheet ❰sheet_nr❱ ❰side_name❱ col ❰column_nr❱ row ❰slot_nr❱, pos ❰slot_map❱, p❰page_nr❱ ↷ ❰angle_cw❱°\n
\\begin{tikzpicture}[overlay,remember picture]%
\\node[anchor=north west,xshift=❰xshift❱mm,yshift=❰yshift❱mm] at (current page.north west){%
  \\rotatebox{❰angle_ccw❱}{%
  \\includegraphics[width=❰page_width❱mm,height=❰page_height❱mm,page=❰page_nr❱]{❰ovl_path❱}}};%
  \\end{tikzpicture}% sheet ❰sheet_nr❱ ❰side_name❱ col ❰column_nr❱ row ❰slot_nr❱, pos ❰slot_map❱, p❰page_nr❱ ↷ ❰angle_cw❱°\n`;

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
    async _impose(cfg) {
      var Q, _column, _column_idx, _side_name, _slot_idx, _slot_map, doc_tpl, doc_tpl_path, format, i, j, k, len, len1, len2, pdistro_idx, ref, ref1, ref2, ref3;
      await this._generate_overlay(cfg);
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
          ovl_path: cfg.ovl_path,
          bdp_path: cfg.bdp_path,
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
              //...............................................................................................
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

    //---------------------------------------------------------------------------------------------------------
    async _generate_overlay(cfg) {
      var _, doc, font, fontBytes, font_path, height, i, len, page, pnr, ref, size, width, x, y;
      font_path = PATH.join(__dirname, '../fonts/EBGaramond08-Regular.ttf');
      doc = (await PDFDocument.create());
      //.......................................................................................................
      fontBytes = FS.readFileSync(font_path);
      doc.registerFontkit(fontkit);
      font = (await doc.embedFont(fontBytes));
      width = H.pt_from_mm(cfg.page_width);
      height = H.pt_from_mm(cfg.page_height);
      pnr = 0;
      ref = cfg.pagedistro;
      //.......................................................................................................
      for (i = 0, len = ref.length; i < len; i++) {
        _ = ref[i];
        pnr++;
        page = doc.addPage([width, height]);
        size = H.pt_from_mm(10);
        x = H.pt_from_mm(10);
        y = H.pt_from_mm(10);
        page.drawText(`p${pnr}`, {font, x, y, size});
      }
      //.......................................................................................................
      FS.writeFileSync(cfg.ovl_path, (await doc.save()));
      return null;
    }

  };

  //===========================================================================================================
  module.exports = {Template, Metteur};

}).call(this);

//# sourceMappingURL=main.js.map