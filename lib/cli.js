(function() {
  'use strict';
  var $$, CP, FS, GUY, MIXA, Metteur, PATH, _run_tex, blue, debug, echo, fetch_pagecount, get_pagedistro, grey, help, info, isa, lime, path_from_executable_name, resolve, rpr, run_tex_etc, show_cfg, to_width, types, urge, validate, warn, whisper,
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
      FS.moveSync(cfg.tex_pdf_path, cfg.output, {
        overwrite: cfg.overwrite
      });
      help(`wrote output to ${cfg.output}`);
      return null;
    });
    return cfg;
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
    var paths;
    paths = {
      xelatex: (await path_from_executable_name('xelatex'))
    };
    //---------------------------------------------------------------------------------------------------------
    cd(cfg.tex_working_path);
    await $`time ${paths.xelatex} --halt-on-error booklet.tex > xelatex-output`;
    await $`time ${paths.xelatex} --halt-on-error booklet.tex > xelatex-output`;
    // debug '^43345^', cfg
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
  get_pagedistro = function(cfg) {
    var lpnr;
    if ((modulo(cfg.pagecount, cfg.pps)) === 0) {
      return (function() {
        var i, ref, results;
        results = [];
        for (lpnr = i = 1, ref = cfg.pagecount; (1 <= ref ? i <= ref : i >= ref); lpnr = 1 <= ref ? ++i : --i) {
          results.push(lpnr);
        }
        return results;
      })();
    }
    // if cfg.p
    return null;
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
            // cfg             = types.create.mtr_cli_impose_cfg d.verdict.parameters
            debug('^23423^', d.verdict.parameters);
            cfg = types.create.mtr_impose_cfg(d.verdict.parameters);
            cfg.input = resolve(cfg.input);
            cfg.output = resolve(cfg.output);
            cfg.pagecount = (await fetch_pagecount(cfg));
            /* TAINT compute from layout, user cfg */
            cfg.pps = 16/* pages per sheet */
            cfg.pagedistro = get_pagedistro(cfg);
            show_cfg(cfg);
            mtr = new Metteur();
            cfg.imposition = mtr.impose(cfg);
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
              type: Number,
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