

'use strict'


############################################################################################################
GUY                       = require 'guy'
{ debug
  info
  whisper
  warn
  urge
  help }                  = GUY.trm.get_loggers 'METTEUR/cli'
{ rpr
  echo }                  = GUY.trm
#...........................................................................................................
PATH                      = require 'node:path'
FS                        = require 'fs-extra'
CP                        = require 'node:child_process'
types                     = require './types'
{ isa
  validate }              = types
MIXA                      = require 'mixa'
GUY                       = require 'guy'
{ lime
  blue
  grey }                  = GUY.trm
{ Metteur }               = require './main'
{ to_width }              = require 'to-width'

#-----------------------------------------------------------------------------------------------------------
resolve = ( P... ) ->
  return PATH.resolve PATH.join P... if P[ 0 ].startsWith '/'
  return PATH.resolve PATH.join process.env.cwd, P...

#-----------------------------------------------------------------------------------------------------------
run_tex_etc = ( cfg ) ->
  GUY.temp.with_directory { keep: false, }, ({ path }) ->
    cfg.tex_working_path  = path
    cfg.tex_target_path   = resolve cfg.tex_working_path, 'booklet.tex'
    cfg.tex_pdf_path      = resolve cfg.tex_working_path, 'booklet.pdf'
    FS.writeFileSync cfg.tex_target_path, cfg.imposition
    whisper "wrote imposition to #{cfg.tex_target_path}"
    await _run_tex cfg
    FS.moveSync cfg.tex_pdf_path, cfg.output, { overwrite: cfg.overwrite, }
    help "wrote output to #{cfg.output}"
    return null
  return cfg

#-----------------------------------------------------------------------------------------------------------
_run_tex = ( cfg ) ->
  await import( 'zx/globals' )
  #---------------------------------------------------------------------------------------------------------
  $$ = ( P... ) -> ( await $ P... ).stdout.trim()
  path_from_executable_name = ( name ) ->
    try return await $$"""command -v #{name}""" catch error
      warn "^6456^", """
        unable to locate #{name};
        please refer to [section *External Dependencies*](https://github.com/loveencounterflow/metteur#external-dependencies) in the README.md"""
      throw error
  #---------------------------------------------------------------------------------------------------------
  paths =
    xelatex: await path_from_executable_name 'xelatex'
  #---------------------------------------------------------------------------------------------------------
  debug '^43345^', paths
  cd cfg.tex_working_path
  await $"""time #{paths.xelatex} --halt-on-error booklet.tex > xelatex-output"""
  await $"""time #{paths.xelatex} --halt-on-error booklet.tex > xelatex-output"""
  # debug '^43345^', cfg
  return null


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
@cli = ->
  #.........................................................................................................
  jobdefs =
    # meta:
    commands:
      #-----------------------------------------------------------------------------------------------------
      'help':
        runner: ( d ) =>
          debug '^690-1^', process.argv
          echo lime """Metteur: produce impositions for booklets with 4, 8 or 16 pages arranged on one sheet"""
          echo blue """
            Usage:
              metteur impose [flags]
                --input       -i
                --overwrite   -y
                --output      -o
            """
      #-----------------------------------------------------------------------------------------------------
      'impose':
        description:  "assemble pages from one PDF file into a new PDF, to be folded into a booklet"
        runner: ( d ) =>
          cfg             = types.create.mtr_cli_impose_cfg d.verdict.parameters
          cfg.input       = resolve cfg.input
          cfg.output      = resolve cfg.output
          whisper()
          whisper "#{to_width "#{key}:", 20} #{value}" for key, value of cfg
          whisper()
          mtr = new Metteur()
          cfg.imposition  = mtr.impose cfg
          await run_tex_etc cfg
          return null
        flags:
          'input':
            alias:        'i'
            type:         String
            # positional:   true
            # multiple:     'greedy'
            description:  "input file (providing the individual pages)"
          'output':
            alias:        'o'
            type:         String
            # positional:   true
            description:  "output file (containing the booklet with multiple pages per sheet, front and back)"
          'overwrite':
            alias:        'y'
            type:         Boolean
            # positional:   true
            description:  "whether to overwrite output file"
      #-----------------------------------------------------------------------------------------------------
      # 'tex':
      #   description:  "run XeLaTeX on tex/booklet.tex to produce tex/booklet.pdf"
        # runner: run_tex
  #.........................................................................................................
  MIXA.run jobdefs, process.argv
  return null



############################################################################################################
if module is require.main then do =>
  # await demo_receiver()
  await @cli()


