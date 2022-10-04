(function() {
  'use strict';
  var $$, CP, FS, GUY, MIXA, Metteur, PATH, _run_tex, blue, debug, deep_copy, digest_from_path, echo, fetch_pagecount, fetch_pagedistro, grey, help, info, isa, lime, new_hash, path_from_executable_name, resolve, rpr, run_tex_etc, show_cfg, to_width, types, urge, validate, warn, whisper,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

  //###########################################################################################################
  GUY = require('guy');

  ({debug, info, whisper, warn, urge, help} = GUY.trm.get_loggers('METTEUR/cli'));

  ({rpr, echo} = GUY.trm);

  //...........................................................................................................
  PATH = require('node:path');

  FS = require('fs-extra');

  CP = require('node:child_process');

  types = require('./types');

  ({isa, validate} = types);

  MIXA = require('mixa');

  GUY = require('guy');

  ({lime, blue, grey} = GUY.trm);

  ({Metteur} = require('./main'));

  ({to_width} = require('to-width'));

  deep_copy = (require('rfdc'))({
    proto: true,
    circles: false
  });

  $$ = async function(...P) {
    return ((await $(...P))).stdout.trim();
  };

  //-----------------------------------------------------------------------------------------------------------
  resolve = function(...P) {
    if (P[0].startsWith('/')) {
      return PATH.resolve(PATH.join(...P));
    }
    return PATH.resolve(PATH.join(process.env.cwd, ...P));
  };

  //-----------------------------------------------------------------------------------------------------------
  run_tex_etc = async function(cfg) {
    await GUY.temp.with_directory({
      keep: false
    }, async function({path}) {
      cfg.tex_working_path = path;
      cfg.tex_target_path = resolve(cfg.tex_working_path, 'booklet.tex');
      cfg.tex_pdf_path = resolve(cfg.tex_working_path, 'booklet.pdf');
      FS.writeFileSync(cfg.tex_target_path, cfg.imposition);
      whisper(`wrote imposition to ${cfg.tex_target_path}`);
      await _run_tex(cfg);
      if (FS.pathExistsSync(cfg.tex_pdf_path)) {
        FS.moveSync(cfg.tex_pdf_path, cfg.output, {
          overwrite: cfg.overwrite
        });
        help(`wrote output to ${cfg.output}`);
      } else {
        warn(GUY.trm.reverse(" ^metteur/cli@34^ no output produced "));
        process.exit(1);
      }
      return null;
    });
    return cfg;
  };

  //-----------------------------------------------------------------------------------------------------------
  new_hash = function() {
    return (require('crypto')).createHash('sha1');
  };

  digest_from_path = function(path) {
    return (new_hash().update(FS.readFileSync(path))).digest('hex');
  };

  //-----------------------------------------------------------------------------------------------------------
  path_from_executable_name = async function(name) {
    var error;
    await import('zx/globals');
    try {
      return (await $$`command -v ${name}`);
    } catch (error1) {
      error = error1;
      warn("^6456^", `unable to locate ${name};
please refer to [section *External Dependencies*](https://github.com/loveencounterflow/metteur#external-dependencies) in the README.md`);
      throw error;
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  _run_tex = async function(cfg) {
    /* TAINT use loop, check *.aux for changes */
    /* TAINT this method has the drawback that we always run at least twice */
    var aux_path, error, log_path, new_digest, old_digest, paths;
    paths = {
      xelatex: (await path_from_executable_name('xelatex'))
    };
    //---------------------------------------------------------------------------------------------------------
    cd(cfg.tex_working_path);
    log_path = PATH.join(cfg.tex_working_path, 'xelatex-output');
    aux_path = PATH.join(cfg.tex_working_path, 'booklet.aux');
    new_digest = null;
    old_digest = null;
    while (true) {
      try {
        await $`time ${paths.xelatex} --halt-on-error booklet.tex > xelatex-output`;
      } catch (error1) {
        error = error1;
        echo(FS.readFileSync(log_path, {
          encoding: 'utf-8'
        }));
        warn(error.exitCode);
        throw error;
      }
      if ((new_digest = digest_from_path(aux_path)) === old_digest) {
        break;
      }
      old_digest = new_digest;
    }
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  show_cfg = function(cfg) {
    var key, value;
    whisper();
    // whisper "#{to_width "#{key}:", 20} #{value}" for key, value of cfg
    console.table((function() {
      var results;
      results = [];
      for (key in cfg) {
        value = cfg[key];
        results.push({key, value});
      }
      return results;
    })());
    whisper();
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  fetch_pagecount = async function(cfg) {
    var R, pdfinfo_path, verbose;
    await import('zx/globals');
    verbose = $.verbose;
    $.verbose = false;
    pdfinfo_path = (await path_from_executable_name('pdfinfo'));
    R = ((await $`${pdfinfo_path} ${cfg.input} | grep -Pi '^Pages:'`)).stdout.trim();
    R = R.replace(/^.*\s+(\d+)$/, "$1");
    R = parseInt(R, 10);
    $.verbose = verbose;
    info('^690-1^', `PDF ${cfg.input} has ${R} pages`);
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  fetch_pagedistro = async function(cfg) {
    var R, _, bpc, count, d, i, idx, inserts, j, k, len, len1, name1, pnr, pnr_txt, ref, ref1, remainder, split;
    cfg.pagecount = (await fetch_pagecount(cfg));
    cfg.sheetcount = Math.floor(cfg.pagecount / cfg.pps);
    remainder = modulo(cfg.pagecount, cfg.pps);
    if (remainder !== 0) {
      cfg.sheetcount++;
    }
    cfg.blank_pagecount = cfg.pps - remainder;
    R = (function() {
      var results = [];
      for (var i = 1, ref = cfg.pagecount; 1 <= ref ? i <= ref : i >= ref; 1 <= ref ? i++ : i--){ results.push(i); }
      return results;
    }).apply(this);
    if (cfg.blank_pagecount === 0) {
      return R;
    }
    split = deep_copy(cfg.mtr_split);
//.........................................................................................................
/* turn RPNRs into LPNRs */
/* TAINT correct or complain about PNRs outside the allowed range */
    for (i = 0, len = split.length; i < len; i++) {
      d = split[i];
      if (isa.negative(d.pnr)) {
        d.pnr = cfg.pagecount + d.pnr;
      }
    }
    //.........................................................................................................
    inserts = {};
    bpc = cfg.blank_pagecount;
    while (true) {
      if (bpc < 0) {
        break;
      }
      for (j = 0, len1 = split.length; j < len1; j++) {
        d = split[j];
        if (d.count <= 0) {
          continue;
        }
        bpc--;
        if (bpc < 0) {
          break;
        }
        d.count--;
        inserts[d.pnr] = (inserts[name1 = d.pnr] != null ? inserts[name1] : inserts[name1] = 0) + 1;
      }
    }
    //.........................................................................................................
    R = (function() {
      var k, len2, results;
      results = [];
      for (k = 0, len2 = R.length; k < len2; k++) {
        pnr = R[k];
        results.push([pnr]);
      }
      return results;
    })();
    for (pnr_txt in inserts) {
      count = inserts[pnr_txt];
      pnr = parseInt(pnr_txt, 10);
      idx = pnr - 1;
      for (_ = k = 1, ref1 = count; (1 <= ref1 ? k <= ref1 : k >= ref1); _ = 1 <= ref1 ? ++k : --k) {
        // ### thx to https://2ality.com/2018/12/creating-arrays.html#creating-ranges-of-integer-values ###
        // R[ idx ].push Array.from { length, }, ( _, i ) -> -1
        R[idx].push(-1);
      }
    }
    R = R.flat();
    //.........................................................................................................
    return R;
  };

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.cli = function() {
    var jobdefs;
    //.........................................................................................................
    jobdefs = {
      // meta:
      commands: {
        //-----------------------------------------------------------------------------------------------------
        'help': {
          runner: (d) => {
            debug('^690-1^', process.argv);
            echo(lime(`Metteur: produce impositions for booklets with 4, 8 or 16 pages arranged on one sheet`));
            return echo(blue(`Usage:
  metteur impose [flags]
    --input       -i
    --overwrite   -y
    --output      -o
    --split`));
          }
        },
        //-----------------------------------------------------------------------------------------------------
        'impose': {
          description: "assemble pages from one PDF file into a new PDF, to be folded into a booklet",
          runner: async(d) => {
            var cfg, mtr;
            cfg = types.create.mtr_impose_cfg(d.verdict.parameters);
            /* TAINT inconsistent naming */
            cfg.mtr_split = types.data.mtr_split;
            cfg.input = resolve(cfg.input);
            cfg.output = resolve(cfg.output);
            /* TAINT compute from layout, user cfg */
            cfg.pps = 16/* pages per sheet */
            cfg.pagedistro = (await fetch_pagedistro(cfg));
            debug('^3553^', {
              pagedistro: cfg.pagedistro
            });
            show_cfg(cfg);
            mtr = new Metteur();
            cfg.imposition = mtr._impose(cfg);
            // process.exit 111
            await run_tex_etc(cfg);
            return null;
          },
          flags: {
            'input': {
              alias: 'i',
              type: String,
              // positional:   true
              // multiple:     'greedy'
              description: "input file (providing the individual pages)"
            },
            'output': {
              alias: 'o',
              type: String,
              // positional:   true
              description: "output file (containing the booklet with multiple pages per sheet, front and back)"
            },
            'overwrite': {
              alias: 'y',
              type: Boolean,
              // positional:   true
              description: "whether to overwrite output file"
            },
            'split': {
              // alias:        'y'
              type: String,
              // positional:   true
              description: "use positive page nr or negative count to control insertion of empty pages"
            }
          }
        }
      }
    };
    //-----------------------------------------------------------------------------------------------------
    // 'tex':
    //   description:  "run XeLaTeX on tex/booklet.tex to produce tex/booklet.pdf"
    // runner: run_tex
    //.........................................................................................................
    MIXA.run(jobdefs, process.argv);
    return null;
  };

  //###########################################################################################################
  if (module === require.main) {
    (async() => {
      // await demo_receiver()
      return (await this.cli());
    })();
  }

}).call(this);

//# sourceMappingURL=cli.js.map