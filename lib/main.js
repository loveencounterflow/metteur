(function() {
  'use strict';
  var FS, GUY, PATH, debug, demo, echo, help, info, layout, page_template, resolve, rpr, types, urge, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({debug, info, whisper, warn, urge, help} = GUY.trm.get_loggers('METTEUR'));

  ({rpr, echo} = GUY.trm);

  PATH = require('path');

  FS = require('fs');

  resolve = function(...P) {
    return PATH.resolve(PATH.join(__dirname, '..', ...P));
  };

  types = new (require('intertype')).Intertype();

  // { equals }                = types
  // { HDML }                  = require 'hdml'
  page_template = `\\begin{tikzpicture}[overlay,remember picture]
\\node[anchor=north west,xshift=❰xshift❱mm,yshift=❰yshift❱mm] at (current page.north west){
  \\fbox{\\includegraphics[width=❰width❱mm,height=❰height❱mm,angle=❰angle❱,page=❰page_nr❱]{../16-page-booklet.pdf}}};
  \\end{tikzpicture}`.replace(/\s*\n\s*/g, '');

  layout = {
    recto: {
      left: [4, 13, 16, 1],
      right: [5, 12, 9, 8]
    },
    verso: {
      left: [6, 11, 10, 7],
      right: [3, 14, 15, 2]
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  demo = function() {
    /* TAINT precompute using named values */
    var angle, column, correction, height, i, j, k, len, len1, len2, page, page_idx, page_nr, ref, ref1, ref2, sheet, side, source_path, template, template_path, tex_target_path, width, xshift, yshift;
    template_path = resolve('tex/booklet.template.tex');
    tex_target_path = resolve('tex/booklet.tex');
    source_path = resolve('16-page-booklet.pdf');
    template = FS.readFileSync(template_path, {
      encoding: 'utf-8'
    });
    // correction      = { x: -3.5, y: +3.5, }
    correction = {
      x: -1,
      y: +1
    };
    width = 297 / 4;
    height = 210 / 2;
    ref = ['recto', 'verso'];
    for (i = 0, len = ref.length; i < len; i++) {
      side = ref[i];
      if (side === 'verso') {
        template = template.replace(/(?=❰content❱)/g, '\\newpage%\n');
      }
      sheet = layout[side];
      ref1 = ['left', 'right'];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        column = ref1[j];
        /* TAINT precompute using named values */
        if (column === 'left') {
          xshift = 0 + correction.x;
          angle = +90;
        } else {
          xshift = 210 / 2 + correction.x;
          angle = -90;
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
          page += ` % ${side} ${column} r${page_idx + 1} p${page_nr}\n`;
          template = template.replace(/(?=❰content❱)/g, page);
        }
      }
    }
    template = template.replace(/❰content❱/g, '');
    FS.writeFileSync(tex_target_path, template);
    help(`wrote output to ${tex_target_path}`);
    return null;
  };

  //###########################################################################################################
  if (module === require.main) {
    (async() => {
      return (await demo());
    })();
  }

}).call(this);

//# sourceMappingURL=main.js.map