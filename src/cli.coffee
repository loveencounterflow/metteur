

'use strict'


############################################################################################################
GUY                       = require 'guy'
{ debug
  info
  whisper
  warn
  urge
  help }                  = GUY.trm.get_loggers 'METTEUR'
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
run_tex = ( d ) -> new Promise ( resolve, reject ) =>
  cmd = PATH.resolve PATH.join __dirname, '../bin/run-tex'
  debug '^3453^', cmd
  debug '^3453^', "run #{cmd}"
  cp = CP.spawn cmd, []
  cp.stdout.setEncoding 'utf-8'
  cp.stderr.setEncoding 'utf-8'
  cp.stdout.on 'data', ( data ) -> help data
  cp.stderr.on 'data', ( data ) -> urge data
  # cp.on 'exit',  ( code, signal ) -> debug '^exit@3534^',  { code, signal, }; resolve()
  cp.on 'close', ( code, signal ) -> debug '^close@3534^', { code, signal, }; resolve()
  return null

#-----------------------------------------------------------------------------------------------------------
move_output_to_target = ( d ) ->
  FS.moveSync


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
                --input   -i
                --output  -o
            """
      #-----------------------------------------------------------------------------------------------------
      'impose':
        description:  "assemble pages from one PDF file into a new PDF, to be folded into a booklet"
        runner: ( d ) =>
          cfg         = types.create.mtr_cli_impose_cfg d.verdict.parameters
          cfg.input   = resolve cfg.input
          cfg.output  = resolve cfg.output
          whisper()
          whisper "#{to_width "#{key}:", 20} #{value}" for key, value of cfg
          whisper()
          mtr = new Metteur()
          mtr.impose cfg
          await run_tex()
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
      #-----------------------------------------------------------------------------------------------------
      'tex':
        description:  "run XeLaTeX on tex/booklet.tex to produce tex/booklet.pdf"
        runner: run_tex
  #.........................................................................................................
  MIXA.run jobdefs, process.argv
  return null



############################################################################################################
if module is require.main then do =>
  # await demo_receiver()
  await @cli()
