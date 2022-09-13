

# Metteur


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Metteur](#metteur)
  - [Terminology](#terminology)
  - [16-page Booklet](#16-page-booklet)
  - [Discussion of Alternative Solutions](#discussion-of-alternative-solutions)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



# Metteur

## Terminology

<dl>

  <dt>*Sheet*</dt><dd>(L *???*, G *Bogen*) the piece of paper to be printed on (in DTP A4 or US Letter most
  of the time).</dd>

  <dt>*Recto*</dt><dd>(also *obverse*; L *recto*, G *Schön(druck)*) the front side of the Sheet.</dd>

  <dt>*Verso*</dt><dd>(also *reverse*; L *verso*, G *Wider(druck)*) the back side of the Sheet.</dd>

  <dt>*Leaf*</dt><dd>(L *folium*, G *Blatt*) strictly, each pair of odd and even Pages of the bound book;
  however, often 'pages' is used to refer to a single side of a Leaf or both sides of a Leaf
  indiscriminately.</dd>

  <dt>*Page*</dt><dd>(L *pagina*, G *Seite*) strictly, the odd or even side of a Leaf, but often used to
  mean Leaf sensu stricto.</dd>

  </dl>

## 16-page Booklet


* scale to 104% (210mm ✕ 297mm ➔ 220mm ✕ 307mm) when sending to printer
* this is to accommodate for behavior of Brother laser printer: it has a margin of 5mm on all edges and will 
  scale down an A4 PDF to an area of 200mm ✕ 269mm instead of leaving it at 210mm ✕ 279mm (A4). 
  To compensate, we scale all pages b a factor of `210/200 ≈ 279/269 ≈ 1.04`
* page 1 is always 'close to the heart' (i.e. in the lower left corner of the printing sheet)


## Discussion of Alternative Solutions

* Scribus
  * produces absolutely **huge** PDF files. In one case, I had a sample booklet with 16 basically empty
    pages, calibration lines copied and pasted onto each page, and a single PNG that weighed in at 760kB.
    From this I produced a 5.9MB PDF which in turn got referenced by a Scribus file where all 16 A7 pages
    were individually inserted, rotated and positioned on two A4 pages. Turn *that* file into a PDF (by
    selecting `File > Print...`) and Scribus will export a 200MB heavyweight. I uploaded that to the Adobe
    PDF compressing service and they came back to me with a slim 144kB feather weight, less than 1/1000 of
    the file output by Scribus.
