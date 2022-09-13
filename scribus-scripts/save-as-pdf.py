#!/usr/bin/env python
# -*- coding: utf-8 -*-

""" 

Convert a document to a PDF

Run with a command like
  scribus -g -py export_to_pdf.py -version 13 -bleedr 2 -compress 1 -info 'test title' -file 'test.pdf' -- testdoc.sla

You can set any "pdf" attribute with "-attribute value".

Author: William Bader, Director of Research and Development, SCS, http://www.newspapersystems.com
15Sep15 wb initial version

"""

# check that the script is running from inside scribus

try:
  from scribus import *
  
except ImportError:
  print( 'This script only runs from within Scribus.' )
  sys.exit(1)

# get the os module

try:
  import os

except ImportError:
  print( 'Could not import the os module.' )
  sys.exit(1)

def main(argv):
  pdf         = scribus.PDFfile()
  pdf.pages   = [ 1, 2, ]
  pdf.version = 15
  pdf.file    = 'newfile.pdf'
  print( "saving..." )
  pdf.save()
  print( "done." )
  return None

  i = 1
  while i < len(argv):
    if (len(argv[i]) > 0) and (argv[i][0] == '-'):
      name = argv[i][1:]
      try:
        pdf_attr = getattr(pdf, name)
        if i < len(argv):
          i = i + 1
          value = argv[i]
        else:
          value = ''
        if callable(pdf_attr):
          print( 'Error: "', name, '" is not a settable attribute.' )
        else:
          if isinstance(pdf_attr, float):
            try:
              setattr(pdf, name, float(value))
            except:
              print( 'Error: Could not set "', name, '", "', value, '" is not a valid real number.' )
          elif isinstance(pdf_attr, int):
            # Integers and booleans
            try:
              if value.lower() in [ 'true', 't', 'yes', 'y', 'si', 's', 'oui', 'o' ]:
                setattr(pdf, name, 1)
              elif value.lower() in [ 'false', 'f', 'no', 'n' ]:
                setattr(pdf, name, 0)
              else:
                setattr(pdf, name, int(value))
            except:
              print( 'Error: Could not set "', name, '", "', value, '" is not a valid integer.' )
          elif isinstance(pdf_attr, basestring):
            # Should this differentiate str and unicode, or will the assignment do the conversion?
            try:
              setattr(pdf, name, value)
            except:
              print( 'Error: Could not set "', name, '", "', value, '" is not a valid string.' )
          else:
            print( 'Error: Could not set "', name, ', type "', type(pdf_attr), '" not supported.' )
          print( name, ' is ', str(getattr(pdf, name)), '.' )
      except:
        print( 'Error: Ignoring unrecognized pdf attribute "', name, '".' )
    i = i + 1

  pdf.save()


############################################################################################################
if __name__ == '__main__':
  if haveDoc():
    main(sys.argv)
  else:
    print( 'Error: You need to have a document open before you can run this script successfully.' )

