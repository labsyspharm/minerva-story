---
title: 'Minerva: a light-weight, narrative image browser for multiplexed tissue images'
tags:
    - visualization
    - image data
    - cancer tissue
    - storytelling
authors:
    - name: John Hoffer^[co-first author]
      orcid: 0000-0002-5877-4266
      affiliation: 1
    - name: Rumana Rashid^[co-first author]
      orcid: 0000-0001-6986-7209
      affiliation: "1, 2, 3"
    - name: Jeremy L. Muhlich
      orcid: 0000-0002-0811-637X
      affiliation: 1
    - name: Yu-An Chen
      orcid: 0000-0001-7228-4696
      affiliation: "1, 2"
    - name: Douglas Peter William Russell
      orcid: 0000-0001-7446-2353
      affiliation: 4
    - name: Juha Ruokonen
      orcid: 0000-0002-6381-121X
      affiliation: 1
    - name: Robert Krueger
      orcid: 0000-0002-6468-8356
      affiliation: "1, 5"
    - name: Hanspeter Pfister
      orcid: 0000-0002-3620-2582
      affiliation: 5
    - name: Sandro Santagata
      orcid: 0000-0002-7528-9668
      affiliation: "1, 2, 3"
    - name: Peter K. Sorger^[corresponding author]
      orcid: 0000-0002-3364-1838
      affiliation: "1, 2, 6"
affiliations:
  - name: Laboratory of Systems Pharmacology, Harvard Medical School, Boston, MA
    index: 1
  - name: Ludwig Center for Cancer Research at Harvard, Harvard Medical School, Boston, MA
    index: 2
  - name: Department of Pathology, Brigham and Women's Hospital, Harvard Medical School, Boston, MA
    index: 3
  - name: Mathworks, Natick, MA
    index: 4
  - name: School of Engineering and Applied Sciences, Harvard University, Cambridge, MA
    index: 5
  - name: Department of Systems Biology, Harvard Medical School, Boston, MA
    index: 6
date: 28 July 2020
bibliography: paper.bib
---

# Summary

Advances in highly multiplexed tissue imaging are transforming our understanding of human biology by enabling detection and localizaton of 10-100 proteins at subcellular resolution [@Bodenmiller:2016]. Efforts are now underway to create public atlases of multiplexed images of normal and diseased tissues [@Rozenblatt-Rosen:2020]. Both research and clinical applications of tissue imaging benefit from recording data from complete specimens so that data on cell state and composition can be studied in the context of overall tissue architecture. As a practical matter, specimen size is limited by the dimensions of microscopy slides (2.5 x 7.5 cm or ~2-8 cm$^2$ of tissue depending on shape). With current microscopy technology, specimens of this size can be imaged at sub-micron resolution across ~60 spectral channels and ~10$^6$ cells, resulting in image files of terabyte size. However, the rich detail and multi-scale properties of these images pose a substantial computational challenge [@Rashid:2020].

In this paper we describe a new open-source visualization tool, Minerva, which facilitates intuitive real-time exploration of large multiplexed images on the web. Minerva employs the OpenSeadragon [@OpenSeadragon] framework to render images at multiple resolutions and makes it possible to pan and zoom across across images in a process analogous to Google Maps. However, tissues contain many specialized structures recognizable by pathologists and histologists but not necessarily by many other scientific or medical users. To capitalize on specialized histology expertise we require software that mimics the current practice in which a pathologists sits alongside a colleague and reviews a specimen by moving from point to point and switching between high and low magnifications.

Minerva is designed to generate precisely these types of interactive guides or "stories". The author of a story creates specific waypoints in the image each with a text description, position, zoom level, and overlaid shape annotations. In the case of highly multiplexed images, a subset of channels is chosen for display at each waypoint (typically 4-8 superimposed channels). Authors also add interactive single-cell data scatterplots, bar charts, heatmaps, and cell outlines with two-way linked navigation between the plots and points in the image. Minerva is deployed simply and inexpensively via static web hosting. See \autoref{fig:workflow}  for a schematic of the workflow and system components.

![Minerva Workflow.\label{fig:workflow}](figure-1.pdf)

Minerva is not designed to solve all analytical and visualization problems encountered in multiplexed tissue imaging. Instead, it is a publication tool specialized to the task of making data shareable and broadly intelligible without requiring specialized software on the user side. As such, Minerva is designed to be one component in an ecosystem of interoperable, open-source software tools.

