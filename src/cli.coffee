

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
PATH                      = require 'path'
FS                        = require 'fs'
types                     = require './types'
{ isa
  validate }              = types
MIXA                      = require 'mixa'
# { spawn }                 = require 'child_process'


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
types.declare 'sql_insert_target_encoding', ( x ) -> x in [ 'binary', 'text', ]

#-----------------------------------------------------------------------------------------------------------
$echo_channels = ->
  return $watch ( d ) =>
    switch d.$key
      when '^stdout' then echo CND.yellow d.$value
      when '^stderr' then echo CND.red d.$value
      else debug d #.$value
    return null

#-----------------------------------------------------------------------------------------------------------
$process_nmap_output = ->
  blank_re              = /^\s*$/
  first_re              = /^Nmap scan report for (?<name>.*)\s+\((?<ip>[0-9a-f.]+)\)/
  first_noname_re       = /^Nmap scan report for (?<ip>[0-9a-f.]+)$/
  latency_re            = /^Host is up \((?<latency>\S+) latency\)\.$/
  mac_re                = /^MAC Address: (?<mac>[0-9A-F:]+) \((?<info>.*)\)$/
  entry                 = null
  return $ ( d, send ) ->
    return send d if d.$key in [ '<cp', '>cp', ]
    if d.$key isnt '^stdout'
      echo CND.red d.$value ? d
      return
    #.......................................................................................................
    line = d.$value
    return if ( line.match blank_re )?
    return if line.startsWith 'Starting Nmap '
    if line.startsWith 'Nmap done: '
      send freeze entry if entry?
      entry = null
    else if ( match = line.match first_re )?
      send freeze entry if entry?
      entry = { match.groups..., }
    else if ( match = line.match first_noname_re )?
      send freeze entry if entry?
      entry = { match.groups..., }
    else if line is 'Host is up.'
      entry.status = 'up'
    else if ( match = line.match latency_re )?
      entry.latency = match.groups.latency
      entry.status = 'up'
    else if ( match = line.match mac_re )?
      entry.mac   = match.groups.mac
      entry.info  = match.groups.info if match.groups.info? and ( match.groups.info isnt 'Unknown' )
    else
      echo CND.red '???', rpr line
    # echo CND.grey d
    return null

#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
show_hosts = -> new Promise ( resolve, reject ) =>
  source      = SP.new_push_source()
  pipeline    = []
  pipeline.push source
  pipeline.push SP.$split_channels()
  pipeline.push $process_nmap_output()
  pipeline.push $watch ( d ) ->
    return if d.$key in [ '<cp', '>cp', ]
    # echo CND.steel d
    echo CND.yellow ( d.ip ? '?' ), ( d.name ? '?' ), ( '(' + ( d.info ? '?' ) + ')' )
  # pipeline.push $show()
  pipeline.push $drain -> resolve()
  SP.pull pipeline...
  cp = spawn 'sudo', [ 'nmap', '-sn', '192.168.190.0/24', ]
  source.send x for await x from JFEE.Receiver.from_child_process cp
  source.end()
  #.........................................................................................................
  return null


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
@cli = ->
  #.........................................................................................................
  jobdefs =
    commands:
      #-----------------------------------------------------------------------------------------------------
      'impose':
        description:  "assemble pages from one PDF file into a new PDF, to be folded into a booklet"
        runner: ( d ) =>
          debug '^345345^', process.argv
          debug '^77665^', cfg = types.create.mtr_cli_impose_cfg d.verdict.parameters
          ( require './main' ).demo()
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
  #.........................................................................................................
  MIXA.run jobdefs, process.argv
  return null



############################################################################################################
if module is require.main then do =>
  # await demo_receiver()
  await @cli()
