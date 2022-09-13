



# Metteur


## 16-page Booklet


* each A4 page scaled to 220mm ✕ 307mm
* each inserted A7 page scaled to 76.75mm ✕ 110mm
* this is to accommodate for behavior of Brother laser printer: it has a margin of 5mm on all edges and will 
  scale down an A4 PDF to an area of 200mm ✕ 269mm instead of leaving it at 210mm ✕ 279mm (A4). 
  To compensate, we scale all pages b a factor of `210/200 ≈ 279/269 ≈ 1.04`


## Discussion of Alternative Solutions

* Scribus
  * produces absolutely **huge** PDF files. In one case, I had a sample booklet with 16 basically empty
    pages, calibration lines copied and pasted onto each page, and a single PNG that weighed in at 760kB.
    From this I produced a 5.9MB PDF which in turn got referenced by a Scribus file where all 16 A7 pages
    were individually inserted, rotated and positioned on two A4 pages. Turn *that* file into a PDF (by
    selecting `File > Print...`) and Scribus will export a 200MB heavyweight. I uploaded that to the Adobe
    PDF compressing service and they came back to me with a slim 144kB feather weight, less than 1/1000 of
    the file output by Scribus.