Minerva comprises two components, _Minerva Story_ and _Minerva Author_. _Minerva Story_ is a single-page web application for presenting an image and its narrative to end users. OpenSeadragon[@OpenSeadragon] is used to render tiled JPEG image pyramids overlaid with the author's narrative text, graphical annotations and data plots. Audio presentation of the narrative text is optionally provided through integration with Amazon's Polly text-to-speech service. The image pyramid URL and all narrative details are loaded from an independent YAML story definition file. Minerva Story is deployed via the Jekyll [@Jekyll] static site generator which allows users to integrate multiple stories and accompanying content into a simple website and host it through GitHub Pages or any other web host supporting static content such as Amazon S3.

_Minerva Author_ is a desktop application for constructing narratives (stories) for Minerva Story. It is a JavaScript React web application with a Python Flask backend, packaged with PyInstaller as a native application. To create a narrative, the author first imports an image in standard OME-TIFF pyramid or SVS formats. Both RGB images (brightfield, H&E, immunohistochemistry, etc.) and multi-channel fluorescence images (immunofluorescence, CODEX, CyCIF, etc.) are supported. Fluorescence image rendering can be controlled through per-channel contrast adjustment and pseudocoloring. The author then adds one or more story waypoints. For each waypoint, the author can type a text description, draw polygon or arrow annotations to highlight specific cells, regions, and histological features, and choose specific image channels to present. See \autoref{fig:author} for the Minerva Author interface. After the waypoints are complete, Minerva Author renders the input image into one or more RGB JPEG image pyramids and produces a YAML story definition file. Finally, an author  uploads the JPEG images (vastly smaller than the raw image data) and YAML file to a web host along with the HTML files produced by Jekyll to generate a finshed, browsable Minerva Story. Story waypoints can be also augmented with interactive linked data visualizations. Adding data visualization currently requires manually editing the YAML file but a version of Minerva Author is in development for adding these types of visualizations natively.

![Minerva Author Interface.\label{fig:author}](figure-2.pdf)

Minerva offers two approaches to exploring a narrative. First, in the author-driven approach, users can progress through a story in a linear path using forward and back navigation buttons, allowing an efficient introduction to and expert overview of the data. Second, in a free-exploration approach, the user is free to move to any position or zoom level and select any channel grouping or segmentation mask. Users can also take a hybrid approach by following a story and then departing from it to freely explore or skip between waypoints. By returning to a story waypoint the narrated overview can be resumed, much as one follows an audio guide in a museum. Minerva supports creating deep links directly to any position and zoom level in an image simply by copying and sharing the current URL from the browser. Users can optionally write a text note and draw a custom shape annotation that is automatically presented to the recipients.

We have identified multiple applications for Minerva: visualizing cell-type classifiers in image space, validating results of unsupervised clustering of single-cell data, manual scanning for spatial patterns, assessing quality of antibody staining, obtaining second opinions from collaborators, sharing high-resolution primary image data alongside published manuscripts, and creating educational content for medical trainees. Minerva is also being used by national consortia to build tissue atlases, and we plan to add it to existing genome browsers such as cBioPortal [@Cerami:2012] and thereby facilitate joint exploration of genomic and histological data.

Detailed [documentation](https://github.com/labsyspharm/minerva-story/wiki) with step-by-step instructions for using Minerva, [tutorial videos](https://github.com/labsyspharm/minerva-story/wiki/Tutorial-Videos), [exemplar data](https://github.com/labsyspharm/minerva-story/wiki/Example-Dataset), and [details on software testing](https://github.com/labsyspharm/minerva-story/wiki/For-Developers) are located alongside the [source code](https://github.com/labsyspharm/minerva-story) on the [Minerva wiki](https://github.com/labsyspharm/minerva-story/wiki) on Github. A wide variety of exemplary Minerva stories can be found at [https://www.cycif.org/software/minerva](https://www.cycif.org/software/minerva).


# Acknowledgements

This work was funded by NIH grants U54-CA225088 and U2C-CA233262 to P.K.S. and S.S., by U2C-CA233280 to P.K.S., and by the Ludwig Cancer Center at Harvard. The Dana-Farber/Harvard Cancer Center is supported in part by an NCI Grant P30-CA06516.

We would like to thank our many users and members of the Laboratory for Systems Pharmacology at Harvard Medical School for their invaluable feedback. Figure 1 was created with BioRender.com.


# References
