

# Metteur


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Metteur](#metteur)
  - [Terminology](#terminology)
  - [16-page Booklet](#16-page-booklet)
  - [Discussion of Alternative Solutions](#discussion-of-alternative-solutions)
  - [Internals](#internals)
  - [External Dependencies](#external-dependencies)
  - [To Do](#to-do)
  - [Is Done](#is-done)

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

from [*Wikipedia: Bookbinding*](https://en.wikipedia.org/wiki/Bookbinding#Terms_and_techniques):

* A bifolium (often wrongly called a "bifolio", "bi-folio", or even "bifold") is a single sheet folded in
  half to make two leaves. The plural is "bifolia", not "bifoliums".
* A section, sometimes called a gathering, or, especially if unprinted, a quire, is a group of bifolia
  nested together as a single unit. In a completed book, each quire is sewn through its fold. Depending on
  how many bifolia a quire is made of, it could be called:
  * duernion – two bifolia, producing four leaves;
  * ternion – three bifolia, producing six leaves;
  * quaternion – four bifolia, producing eight leaves;
  * quinternion – five bifolia, producing ten leaves;
  * sextern or sexternion – six bifolia, producing twelve leaves.

* In bookbinding, a section, gathering, or signature is a group of sheets folded in half, to be worked into
  the binding as a unit.—[*Wikipedia: Section
  (bookbinding)*](https://en.wikipedia.org/wiki/Section_(bookbinding))

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

## Internals

* see [README for internals](./README-internals.md) like templating used to build the TeX source for the
  assembled booklet

## External Dependencies

* (Xe)LaTeX
  * `sudo apt install -y texlive-xetex xelatex`
  * the above should install all of
    * `fonts-texgyre`
    * `libptexenc1`
    * `libtexlua53`
    * `libtexluajit2`
    * `preview-latex-style`
    * `tex-common`
    * `tex-gyre`
    * `texlive-base`
    * `texlive-binaries`
    * `texlive-fonts-recommended`
    * `texlive-latex-base`
    * `texlive-latex-extra`
    * `texlive-latex-recommended`
    * `texlive-pictures`
    * `texlive-plain-generic`
    * `texlive-xetex`
* `pdfinfo`
  * `sudo apt install -y poppler-utils`

<del>* [zx](https://github.com/google/zx):</del>
<del>  * in turn, requires NodeJS >= 16.0.0</del>
<del>  * `pnpm add -g zx`</del>
<del>  * `npm i -g zx`</del>

## To Do

* **[–]** implement support for booklets with pagecounts not divisible by the selected pages per sheet (PPS)
  number
* **[–]** allow to 'split' source PDFs at (positive) page № or (negative) page count as in `split=12`,
  `split=-1`; pages before the split will be mapped onto their positions from booklet front end, pages after
  the split to their positions from booklet back end. Anticipated most frequent use is adding `split=-1` to
  insert empty pages near the end of the booklet but keep the last page of the source PDF as last page of
  the booklet.
* **[–]** allow to specify layout in terms of
  * **[–]** pages per sheet (unit `pps`, the default) or half that number, 'n-up' as in `8up` (meaning the
    same as `16pps` or simply `16`)
  * **[–]** folding method. See [*Glisterings*](https://tug.org/TUGboat/tb31-3/tb99glister.pdf) and
    [*Printing booklets with
    LaTeX*](https://ctan.mc1.root.project-creative.net/macros/latex/contrib/booklet/booklet.pdf) for different
  * **[–]** row and column counts (see `nup` argument in [*Creating Pocket-sized Books Using
    LATEX*](https://tug.org/pracjourn/2006-3/venugopal-pocketbook/venugopal-pocketbook.pdf))
* **[–]** support signatures so that several sheets can be bound into a quire (section)
* **[–]** implement G. *Bundzuwachs*, the amount of whitespace to be added to the gutter to account for fold
  thickness; see [*Booklets erzeugen*](https://tobiw.de/tbdm/booklets-erzeugen)
* **[–]** implement `--pages` CLI argument to select which pages whould be taken from source in which order;
  can use both positive numbers for 1-based page №s and negative numbers for pages counted from back as well
  as ranges (use `..` for those to avoid conflict with minus sign)


## Is Done

* **[+]** implement `--help` option for CLI
