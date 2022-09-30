

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
$$                        = ( P... ) -> ( await $ P... ).stdout.trim()

#-----------------------------------------------------------------------------------------------------------
resolve = ( P... ) ->
  return PATH.resolve PATH.join P... if P[ 0 ].startsWith '/'
  return PATH.resolve PATH.join process.env.cwd, P...

#-----------------------------------------------------------------------------------------------------------
run_tex_etc = ( cfg ) ->
  await GUY.temp.with_directory { keep: false, }, ({ path }) ->
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
path_from_executable_name = ( name ) ->
  await import( 'zx/globals' )
  try return await $$"""command -v #{name}""" catch error
    warn "^6456^", """
      unable to locate #{name};
      please refer to [section *External Dependencies*](https://github.com/loveencounterflow/metteur#external-dependencies) in the README.md"""
    throw error

#-----------------------------------------------------------------------------------------------------------
_run_tex = ( cfg ) ->
  paths =
    xelatex: await path_from_executable_name 'xelatex'
  #---------------------------------------------------------------------------------------------------------
  cd cfg.tex_working_path
  await $"""time #{paths.xelatex} --halt-on-error booklet.tex > xelatex-output"""
  await $"""time #{paths.xelatex} --halt-on-error booklet.tex > xelatex-output"""
  # debug '^43345^', cfg
  return null

#-----------------------------------------------------------------------------------------------------------
show_cfg = ( cfg ) ->
  whisper()
  # whisper "#{to_width "#{key}:", 20} #{value}" for key, value of cfg
  console.table ( { key, value, } for key, value of cfg )
  whisper()
  return null

#-----------------------------------------------------------------------------------------------------------
fetch_pagecount = ( cfg ) ->
  await import( 'zx/globals' )
  verbose       = $.verbose; $.verbose = false
  pdfinfo_path  = await path_from_executable_name 'pdfinfo'
  R             = ( await $"#{pdfinfo_path} #{cfg.input} | grep -Pi '^Pages:'" ).stdout.trim()
  R             = R.replace /^.*\s+(\d+)$/, "$1"
  R             = parseInt R, 10
  $.verbose     = verbose
  info '^690-1^', "PDF #{cfg.input} has #{R} pages"
  return R

#-----------------------------------------------------------------------------------------------------------
fetch_pagedistro = ( cfg ) ->
  cfg.pagecount       = await fetch_pagecount cfg
  unless -cfg.pagecount <= cfg.split <= +cfg.pagecount
    throw new Error "^metteur/cli@33^ value for `split` (#{cfg.split}) exceeds pagecount (#{cfg.pagecount})"
  cfg.split_abs       = cfg.pagecount + cfg.split + 1 if cfg.split < 0
  cfg.blank_pagecount = cfg.pps %% cfg.pagecount
  if cfg.blank_pagecount is 0
    ### NOTE lpnr: Left-anchored Page NumbeR;
      rpnr would be negative and count from right end, sp -1 is last page ###
    return ( lpnr for lpnr in [ 1 .. cfg.pagecount ] )
  ### TAINT only valid for single signature ###
  cfg.pagedistro = [  ( lpnr for lpnr in [ 1              ... cfg.split_abs ]       )..., \
                      ( 0    for lpnr in [ 1              ..  cfg.blank_pagecount ] )..., \
                      ( lpnr for lpnr in [ cfg.split_abs  ..  cfg.pagecount ]       )..., ]
  debug '^3253^', cfg.blank_pagecount
  debug '^3253^', cfg.pagedistro
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
                --split
            """
      #-----------------------------------------------------------------------------------------------------
      'impose':
        description:  "assemble pages from one PDF file into a new PDF, to be folded into a booklet"
        runner: ( d ) =>
          # cfg             = types.create.mtr_cli_impose_cfg d.verdict.parameters
          cfg             = types.create.mtr_impose_cfg d.verdict.parameters
          cfg.input       = resolve cfg.input
          cfg.output      = resolve cfg.output
          ### TAINT compute from layout, user cfg ###
          cfg.pps         = 16 ### pages per sheet ###
          cfg.pagedistro  = await fetch_pagedistro cfg
          debug '^3553^', { pagedistro: cfg.pagedistro, }
          show_cfg cfg
          mtr             = new Metteur()
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
          'split':
            # alias:        'y'
            type:         Number
            # positional:   true
            description:  "use positive page nr or negative count to control insertion of empty pages"
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

