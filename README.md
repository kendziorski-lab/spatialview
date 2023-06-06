# SpatialView

SpatialView is a web browser-based interactive application to visualize 10x spatial trascriptomics data.
(paper link: *pending publication*).

![](spatialview_screenshot.png)

Spatial Transciptomic (ST) data from 10x experiments can be visualized in SpatialView multiple ways.

### From R
To run SpatialView from R environment you may use ![SpatialViewR](https://github.com/kendziorski-lab/SpatialViewR) package. 
Currently ![SpatialViewR](https://github.com/kendziorski-lab/SpatialViewR) supports *Seurat* and *SpatialExperiment*.

- ![A step by step guide to export data from Seurat object](https://kendziorski-lab.github.io/projects/spatialview/SpatialView_Tutorial_Using_Seurat.html)
- ![A step by step guide to export data from SpatialExperiment](https://kendziorski-lab.github.io/projects/spatialview/SpatialView_Tutorial_Using_SpatialExperiment.html)
### From Python
To run SpatialView from python environment you may use ![SpatialViewPy](https://github.com/kendziorski-lab/SpatialViewPy).

- ![A step by step guide to export data from Scanpy object](https://kendziorski-lab.github.io/projects/spatialview/SpatialView_Tutorial_Using_Scanpy.html)

### Code from GitHub
SpatialView application can be downloaded from GitHub, and can be run in local machine by following steps. Note that, application can run from any http server, however the following steps assume that Python is installed on the local machine and the application runs in Python htt.server.
Download the file from here to your local system and Unzip the folder.
Place your processed data in the data folder.

Each sample should have its own directory and may contain following files for a sample:
**Expression matrix**:

  Option 1 - Sparse matrix (preferred): compressed sparse column-oriented (CSC) format, barcodes.csv, genes.csv

  Option 2 - Dense matrix: a csv file with barcodes as columns and genes name in an additional column

**cluster_info.csv**: columns are "cluster","color","name","genes"

**metadata.csv**: A csv file, each row represents a barcodes. A column containing cluster membership is expected

**sample_info.csv**: A csv file with sample level metadata information

**scalefactors_json.json**: Scale factor file from cellranger output

**tissue_hires_image.png**: High resolution H&E image from cellranger output

Using the terminal window go to the unzipped folder (use the cd command in the terminal window to change the folder) Then run the following command

``python -m http.server 8000``

Then, using your browser (Google Chrome is preferred), open *http://localhost:8000*

## FAQ