(function() {
  'use strict';
  var CP, FS, GUY, MIXA, Metteur, PATH, _run_tex, blue, debug, echo, grey, help, info, isa, lime, resolve, rpr, run_tex_etc, to_width, types, urge, validate, warn, whisper;

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

  //-----------------------------------------------------------------------------------------------------------
  resolve = function(...P) {
    if (P[0].startsWith('/')) {
      return PATH.resolve(PATH.join(...P));
    }
    return PATH.resolve(PATH.join(process.env.cwd, ...P));
  };

  //-----------------------------------------------------------------------------------------------------------
  run_tex_etc = function(cfg) {
    GUY.temp.with_directory({
      keep: false
    }, async function({path}) {
      cfg.tex_working_path = path;
      cfg.tex_target_path = resolve(cfg.tex_working_path, 'booklet.tex');
      cfg.tex_pdf_path = resolve(cfg.tex_working_path, 'booklet.pdf');
      FS.writeFileSync(cfg.tex_target_path, cfg.imposition);
      help(`wrote imposition to ${cfg.tex_target_path}`);
      // write imposition
      await _run_tex(cfg);
      // move output to target
      FS.moveSync(cfg.tex_pdf_path, cfg.output, {
        overwrite: cfg.overwrite
      });
      return null;
    });
    return cfg;
  };

  //-----------------------------------------------------------------------------------------------------------
  _run_tex = async function(cfg) {
    var $$, path_from_executable_name, paths;
    await import('zx/globals');
    //---------------------------------------------------------------------------------------------------------
    $$ = async function(...P) {
      return ((await $(...P))).stdout.trim();
    };
    path_from_executable_name = async function(name) {
      var error;
      try {
        return (await $$`command -v ${name}`);
      } catch (error1) {
        error = error1;
        warn("^6456^", `unable to locate ${name};
please refer to [section *External Dependencies*](https://github.com/loveencounterflow/metteur#external-dependencies) in the README.md`);
        throw error;
      }
    };
    //---------------------------------------------------------------------------------------------------------
    paths = {
      xelatex: (await path_from_executable_name('xelatex'))
    };
    //---------------------------------------------------------------------------------------------------------
    debug('^43345^', paths);
    cd(cfg.tex_working_path);
    await $`time ${paths.xelatex} --halt-on-error booklet.tex > xelatex-output`;
    await $`time ${paths.xelatex} --halt-on-error booklet.tex > xelatex-output`;
    await $`ls .`;
    // debug '^43345^', cfg
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
    --output      -o`));
          }
        },
        //-----------------------------------------------------------------------------------------------------
        'impose': {
          description: "assemble pages from one PDF file into a new PDF, to be folded into a booklet",
          runner: async(d) => {
            var cfg, key, mtr, value;
            cfg = types.create.mtr_cli_impose_cfg(d.verdict.parameters);
            cfg.input = resolve(cfg.input);
            cfg.output = resolve(cfg.output);
            whisper();
            for (key in cfg) {
              value = cfg[key];
              whisper(`${to_width(`${key}:`, 20)} ${value}`);
            }
            whisper();
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