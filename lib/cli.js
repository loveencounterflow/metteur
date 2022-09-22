(function() {
  'use strict';
  var $echo_channels, $process_nmap_output, FS, GUY, MIXA, PATH, debug, echo, help, info, isa, rpr, show_hosts, types, urge, validate, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({debug, info, whisper, warn, urge, help} = GUY.trm.get_loggers('METTEUR'));

  ({rpr, echo} = GUY.trm);

  //...........................................................................................................
  PATH = require('path');

  FS = require('fs');

  types = require('./types');

  ({isa, validate} = types);

  MIXA = require('mixa');

  // { spawn }                 = require 'child_process'

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  types.declare('sql_insert_target_encoding', function(x) {
    return x === 'binary' || x === 'text';
  });

  //-----------------------------------------------------------------------------------------------------------
  $echo_channels = function() {
    return $watch((d) => {
      switch (d.$key) {
        case '^stdout':
          echo(CND.yellow(d.$value));
          break;
        case '^stderr':
          echo(CND.red(d.$value));
          break;
        default:
          debug(d); //.$value
      }
      return null;
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  $process_nmap_output = function() {
    var blank_re, entry, first_noname_re, first_re, latency_re, mac_re;
    blank_re = /^\s*$/;
    first_re = /^Nmap scan report for (?<name>.*)\s+\((?<ip>[0-9a-f.]+)\)/;
    first_noname_re = /^Nmap scan report for (?<ip>[0-9a-f.]+)$/;
    latency_re = /^Host is up \((?<latency>\S+) latency\)\.$/;
    mac_re = /^MAC Address: (?<mac>[0-9A-F:]+) \((?<info>.*)\)$/;
    entry = null;
    return $(function(d, send) {
      var line, match, ref, ref1;
      if ((ref = d.$key) === '<cp' || ref === '>cp') {
        return send(d);
      }
      if (d.$key !== '^stdout') {
        echo(CND.red((ref1 = d.$value) != null ? ref1 : d));
        return;
      }
      //.......................................................................................................
      line = d.$value;
      if ((line.match(blank_re)) != null) {
        return;
      }
      if (line.startsWith('Starting Nmap ')) {
        return;
      }
      if (line.startsWith('Nmap done: ')) {
        if (entry != null) {
          send(freeze(entry));
        }
        entry = null;
      } else if ((match = line.match(first_re)) != null) {
        if (entry != null) {
          send(freeze(entry));
        }
        entry = {...match.groups};
      } else if ((match = line.match(first_noname_re)) != null) {
        if (entry != null) {
          send(freeze(entry));
        }
        entry = {...match.groups};
      } else if (line === 'Host is up.') {
        entry.status = 'up';
      } else if ((match = line.match(latency_re)) != null) {
        entry.latency = match.groups.latency;
        entry.status = 'up';
      } else if ((match = line.match(mac_re)) != null) {
        entry.mac = match.groups.mac;
        if ((match.groups.info != null) && (match.groups.info !== 'Unknown')) {
          entry.info = match.groups.info;
        }
      } else {
        echo(CND.red('???', rpr(line)));
      }
      // echo CND.grey d
      return null;
    });
  };

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  show_hosts = function() {
    return new Promise(async(resolve, reject) => {
      var cp, pipeline, ref, source, x;
      source = SP.new_push_source();
      pipeline = [];
      pipeline.push(source);
      pipeline.push(SP.$split_channels());
      pipeline.push($process_nmap_output());
      pipeline.push($watch(function(d) {
        var ref, ref1, ref2, ref3;
        if ((ref = d.$key) === '<cp' || ref === '>cp') {
          return;
        }
        // echo CND.steel d
        return echo(CND.yellow((ref1 = d.ip) != null ? ref1 : '?', (ref2 = d.name) != null ? ref2 : '?', '(' + ((ref3 = d.info) != null ? ref3 : '?') + ')'));
      }));
      // pipeline.push $show()
      pipeline.push($drain(function() {
        return resolve();
      }));
      SP.pull(...pipeline);
      cp = spawn('sudo', ['nmap', '-sn', '192.168.190.0/24']);
      ref = JFEE.Receiver.from_child_process(cp);
      for await (x of ref) {
        source.send(x);
      }
      source.end();
      //.........................................................................................................
      return null;
    });
  };

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.cli = function() {
    var jobdefs;
    //.........................................................................................................
    jobdefs = {
      commands: {
        //-----------------------------------------------------------------------------------------------------
        'impose': {
          description: "assemble pages from one PDF file into a new PDF, to be folded into a booklet",
          runner: (d) => {
            var cfg;
            debug('^345345^', process.argv);
            debug('^77665^', cfg = types.create.mtr_cli_impose_cfg(d.verdict.parameters));
            (require('./main')).demo();
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
            }
          }
        }
      }
    };
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