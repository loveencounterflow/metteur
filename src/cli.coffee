

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
H                         = require './helpers'
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
deep_copy                 = ( require 'rfdc' ) { proto: true, circles: false, }
$$                        = ( P... ) -> ( await $ P... ).stdout.trim()
mkdirp                    = require 'mkdirp'

#-----------------------------------------------------------------------------------------------------------
resolve = ( P... ) ->
  return PATH.resolve PATH.join P... if P[ 0 ].startsWith '/'
  return PATH.resolve PATH.join process.env.cwd, P...

#-----------------------------------------------------------------------------------------------------------
run_tex_etc = ( cfg ) ->
  cfg.tex_target_path   = resolve cfg.tempdir, 'booklet.tex'
  cfg.tex_pdf_path      = resolve cfg.tempdir, 'booklet.pdf'
  FS.writeFileSync cfg.tex_target_path, cfg.imposition
  whisper "wrote imposition to #{cfg.tex_target_path}"
  await _run_tex cfg
  if FS.pathExistsSync cfg.tex_pdf_path
    FS.moveSync cfg.tex_pdf_path, cfg.output, { overwrite: cfg.overwrite, }
    help "wrote output to #{cfg.output}"
  else
    warn GUY.trm.reverse " ^metteur/cli@34^ no output produced "
    process.exit 1
  return null

#-----------------------------------------------------------------------------------------------------------
new_hash          = -> ( require 'crypto' ).createHash 'sha1'
digest_from_path  = ( path ) -> ( new_hash().update FS.readFileSync path ).digest 'hex'

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
  cd cfg.tempdir
  ### TAINT use loop, check *.aux for changes ###
  log_path    = PATH.join cfg.tempdir, 'xelatex-output'
  aux_path    = PATH.join cfg.tempdir, 'booklet.aux'
  ### TAINT this method has the drawback that we always run at least twice ###
  new_digest  = null
  old_digest  = null
  loop
    try
      await $"""time #{paths.xelatex} --halt-on-error booklet.tex > xelatex-output"""
    catch error
      echo FS.readFileSync log_path, { encoding: 'utf-8', }
      warn error.exitCode
      throw error
    break if ( new_digest = digest_from_path aux_path ) is old_digest
    old_digest = new_digest
  return null

#-----------------------------------------------------------------------------------------------------------
show_cfg = ( cfg ) ->
  whisper()
  # whisper "#{to_width "#{key}:", 20} #{value}" for key, value of cfg
  console.table ( { key, value, } for key, value of cfg )
  whisper()
  return null

#-----------------------------------------------------------------------------------------------------------
fetch_pdf_info = ( cfg ) ->
  await import( 'zx/globals' )
  verbose       = $.verbose; $.verbose = false
  pdfinfo_path  = await path_from_executable_name 'pdfinfo'
  stdout        = ( await $"#{pdfinfo_path} #{cfg.input}" ).stdout.trim()
  R             = {}
  #.........................................................................................................
  for line in stdout.split /\n/
    continue unless ( match = line.match /^(?<key>[^:]+):\s*(?<value>.*)$/ )?
    key   = match.groups.key.toLowerCase()
    value = match.groups.value
    switch key
      when 'pages'
        R.pagecount = parseInt value, 10
      when 'page size'
        unless ( submatch = value.match /(?<page_width>[\d.]+)\s*x\s*(?<page_height>[\d.]+)\s*pts/ )?
          warn "^33847^ unable to parse #{rpr line}"
          R.page_width  = 210
          R.page_height = 297
          continue
        R.page_width  = H.mm_from_pt parseFloat submatch.groups.page_width
        R.page_height = H.mm_from_pt parseFloat submatch.groups.page_height
      else
        null
  #.........................................................................................................
  $.verbose = verbose
  info '^690-1^', "PDF: #{rpr R}"
  return R

#-----------------------------------------------------------------------------------------------------------
fetch_pagedistro = ( cfg ) ->
  Object.assign cfg, await fetch_pdf_info cfg
  cfg.sheetcount      = cfg.pagecount // cfg.layout.pps
  remainder           = cfg.pagecount %% cfg.layout.pps
  cfg.sheetcount++ if remainder isnt 0
  cfg.blank_pagecount = cfg.layout.pps - remainder
  R                   = [ 1 .. cfg.pagecount ]
  return R if cfg.blank_pagecount is 0
  split               = deep_copy cfg.mtr_split
  #.........................................................................................................
  ### turn RPNRs into LPNRs ###
  ### TAINT correct or complain about PNRs outside the allowed range ###
  for d in split
    if isa.negative d.pnr
      d.pnr = cfg.pagecount + d.pnr
  #.........................................................................................................
  inserts = {}
  bpc     = cfg.blank_pagecount
  loop
    break if bpc < 0
    for d in split
      continue if d.count <= 0
      bpc--
      break if bpc < 0
      d.count--
      inserts[ d.pnr ] = ( inserts[ d.pnr ] ?= 0 ) + 1
  #.........................................................................................................
  R = ( [ pnr, ] for pnr in R )
  for pnr_txt, count of inserts
    pnr = parseInt pnr_txt, 10
    idx = pnr - 1
    # ### thx to https://2ality.com/2018/12/creating-arrays.html#creating-ranges-of-integer-values ###
    # R[ idx ].push Array.from { length, }, ( _, i ) -> -1
    R[ idx ].push -1 for _ in [ 1 .. count ]
  R = R.flat()
  #.........................................................................................................
  return R

#-----------------------------------------------------------------------------------------------------------
run_impose = ( cfg ) ->
  ### TAINT should normalize path ###
  ### TAINT inconsistent naming ###
  cfg.bdp_path          = cfg.backdrop
  # cfg.bdp_path          = resolve cfg.tempdir, 'backdrop.pdf'
  cfg.mtr_split         = types.data.mtr_split
  cfg.input             = resolve cfg.input
  cfg.output            = resolve cfg.output
  cfg.pagedistro        = await fetch_pagedistro cfg
  cfg.ovl_path          = resolve cfg.tempdir, 'overlay.pdf'
  debug '^3553^', { pagedistro: cfg.pagedistro, }
  show_cfg cfg
  mtr                   = new Metteur()
  cfg.imposition        = await mtr._impose cfg
  # process.exit 111
  await run_tex_etc cfg
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
                --tempdir     -t
            """
      #-----------------------------------------------------------------------------------------------------
      'impose':
        description:  "assemble pages from one PDF file into a new PDF, to be folded into a booklet"
        runner: ( d ) =>
          cfg             = types.create.mtr_impose_cfg d.verdict.parameters
          # await GUY.temp.with_directory { keep: true, }, ({ path }) ->
          ### TAINT `cfg` key/value duplication ###
          if cfg.tempdir?
            mkdirp.sync cfg.tempdir
            return await run_impose cfg
          else
            do ( path = '/tmp/guy.temp--12229-ZUjUOVQEIZXI' ) ->
              cfg.tempdir = path
              return await run_impose cfg
          return null
        flags:
          'layout':
            alias:        'l'
            type:         String
            description:  "name of a layout; defaults to 'pps16'"
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
            type:         String
            # positional:   true
            description:  "use positive page nr or negative count to control insertion of empty pages"
          'tempdir':
            alias:        't'
            type:         String
            # positional:   true
            description:  "use the directory given to run TeX in instead of a temporary directory"
          'backdrop':
            alias:        'b'
            type:         String
            # positional:   true
            description:  "use the PDF or image given as a backdrop"
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

