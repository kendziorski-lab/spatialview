# SpatialView

SpatialView is a web browser-based interactive application to visualize 10x spatial trascriptomics data.
[paper link](https://doi.org/10.1093/bioinformatics/btae117)

![](spatialview_screenshot.png)

**[Demo Application - Cancer micro environment](https://www.biostat.wisc.edu/~kendzior/spatialviewdemo/)**

**[Demo Application - Tissue repair](https://www.biostat.wisc.edu/~cmohanty2/spatialview-demo/tissue-repair/)**

**[User Guide](https://raw.githubusercontent.com/kendziorski-lab/kendziorski-lab.github.io/main/projects/spatialview/user_guide.pdf)**

**Citation**  
Chitrasen Mohanty, Aman Prasad, Lingxin Cheng, Lisa M Arkin, Bridget E Shields, Beth Drolet, Christina Kendziorski.  
*SpatialView: an interactive web application for visualization of multiple samples in spatial transcriptomics experiments*.  
**Bioinformatics**, Volume 40, Issue 3, March 2024, btae117.  
[https://doi.org/10.1093/bioinformatics/btae117](https://doi.org/10.1093/bioinformatics/btae117)

## Installation
Spatial Transciptomic (ST) data from 10x experiments can be visualized in SpatialView multiple ways.


### From R
To run SpatialView from R environment you may use [SpatialViewR](https://github.com/kendziorski-lab/SpatialViewR) package. 
Currently [SpatialViewR](https://github.com/kendziorski-lab/SpatialViewR) supports *Seurat* and *SpatialExperiment*.

- [A step by step guide to export data from Seurat object](https://kendziorski-lab.github.io/projects/spatialview/SpatialView_Tutorial_Using_Seurat.html)
- [A step by step guide to export data from SpatialExperiment](https://kendziorski-lab.github.io/projects/spatialview/SpatialView_Tutorial_Using_SpatialExperiment.html)
### From Python
To run SpatialView from python environment you may use [SpatialViewPy](https://github.com/kendziorski-lab/SpatialViewPy).

- [A step by step guide to export data from Scanpy object](https://github.com/kendziorski-lab/SpatialViewPy/blob/main/notebooks/tutorial.ipynb)

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

### FAQ

1. Can I change the web port?

Yes. Port number 8878 is default port in the *prepare10x_from_seurat* and *prepare10x_from_SpatialExperiment* functions in [SpatialViewR](https://github.com/kendziorski-lab/SpatialViewR) package. You can pass a different port number in these functions.

2. Once a port is used, I get 'port in use' error on my next run.

Currently, SpatialViewR doesn't track the web process. To avoid the using the previously used port, you can provide a different port number in the *prepare10x_from_seurat* and *prepare10x_from_SpatialExperiment* functions. Alternative, you can kill the current process that uses the port. the following code may be helpful in Linux or MacOS
```
$ lsof -i :8878

#COMMAND   PID      USER   FD   TYPE     DEVICE SIZE/OFF NODE NAME
#Python  55461      XXX    XX  XX.       XX      XX  TCP *:8878 (LISTEN)

$kill 55461
```
