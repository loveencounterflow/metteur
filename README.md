

# Metteur


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Metteur](#metteur)
  - [Terminology](#terminology)
  - [Configuration](#configuration)
    - [Configuration: `split`](#configuration-split)
  - [16-page Booklet](#16-page-booklet)
  - [Discussion of Alternative Solutions](#discussion-of-alternative-solutions)
  - [Internals](#internals)
  - [External Dependencies](#external-dependencies)
  - [Literature](#literature)
  - [To Do](#to-do)
  - [Is Done](#is-done)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



# Metteur

## Terminology

<dl>

  <dt>*Sheet* (L *???*, G *Bogen*)</dt><dd>the piece of paper to be printed on (in DTP A4 or US Letter most
  of the time).</dd>

  <dt>*Recto* (also *obverse*; L *recto*, G *Schön(druck)*)</dt><dd>the front side of the Sheet.</dd>

  <dt>*Verso* (also *reverse*; L *verso*, G *Wider(druck)*)</dt><dd>the back side of the Sheet.</dd>

  <dt>*Leaf* (L *folium*, G *Blatt*)</dt><dd>strictly, each pair of odd and even Pages of the bound book;
  however, often 'pages' is used to refer to a single side of a Leaf or both sides of a Leaf
  indiscriminately.</dd>

  <dt>*Page* (L *pagina*, G *Seite*)</dt><dd>strictly, the odd or even side of a Leaf, but often used to
  mean Leaf sensu stricto.</dd>

  <dt>*Gathering* (also *signature*, *quire*, *section*; G *Lage*, *Falzbogen*)</dt><dd>[Symbol **g**] "In
  bookbinding, a section, gathering, or signature is a group of sheets folded in half, to be worked into the
  binding as a unit."—([*Wikipedia*](https://en.wikipedia.org/wiki/Section_(bookbinding)))</dd>

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

## Configuration

* `sheet`: the paper to be printed on
  * `size`: sheet size fixed (for now) at `'a4'` equalling `'210mm x 297mm'`
  * `duplex`: duplex mode, fixed (for now) at `'long-edge'` (alternative `'short-edge'`)
  * `folds`: how to fold; fixed (for now) at `'hb,vb,hb'`
  * `cuts`: how to cut; not supported but see
    [*Glisterings*](https://tug.org/TUGboat/tb31-3/tb99glister.pdf) for examples
  * `split`: where to insert blank pages. A list of left-starting (positive) page numbers (LPNRs) and
    right-starting (negative) page numbers (RPNRs), optionally with number of pages to be inserted.


<!--
layout =
  orientation: 'ltr' # or 'rtl' which will invert the orientation of all pages, allowing for CJK, Arabic RTL books
  recto:
    left:   [  4, 13, 16,  1, ]
    right:  [  5, 12,  9,  8, ]
  verso:
    left:   [  6, 11, 10,  7, ]
    right:  [  3, 14, 15,  2, ]

 -->

### Configuration: `split`

The `split` paramter allows one to insert blank pages when the source has a pagecount that is not an integer
multiple of the signature page count. So for example, when there is a source with 14 pages but one wants to
produce a booklet of 16 pages, two blank pages have to be inserted, either one page at two locations each or
two pages at one location. It will often be customary to insert a blank page after the title page and on
right before the last page; the command for this would look like `metteur split='1,-1' ...`.

`split` accepts a comma-separated list of left- and right-anchored numbers, which are expressed as positive
and negative numbers, respectively. So to identify page 7 in an 8-page booklet, one can either use `7` (or
`+7`) when counting from the front, and `-2` when counting from the back. Counting from the back is
sometimes preferred because e.g. `-1` always identifies the last page of a book, irrespective of its page
count.

The below schematic shows, in the top half, how pages are numbered in a booklet with 8 pages: `[ p+1 ]`
thru `[ p+8 ]` when counting from the left, and `[ p-1 ]` thru `[ p-8 ]` when counting from the right.
Inserting pages can take only place before or after a page; to identify these spots, we introduce a 'split
number' that refers to those places as `( s+0 )` for the frontmost and `( s+8 )` for the very last
positions. Counting from the back, we have `( s-0 )` for the last and `( s-8 )` for the first position with
the effect that, when using left-anchored numbers, the split position `+n` comes right *after* (to the
right) page `+n`, but when counting from the right, split position `-n` comes right *before* (to the left)
of page `-n`:


```
      [ p+1 ]    [ p+2 ]    [ p+3 ]    [ p+4 ]    [ p+5 ]    [ p+6 ]    [ p+7 ]    [ p+8 ]
      [ p-8 ]    [ p-7 ]    [ p-6 ]    [ p-5 ]    [ p-4 ]    [ p-3 ]    [ p-2 ]    [ p-1 ]
   ╱╲         ╱╲         ╱╲         ╱╲         ╱╲         ╱╲         ╱╲         ╱╲         ╱╲
 ( s+0 )    ( s+1 )    ( s+2 )    ( s+3 )    ( s+4 )    ( s+5 )    ( s+6 )    ( s+7 )    ( s+8 )
 ( s-8 )    ( s-7 )    ( s-6 )    ( s-5 )    ( s-4 )    ( s-3 )    ( s-2 )    ( s-1 )    ( s-0 )
```


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

* a suitable installation of [`LaTeX`](https://en.wikipedia.org/wiki/LaTeX); this can be one of the
  following:
  * (Xe)LaTeX as provided by `apt`:
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
  * The [TeXLive](https://en.wikipedia.org/wiki/TeX_Live) distro:
    * see instructions for installation at [tug.org/texlive](https://tug.org/texlive/). This has become more
      less the standard way to install things; users be warned that the download volume is huge so you may
      want to make sure there's enough free disk space.
  * A new and exciting way to run TeX is [Tectonic
    Typesetting](https://github.com/tectonic-typesetting/tectonic); one can download the smallish executable
    from the [releases page](https://github.com/tectonic-typesetting/tectonic/releases). To test it, I
    grapped the v0.9 `*.AppImage` file, made it executable with `chmod +x tectonic-0.9.0-x86_64.AppImage`,
    and compiled a sample booklet with `./tectonic-0.9.0-x86_64.AppImage booklet.tex`. This downloaded the
    requisite TeX/LaTeX files from some undisclosed but totally trustworthy location on the Internet, stores
    them (under Linux at `~/.cache/Tectonic`) and then compiled the PDF, correctly it seems. To go this way,
    it is probably simplest to put a symlink name `xelatex` to the `*.AppImage` somewhere on your
    executables path. A future version of Metteur might add support for Tectonic; interested folks should
    also check out [Tectonic's homepage](https://tectonic-typesetting.github.io/en-US/) as well as [a 2017
    discussion on Hacker News](https://news.ycombinator.com/item?id=14450448) and [a 2019 discussion at the
    same venue](https://news.ycombinator.com/item?id=21172964) for more info. For people who'd prefer
    software not to download other software onto their machines, see [this
    comment](https://news.ycombinator.com/item?id=14450690) that hints at how that can be avoided.

* `pdfinfo`
  * `sudo apt install -y poppler-utils`

<del>* [zx](https://github.com/google/zx):</del>
<del>  * in turn, requires NodeJS >= 16.0.0</del>
<del>  * `pnpm add -g zx`</del>
<del>  * `npm i -g zx`</del>

## Literature

* [Wikipedia *Section (bookbinding)*](https://en.wikipedia.org/wiki/Section_(bookbinding))

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
* **[–]** consider to notate layouts in terms of rows instead of columns; this allows ro mimick the
  geometric arrangement in the notation for easier reference


## Is Done

* **[+]** implement `--help` option for CLI
* **[+]** do not store layouts in declaration of type `mtr_impose_cfg`
