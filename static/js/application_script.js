var dataAllPatients = {};
var scaleResolutions = {};
var sampleInfo = {};
var spotExpressions = {}
var clusterInfo = {}
var selectedClusters = [];
var highlightedClusters = [];
var cluster_cols = {};
var cluster_names = {};
var global_current_gene = "";
var global_current_barcode = "";
var global_current_img_url = "";
var global_first_load = true;
var global_loaded_samples = [];
var gloabl_all_barcodes = [];
var global_dim_x = [];
var global_dim_y = [];
var gloabl_all_point_clust_colors = [];
var gloabl_all_point_clust = [];
var app_config = {};
var sampleGenes = [];

var _cache_expr = {};

global_spatial_cor_range = 2000;

//===================Warns user on window back/reload button click =========
window.onbeforeunload = function () {
  return 'Are you sure? Your work will be lost. ';
};

//================== Window resize alert =================
window.addEventListener('resize', function(){

  $('#dataloadedAlert').html('Window resized. \n For optimal visualization, please reload the page.');
  $('#dataAlertLoaded').show();
    setTimeout(function () {
      $('#dataAlertLoaded').hide();
    }, 10000);
    return null;
});
//================ Application Configuration ===============

// First loading the configurations
$.ajax({
  url: 'config/app_config.json',
  dataType: 'json',
  async: false,
  success: function (data) {
    app_config = data
  }
});

$("#lableGenes").text(app_config.label_sampleanAlysis_genesListName);
$("#cite_title").text(app_config.cite_title);
$("#cite_authors").text(app_config.cite_authors);
$("#cite_link").text(app_config.cite_link);
$("#cite_link").attr("href", app_config.cite_link);
$("#repolink1").text(app_config.data_repo_text);
$("#repolink1").attr("href", app_config.data_repo_link);
$("#repolink2").attr("href", app_config.data_repo_link);
$("#tutorial_link").attr("src", app_config.tutorial_link);

//setting the checkboxes
$('#tooltipChecked').prop("checked", app_config.tooltip_on);
$('#zoomChecked').prop("checked", app_config.enlarged_window_on);
$('#genecardChecked').prop("checked", app_config.genecards_link_on);
$('#clustSelLock').prop("checked", app_config.cluster_lock_on);
$('#mouseChecked').prop("checked", app_config.quick_mouseover_on);
$('#mouseChecked1').prop("checked", app_config.quick_mouseover_on);
$('#searchPin').prop("checked", app_config.pin_search_on);

// colorbar scale
$('#colScaleDomainMin').prop("value", app_config.colorscale_domain[0]);
$('#colScaleDomainMax').prop("value", app_config.colorscale_domain[1]);
$('#autoDomain').prop("checked", app_config.colorscale_autoDomain);
if(app_config.colorscale_autoDomain){
  $('#colScaleDomainMin').prop('disabled',true);
  $('#colScaleDomainMax').prop('disabled',true);
  $('#pctColRange').prop('disabled',true);
}

//===============  Application Configuration ends ==========

var getSpotExpressions = function (_sample_id, _barcode, _gene) {
  if (_sample_id in spotExpressions) {
    if (_barcode === null) return (spotExpressions[_sample_id])
    if (_barcode in spotExpressions[_sample_id]) {
      if (_gene === null) return (spotExpressions[_sample_id][_barcode])
      if (_gene in spotExpressions[_sample_id][_barcode]) {
        return (parseFloat(spotExpressions[_sample_id][_barcode][_gene]))
      } else if (_gene.indexOf(app_config.meta_key) == 0) {
        meta_col = _gene.substring(app_config.meta_key.length)
        var meta_res = dataAllPatients[_sample_id].map(function (r) { if (r['barcode'] === _barcode) return r[meta_col] });
        meta_res = meta_res.filter(Boolean)
        if (meta_res.length === 1){
          if(typeof meta_res[0] === "number") {
            return (parseFloat(meta_res[0]));
          }else{
            return(meta_res[0])
          }
        } else {
          return (0);
        }
      }
      else {
        return (0);
      }
    } else {
      return ({});
    }
  } else {
    return (0);
  }
}

var make_sparse_obj = function (obj) {
  for (let key in obj) {
    if (obj[key] === 0) {
      delete obj[key];
    }
  }
  return (obj)
}

// ====== sizing the elements based on window
var center_img_width = parseInt($("#centerViz").css("width"));
$("#clustInfo").css("height", center_img_width * 1);
$("#clustinfoScroll").css("height", center_img_width * 1);


/* Following function taken from https://stackoverflow.com/questions/24784302/wrapping-text-in-d3*/
function wrap(text, width) {
  text.each(function () {
    var text = d3.select(this),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      lineNumber = 0,
      lineHeight = 1.1, // ems
      x = text.attr("x"),
      y = text.attr("y"),
      dy = 0,
      tspan = text.text(null)
        .append("tspan")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan")
          .attr("x", x)
          .attr("y", y)
          .attr("dy", ++lineNumber * lineHeight + dy + "em")
          .text(word);
      }
    }
  });
}
//---------------------------------------------------------------------
var loadData = function (samples) {
  for (let j = 0; j < samples.length; j++) {

    let data_id = samples[j];
    dataloadingAlertOn();
    let item = document.createElement("div");

    item.classList.add("column");
    item.classList.add("tissue_image");
    item.classList.add("dataloading");
    item.classList.add("pointer-click");

    let img = document.createElement("img");
    img.classList.add("dataloadingbox");
    img.setAttribute("id", data_id);
    img.setAttribute("onclick", "imgClick(this)");
    img.setAttribute("onmouseover", "showSampleInfo('" + data_id + "', event)");
    img.setAttribute("onmouseleave", "hideSampleInfo()");
    img.setAttribute("draggable", true);
    img.setAttribute("ondragstart", "sampleDrag(event)");
    img.classList.add("icon_img");
    img.classList.add("img-fluid");

    img.src = "data/" + data_id + "/" + app_config.image_file_name_high_resolution;
    item.appendChild(img);

    let img_name = document.createElement("div");
    img_name.classList.add("bottom-left");
    img_name.innerHTML = data_id;
    item.appendChild(img_name);
    sampleImages.appendChild(item)


    Papa.parse("data/" + data_id + '/' + app_config.data_file_name_metadata, {
      skipEmptyLines: true,
      header: true,
      download: true,
      dynamicTyping: true,
      complete: function (results) {
        dataAllPatients[data_id] = results.data;
      }
    });

    $.getJSON("data/" + data_id + '/' + app_config.data_file_name_scalefactor, function (data) {
      scaleResolutions[data_id] = data["tissue_hires_scalef"]
    });

    Papa.parse("data/" + data_id + '/' + app_config.data_file_name_sample_info, {
      skipEmptyLines: true,
      header: true,
      download: true,
      dynamicTyping: true,
      complete: function (results) {
        results.data.forEach(function (item, index) {
          if (sampleInfo[data_id] === undefined) sampleInfo[data_id] = item;
        })
      },
      error: function (err) {
        if (sampleInfo[data_id] === undefined) sampleInfo[data_id] = null;
      }
    });

    const sparse_file = "data/" + data_id + "/" + app_config.data_file_name_expressions_sparse;

    $.ajax({
      url: sparse_file,
      type: 'HEAD',
      error: function () {
        //file not exists
        Papa.parse("data/" + data_id + '/' + app_config.data_file_name_expressions, {
          skipEmptyLines: true,
          header: true,
          download: true,
          dynamicTyping: true,
          complete: function (results, filename) {
            dataloadingAlertOn();
            let spotExpressions_sub = {}
            results.data.forEach(function (item, index) {
              spotExpressions_sub[item.barcode] = make_sparse_obj(item);
            })
            spotExpressions[data_id] = spotExpressions_sub;
            updateSampleGenes(data_id);//updating the search list genes

            sample_name = filename.split("/")
            sample_name = sample_name[sample_name.length - 2];
            dataloadedAlertOn(sample_name);

            //Click the first sample
            var first_sample = $('#sampleImages').children().eq(1);
            global_first_load = true;
            first_sample.first()[0].firstChild.click();
            global_first_load = false;
          }
        });
      },
      success: function () {
        //file exists
        const barcodes_file = "data/" + data_id + "/" + app_config.data_file_name_barcodes;
        const genes_file = "data/" + data_id + "/" + app_config.data_file_name_genes;
        const m_file = "data/" + data_id + "/" + app_config.data_file_name_expressions_sparse;

        let sample_barcodes = {};
        let sample_genes = {};
        let generated_file_from = null;
        let barcodes_key = "x";
        let genes_key = "x"
        Papa.parse(barcodes_file, {
          skipEmptyLines: true,
          header: true,
          download: true,
          dynamicTyping: true,
          beforeFirstChunk: function (bchunk) {
            bchunk = bchunk.split("\n");
            barcodes_key = bchunk[0].split(" ")[0]
          },
          //read barcodes
          complete: function (results) {
            results.data.forEach(function (item, index) {
              sample_barcodes[index] = item[barcodes_key]
            });
            // read gene names
            Papa.parse(genes_file, {
              skipEmptyLines: true,
              header: true,
              download: true,
              dynamicTyping: true,
              beforeFirstChunk: function (gchunk) {
                gchunk = gchunk.split("\n");
                genes_key = gchunk[0].split(" ")[0]
              },
              complete: function (results) {
                results.data.forEach(function (item, index) {
                  sample_genes[index] = item[genes_key]
                });

                //* read sparse matrix
                let spotExpressions_sub = {}
                Papa.parse(m_file, {
                  delimiter: ' ',
                  skipEmptyLines: true,
                  comments: '%',
                  header: false,
                  download: true,
                  fastMode: true,
                  dynamicTyping: false,
                  beforeFirstChunk: function (chunk) {
                    chunk = chunk.split("\n");
                    if (chunk[0].split(" ")[0] === "%%MatrixMarket") {
                      generated_file_from = 'R'
                    }
                    chunk = chunk.slice(2);
                    chunk = chunk.join("\n");
                    return (chunk)
                  },
                  before:function(filename, inputElem){
                    sample_name = filename.split("/")
                    sample_name = sample_name[sample_name.length - 2];
                    dataloadedAlertOn(sample_name);
                    
                  },
                  step: function(result, parser){
                    item = result.data;
                    var b_idx = item[1];
                    var g_idx = item[0];
                    if (generated_file_from === 'R') {
                      b_idx = b_idx - 1;
                      g_idx = g_idx - 1;
                    }

                    var b = sample_barcodes[b_idx]//barcode
                    var g = sample_genes[g_idx] //gene
                    if (b in spotExpressions_sub) {
                        spotExpressions_sub[b][g] = Number(item[2]);
                    } else {
                      spotExpressions_sub[b] = {}
                      spotExpressions_sub[b][g] = Number(item[2]);
                    }
                  },
                  complete:function(){
                    spotExpressions[data_id] = spotExpressions_sub;
                    updateSampleGenes(data_id);//updating the search list genes

                    //Click the first sample
                    var first_sample = $('#sampleImages').children().eq(1);
                    global_first_load = true;
                    first_sample.first()[0].firstChild.click();
                    global_first_load = false;
                    reloadDimplot();
                    dataloadedAlertOn(data_id);
                  }
                })
              }

            })
          }
        });
      }
    });

    Papa.parse("data/" + data_id + '/' + app_config.data_file_name_cluster_info, {
      skipEmptyLines: true,
      header: true,
      download: true,
      dynamicTyping: true,
      complete: function (results) {
        let clusterinfo_sub = {}
        results.data.forEach(function (item, index) {
          clusterinfo_sub[item.cluster] = item;
        })
        clusterInfo[data_id] = clusterinfo_sub;
      }
    });
  }
}

var getGridData = function (sampleId) {
  const sample_clusts = Object.values(clusterInfo[sampleId]);
  var marker_grid = [];
  var current_row = 1;
  var current_col = 1;
  for (let i = 0; i < sample_clusts.length; i++) {
    var current_cluster = sample_clusts[i].cluster;
    var clust_genes = sample_clusts[i].genes;
    if (clust_genes !== null) {
      clust_genes = clust_genes.split(",");
    } else {
      continue;
    }

    for (let j = 0; j < clust_genes.length; j++) {
      marker_grid.push({
        'cluster': current_cluster,
        'gene': clust_genes[j].trim(), 'row': current_row,
        'col': current_col, 'expr': 0
      })

      current_col = current_col + 1
      if (current_col > app_config.heatmap_num_columns) {
        current_col = 1;
        current_row = current_row + 1
      }
    }
    current_col = 1;
    current_row = current_row + 1
  }
  return (marker_grid)
}
//---------------------------------------------------------------------

var centerViz_w = parseInt($("#centerViz").css("width"));
centerViz_w = Math.round(centerViz_w * 0.9);
let opt_width = centerViz_w;
d3.select("#pointRaius").property("value", opt_width/200);

var margin = { top: 0, right: 0, bottom: 0, left: 0 },
  width = opt_width - margin.left - margin.right,
  height = opt_width - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)

// Add X axis
var xScale = d3.scaleLinear()
  .domain([0, 2000])
  .range([0, width]);

// Add Y axis
var yScale = d3.scaleLinear()
  .domain([0, 2000])
  .range([0, height]);

// Enable tooltip
$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

//create tooltip HTML
var tooltipHTML = function (d) {
  const gene_values = getSpotExpressions(sampleId, d.barcode, null);
  const gene_values_sorted = Object.entries(gene_values).sort(([, a], [, b]) => b - a);
  const topN = gene_values_sorted.slice(0, app_config.tooltip_top_n);

  var s_tooltip = "<b>Cluster: " + d.cluster + " - " + cluster_names[d.cluster];

  s_tooltip = s_tooltip + "</b><hr>"+d.barcode;
  s_tooltip = s_tooltip +  "<hr>Max. expressed genes at the spot<hr><table id='tooltipTable'><tr>";
  for (let c in topN) {
    s_tooltip = s_tooltip + "<th>" + topN[c][0] + "</th>"
  }
  s_tooltip = s_tooltip + "</tr><tr>"
  for (let c in topN) {
    s_tooltip = s_tooltip + "<th>" + topN[c][1] + "</th>"
  }
  s_tooltip = s_tooltip + "</tr><tr><td colspan=" + topN.length + "><hr></td></tr>"

  let g_serch = $("#searchSampleAnalysisTxt").val()
  if (g_serch !== "") {
    s_tooltip = s_tooltip + "<tr><td colspan=" + topN.length + ">" + g_serch + " : " + getSpotExpressions(sampleId, d.barcode, g_serch.trim()) + "</td></tr>"
  }
  if ($('#currentGeneSel').text() !== "" & $('#currentGeneSel').text() !== g_serch) {
    s_tooltip = `${s_tooltip}<tr><td colspan=${topN.length}>${$('#currentGeneSel').text().trim()} : ${getSpotExpressions(sampleId, d.barcode, $('#currentGeneSel').text().trim())}</td></tr>`
    s_tooltip = s_tooltip + "<tr><td colspan=" + topN.length + "><hr></td></tr>"
  }
  s_tooltip = s_tooltip + "<tr><td colspan=" + topN.length + "><i class='icofont-duotone icofont-location-alt'></i><i>&nbsp Click on the spot to freeze selection.</i></td></tr>" + "</table>";

  return (s_tooltip);
}

//tooltip
var Tooltip = d3.select("body")
  .append("div")
  .style("opacity", 0)
  .attr("class", "tooltip")
  .style("background-color", "white")
  .style("border", "solid")
  .style("border-width", "2px")
  .style("border-radius", "5px")
  .style("padding", "5px")
  .style("position", "absolute")
  .style("z-index", "10");

// Three function that change the tooltip when user hover / move / leave a cell
var mouseover = function (d) {

  if ($("#tooltipChecked").is(':checked')) {
    Tooltip
      .style("opacity", 1)
      .style("left", (d3.event.pageX - app_config.tooltip_position_left) + "px")
      .style("top", (d3.event.pageY - app_config.tooltip_position_top) + "px")
      .style("border-width", (app_config.tooltip_border_stroke_width) + "px")
      .style("border-color", cluster_cols[d.cluster])

    if (!$('#frozen').is(':checked')) {
      d3.select(this)
        .style("stroke", "black");
      updateHeatmap(d.barcode);
    }
  }
}

var mousemove = function (d) {
  Tooltip
    .html(function () { return tooltipHTML(d) })
    .style("z-index", 10)
    .style("left", (d3.event.pageX - app_config.tooltip_position_left) + "px")
    .style("top", (d3.event.pageY - app_config.tooltip_position_top) + "px");
}
var mouseleave = function (d) {

  Tooltip
    .style("opacity", 0)
    .style("left", 0)
    .style("top", 0)
    .style("z-index", -10)

  if (!$('#frozen').is(':checked')) {
    d3.select(this)
      .style('stroke', function (d) {
        if (highlightedClusters.includes('clust' + d.cluster)) { return '#000000'; }
        else { return "none" }
      })

    clearHeatmap()
  }
}

var mouseclick = function (d) {
  global_current_barcode = d.barcode;
  $("#frozen").prop("checked", true);
  $(".btn-warning").show();
}

var unfreezed = function () {
  global_current_barcode = "";
  svg.selectAll("circle")
    .style('stroke', function (d) {
      if (highlightedClusters.includes('clust' + d.cluster)) { return '#000000'; }
      else { return "none" }
    })

  if (!$('#frozen').is(':checked')) {
    $(".btn-warning").hide();
  }
  clearHeatmap();
}

//Update the slide
function updateSlide(data, url, scaleRes) {
  //removing dots
  svg.selectAll("circle")
    .remove();

  //change background
  d3.select("#svg").style("background", "url(" + url + ") no-repeat")
    .style("background-size", "100% 100%");

  var tmp_img = new Image();
  tmp_img.src = url;

  // Add dots
  svg.selectAll("circle")
    .data(data.filter(function (d) { return d.in_tissue == '1' }))
    .enter()
    .append("circle")
    .attr("cx", function (d) { return (2000 / tmp_img.naturalWidth) * xScale(d.pxl_col_in_fullres) * scaleRes; })
    .attr("cy", function (d) { return (2000 / tmp_img.naturalHeight) * yScale(d.pxl_row_in_fullres) * scaleRes; })
    .attr("r", d3.select("#pointRaius").property("value"))
    .style("fill", function (d) {
      if (selectedClusters.includes("clust" + d.cluster)) { return cluster_cols[d.cluster] }
      else { return "rgba(0, 0, 0, 0)" }
    })
    .style("stroke", function (d) {
      if (highlightedClusters.includes("clust" + d.cluster)) { return "#000000" }
      else { return "none" }
    })
    .style("opacity", d3.select("#pointOpacity").property("value"))
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
    .on("click", mouseclick);
}

d3.select("#pointRaius").on("input", function () {

  svg.selectAll('circle')
    .transition()
    .duration(100)
    .ease(d3.easeLinear)
    .attr("r", d3.select("#pointRaius").property("value"));
});

d3.select("#pointOpacity").on("input", function () {

  svg.selectAll('circle')
    .transition()
    .duration(100)
    .ease(d3.easeLinear)
    .style("opacity", d3.select("#pointOpacity").property("value"));
});

d3.select("#imgOpacity").on("input", function () {

  d3.select('#imgOpacityRect')
    .transition()
    .duration(100)
    .ease(d3.easeLinear)
    .style("opacity", 1 - d3.select("#imgOpacity").property("value"));
});

function SVGBackground(url) {
  document.getElementById("svg").style.backgroundImage = "url(" + url + ")";
  d3.select('#imgOpacityRect')
    .transition()
    .duration(100)
    .ease(d3.easeLinear)
    .style("opacity", 1 - d3.select("#imgOpacity").property("value"));
}

updateImageBorder = function (sampleId) {
  d3.selectAll("img").classed("border-dark", false);
  d3.select("#" + sampleId).classed("border-dark", true);
}

updateSampleInfo = function (sampleId) {
  const sampleInfoData = sampleInfo[sampleId];
  if (typeof sampleInfoData !== "undefined" & sampleInfoData !== null) {
    var info_header = ""
    var info_data = ""

    for (var i = 0; i < Object.keys(sampleInfoData).length; i++) {

      k = Object.keys(sampleInfoData)[i]
      info_header = info_header + '<th>' + k + '</th>';
      info_data = info_data + '<td>' + sampleInfoData[k] + '</td>';
    }
    var sampleInfodiv = document.getElementById('sampleInfo');
    sampleInfodiv.innerHTML = '<table class="table table-bordered"><thead><tr>' +
      info_header + '</tr></thead><tr>' + info_data + '</tr></table>';
  }
}

updateSampleGenes = function (sampleId) {

  for (const s of Object.values(getSpotExpressions(sampleId, null, null))) {
    var spot_genes = Object.keys(s)
    sampleGenes = [...new Set([...sampleGenes, ...spot_genes])]
  }
  sampleGenes.sort();
  var metaCols = Object.keys(dataAllPatients[sampleId][0])
  metaCols = metaCols.map(metaCol => app_config.meta_key + metaCol);
  var genes_with_meta = [...new Set([...sampleGenes, ...metaCols])]
  $("#searchSampleAnalysisTxt").autocomplete({
    delay: 100,
    minLength: 2,
    source: genes_with_meta
  });

  $("#searchDimVizTxt").autocomplete({
    delay: 100,
    minLength: 2,
    source: genes_with_meta
  });

  $("#searchGroupAnalysisTxt").autocomplete({
    delay: 100,
    minLength: 2,
    source: sampleGenes
  });
}

updateClusterInfo = function (sampleId) {
  //updating the color map
  cluster_cols = {};
  for (let c in clusterInfo[sampleId]) {
    cluster_cols[c] = clusterInfo[sampleId][c].color;
  }

  //updating cluster buttons
  var allBtnDiv = document.getElementById('clusterButtons');
  allBtnDiv.innerHTML = '';

  var txtSpan = document.createElement('span')
  txtSpan.innerHTML = "Clusters";
  txtSpan.classList.add("txt");
  allBtnDiv.appendChild(txtSpan);

  var selectedClusters_previous = selectedClusters;

  selectedClusters = [];
  cluster_names = {};
  for (let c in clusterInfo[sampleId]) {
    if (typeof c !== "undefined" & c !== null) {
      var btn = document.createElement('button')
      btn.innerHTML = c;
      btn.classList.add("btn");
      btn.setAttribute("style", "color: #fff; background-color: " + clusterInfo[sampleId][c].color + "; border-color: " + clusterInfo[sampleId][c].color);
      btn.setAttribute("id", "clust" + c);
      btn.setAttribute("data-toggle", "tooltip");
      btn.setAttribute("data-placement", "bottom");
      btn.setAttribute("title", clusterInfo[sampleId][c].name);
      allBtnDiv.appendChild(btn);

      selectedClusters.push("clust" + c);
      cluster_names[c] = clusterInfo[sampleId][c].name;//updating the cluster name on hover

      btn.addEventListener('mouseover', function (e) {
        highlightClustSpots(e.target.innerHTML);
      });
      btn.addEventListener('mouseout', function (e) {
        clearHighlightClustSpots();
      });
    }
  }

  //Adding reload icon for cluster  selection
  var relaodClustIcon = document.createElement('i')
  relaodClustIcon.classList.add("icofont-duotone");
  relaodClustIcon.classList.add("icofont-rebuild");
  relaodClustIcon.classList.add("icofont-2x");
  relaodClustIcon.classList.add("pointer-click");
  relaodClustIcon.setAttribute("style", "margin-left: 1px; margin-right: 1px; margin-top: 1px; margin-bottom: 1px; vertical-align: middle;");
  relaodClustIcon.setAttribute("data-toggle", "tooltip");
  relaodClustIcon.setAttribute("data-placement", "bottom");
  relaodClustIcon.setAttribute("title", "Reset");
  relaodClustIcon.addEventListener("click", function (e) {
    selectedClusters_previous = [];
    while (highlightedClusters.length > 0) {
      const c = highlightedClusters[0];
      $('#' + c).click();
      $('#' + c).click();
    }

    for (let c in clusterInfo[sampleId]) {
      if (typeof c !== "undefined" & c !== null) {
        if (!selectedClusters.includes("clust" + c)) {
          $('#clust' + c).click();
        }
      }
    }

    $({ rotation: 360 * !i }).animate({ rotation: 360 }, {
      duration: 500,
      step: function (now) {
        $(relaodClustIcon).css({ 'transform': 'rotate(' + now + 'deg)' });
      }
    });

  })
  allBtnDiv.appendChild(relaodClustIcon);

  let clustInfoDiv = document.getElementById("clustInfo");
  clustInfoDiv.innerHTML = "";
  //updating right side cluster markers info
  for (let c in clusterInfo[sampleId]) {
    if (typeof c !== "undefined" & c !== null) {
      let cardDiv = document.createElement('div')
      cardDiv.setAttribute("id", "card" + c);
      cardDiv.classList.add("card");

      let cardBodyDiv = document.createElement('div')
      cardBodyDiv.classList.add("card-body");

      let cardH5 = document.createElement('h5')
      cardH5.classList.add("card-title");
      cardH5.setAttribute("data-toggle", "tooltip");
      cardH5.setAttribute("data-placement", "right");
      cardH5.setAttribute("title", "Click on the gene names to see its expression.");
      cardH5.setAttribute("style", "color:" + clusterInfo[sampleId][c].color);
      cardH5.innerHTML = "Cluster" + c + " : " + clusterInfo[sampleId][c].name;

      let cardP = document.createElement('p')
      cardP.classList.add("card-text");
      let c_genes = clusterInfo[sampleId][c].genes;
      c_genes_list = []
      if (c_genes !== null) { c_genes_list = c_genes.split(','); }

      for (var i = 0; i < c_genes_list.length; i++) {
        var c_gene = c_genes_list[i];
        var g_text = document.createElement('span');
        g_text.classList.add("gene-text");
        g_text.classList.add("pointer-click");
        g_text.setAttribute("id", "right_" + c_gene.trim());
        g_text.addEventListener('mouseover', function (e) {
          e.target.style.color = "red";
          e.target.style.fontWeight = 500;

          $("#left_" + e.target.innerHTML.trim()).css("stroke", "black");
          $("#left_" + e.target.innerHTML.trim()).css("opacity", 1);

          if ($('#mouseChecked1').is(':checked')) {
            showExpressions(sampleId, e.target.innerHTML);
          }
        });

        g_text.addEventListener('mouseout', function (e) {
          e.target.style.color = "black";
          e.target.style.fontWeight = "normal";
          if ($('#mouseChecked1').is(':checked')) {
            removeExpressions();
          }

          $("#left_" + e.target.innerHTML.trim()).css("stroke", "#B0C4DE");
          $("#left_" + e.target.innerHTML.trim()).css("opacity", 0.8);
        });

        g_text.addEventListener('click', function (e) {
          showExpressions(sampleId, e.target.innerHTML);
        });

        g_text.addEventListener('dblclick', function (e) {
          genecardPopup(e.target.innerHTML);
        });

        g_text.innerHTML = c_gene;
        cardP.appendChild(g_text);
      }
      cardBodyDiv.appendChild(cardH5);
      cardBodyDiv.appendChild(cardP);
      cardDiv.appendChild(cardBodyDiv);
      clustInfoDiv.appendChild(cardDiv);
    }
  }

  //on button click show to hid spots
  d3.selectAll('button').on("click", function () {
    var btnClusterId = this.id;
    if (btnClusterId === "undefined" | btnClusterId === null | btnClusterId.length < 5 | btnClusterId.substring(0, 5) !== 'clust') {
      return null;
    }
    if (selectedClusters.includes(btnClusterId)) {
      // if highlighted then deactive
      if (highlightedClusters.includes(btnClusterId)) {
        selectedClusters.splice(selectedClusters.indexOf(btnClusterId), 1);
        highlightedClusters.splice(highlightedClusters.indexOf(btnClusterId), 1);
        d3.select(this).classed(btnClusterId + "-active", false)
        d3.select(this).style("border-color", clusterInfo[sampleId][parseInt(btnClusterId.substring(5))].color);
        d3.select(this).classed("clust-deactive", true)
      } else { //just make highlight
        highlightedClusters.push(btnClusterId);
        d3.select(this).style("border-color", "#0a0a0a");
      }
    } else {
      selectedClusters.push(btnClusterId);
      d3.select(this).classed("clust-deactive", false)
      d3.select(this).classed(btnClusterId + "-active", true)
    }

    svg.selectAll('circle')
      .transition()
      .duration(10)
      .ease(d3.easeLinear)
      .style("fill", function (d) {
        if (selectedClusters.includes("clust" + d.cluster)) { return cluster_cols[d.cluster] }
        else { return "rgba(0, 0, 0, 0)" }
      })
      .style("stroke", function (d) {
        if (highlightedClusters.includes("clust" + d.cluster)) { return "#000000" }
        else { return "none" }
      });

    for (let c in clusterInfo[sampleId]) {
      var x = document.getElementById('card' + c);
      if (selectedClusters.includes("clust" + c)) {
        x.style.display = "block";
      } else {
        x.style.display = "none";
      }
    }
    $("#eraserGeneSel").hide();
  })

  if ($('#clustSelLock').is(':checked') & !global_first_load) {
    const selectedClusters_copy = selectedClusters.map((x) => x);
    for (const c of selectedClusters_copy) {
      if (!selectedClusters_previous.includes(c)) {
        $('#' + c).click();
        $('#' + c).click();
      } else {
        if (highlightedClusters.includes(c)) {
          highlightedClusters.splice(highlightedClusters.indexOf(c), 1);
          $('#' + c).click();
        }
      }
    }
  } else {
    highlightedClusters = [];
  }

  // rerun the function to enable the tooltip
  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  })
}

var getGeneExprsAll = function(gene){
  expr = null;

  if(gene in _cache_expr){
    return(_cache_expr[gene]);
  }
  if (gene.indexOf(app_config.meta_key) == 0) {
    meta_col = gene.substring(app_config.meta_key.length);
    expr = Object.values(dataAllPatients).map(element => element.map(el => el[meta_col])).flat()
  }else{
    expr = Object.values(spotExpressions).map((element) => Object.values(element).filter((elm) => gene.trim() in elm).map((elm) => elm[gene.trim()])).flat();
  }

  //cleaning cache
  if(Object.keys(_cache_expr).length >= 100){
    _cache_expr = {};
  }
  _cache_expr[gene] = expr;
  return(expr);
}
var showExpressions = function (sampleId, gene) {

  if ($('#frozen').is(':checked')) return(null);
  //checking color scale
  //if auto-domain in checked
  $("#searchSampleAnalysisTxt").val(gene);
  if ($('#autoDomain').is(':checked')) {
    var expres = getGeneExprsAll(gene);
    expres = expres.filter(x => typeof x === "number");
    var min_expr = Math.min(0, Math.min(...expres));
    var max_expr = Math.max(...expres);
    if (min_expr !== Infinity & min_expr !== NaN & min_expr !== undefined & 
      max_expr !== -Infinity & max_expr !== NaN & max_expr !== undefined){
      changeColorScale(min_expr, max_expr, null);
    }
  }else{//if percentile is checked
    if ($('#pctColRange').is(':checked')) {
      var expres = getGeneExprsAll(gene);
      var d_min = $('#colScaleDomainMin').val();
      var d_max = $('#colScaleDomainMax').val();
      if(d_min < 0){
        d_min = 0;
      }
      if(d_min >= 1){
        d_min = Math.min(d_min/100, 0.99);
      }
      if(d_max < 0){
        d_max = 1;
      }
      if(d_max > 1){
        d_max = d_max/100;
        if(d_max > 0.99){
          d_max = 0.99;
        }
      }
      var min_expr = 0;
      var max_expr = 0;
      if(d_min == 0){
        min_expr = 0;
      }else{
        min_expr = ss.quantile(expres, d_min);
      }
      if(max_expr == 1){
        max_expr = Math.max(...expres);
      }else{
        max_expr = ss.quantile(expres, d_max);
      }
      changeColorScale(min_expr, max_expr, null);
    }
  }

  svg.selectAll('circle')
    .transition()
    .duration(10)
    .ease(d3.easeLinear)
    .style("fill", function (d) {
      if (selectedClusters.includes("clust" + d.cluster)) {
        const g_expr = getSpotExpressions(sampleId, d.barcode, gene.trim());
        if(typeof g_expr === "number"){
          return colorScale(g_expr);
        }else{
          return colorScaleDiscrete(g_expr);
        }
      }
      else { return "rgba(0, 0, 0, 0)" }
    }
    );
  $("#currentGeneSel").text(gene);
  $("#eraserGeneSel").show();
}

removeExpressions = function () {
  $("#searchSampleAnalysisTxt").val("");
  svg.selectAll('circle')
    .transition()
    .duration(10)
    .ease(d3.easeLinear)
    .style("fill", function (d) {
      if (selectedClusters.includes("clust" + d.cluster)) { return cluster_cols[d.cluster] }
      else { return "rgba(0, 0, 0, 0)" }
    });
  $("#currentGeneSel").text("");
  $("#eraserGeneSel").hide();
}

var sampleId;
var imgClick = function (img) {
  var url = img.src;
  sampleId = img.id;
  global_current_img_url = url;
  updateImageBorder(sampleId);

  updateClusterInfo(sampleId);
  updateSlide(dataAllPatients[sampleId], url, scaleResolutions[sampleId]);

  //adding zoom
  zoomImage(url);

  updateSampleInfo(sampleId);
  loadHeatmap(getGridData(sampleId));

  if ($('#searchPin').is(':checked')) {
    $("#searchSampleAnalysisBtn").click();
  }

  if($('#dim-analysis').css("display") === 'block'){
    toggleDimPlot(true);
  } 
}


zoomImage = function (url) {

  var zoom_area_size = 0;
  var zoom_radius = zoom_area_size / 2;

  $('#svg').mousemove(function (e) {

    // Show original picture    
    var $original = $('#tissue_original');
    $original.attr('src', url);

    var $container = $original.parent();
    $container.removeClass('hidden');

    var available_width = parseInt($("#cards").css("width"));
    $container.css("width", Math.min($('#svg').height() * 2 / 3, available_width));
    $container.css("height", $container.width());

    var zoom_container_width = $container.width();
    var zoom_container_height = $container.height();
    

    // Thumbnail
    var offset = $(this).offset();
    var tX = e.pageX - offset.left;
    var tY = e.pageY - offset.top;
    // We stay inside the limits of the zoomable area
    tX = Math.max(zoom_radius, Math.min($(this).width() - zoom_radius, tX));
    tY = Math.max(zoom_radius, Math.min($(this).height() - zoom_radius, tY));
    // Ratios
    var ratioX = ($original.width() - zoom_container_width) / ($(this).width() - zoom_area_size);
    var ratioY = ($original.height() - zoom_container_height) / ($(this).height() - zoom_area_size);
    // Margin to be set in the original    
    var moX = -Math.floor((tX - zoom_radius) * ratioX);
    var moY = -Math.floor((tY - zoom_radius) * ratioY);
    // Apply zoom efect
    $original.css('marginLeft', moX);
    $original.css('marginTop', moY);

    var $vline = $('#verticalLine');
    var $hline = $('#horizontalLine');


    var vlinePos = (e.pageX - offset.left) / (($(this).width() / zoom_container_width));
    $vline.css('marginLeft', vlinePos);
    var hlinePos = (e.pageY - offset.top) / (($(this).height() / zoom_container_height));
    hlinePos = hlinePos - zoom_container_height / 2;
    $hline.css('marginLeft', 0);
    $hline.css('transform', "translate(" + 0 + "px," + hlinePos + "px) rotate(90deg)");
  });

  $('#svg').mouseout(function (e) {
    var $original = $('#tissue_original');
    var $container = $original.parent();
    $container.addClass('hidden');
  });

  //removing zoom if zoom is unchecked
  if (!$('#zoomChecked').is(':checked')) {
    $('#svg').mousemove(function (e) {
      ``
      var $original = $('#tissue_original');
      var $container = $original.parent();
      $container.addClass('hidden');
    })
  }
}

$('#zoomChecked').click(function (e) {
  if ($(this).is(':checked')) {
    $('#svg').mousemove(function (e) {
      var $original = $('#tissue_original');
      var $container = $original.parent();
      $container.removeClass('hidden');
    })
  } else {
    $('#svg').mousemove(function (e) {
      var $original = $('#tissue_original');
      var $container = $original.parent();
      $container.addClass('hidden');
    })
  }
});

$("#showHideClustInfo").click(function () {
  $("#clustInfo").slideToggle("slow");
  $("#plus").toggle();
  $("#minus").toggle()
});


var left_heatmap_width = parseInt($("#spotExprViz").css("width"));
left_heatmap_width = 0.8 * left_heatmap_width
var marginHeatmap = { top: 5, right: 0, bottom: 0, left: 25 },
  widthHeatmap = left_heatmap_width - marginHeatmap.left - marginHeatmap.right,
  heightHeatmap = left_heatmap_width * 1.5 - marginHeatmap.top - marginHeatmap.bottom;

// append the svg object to the body of the page
var svgHeatmap = d3.select("#spotExprViz")
  .append("div")
  .classed("svg-container", true) //container class to make it responsive
  .append("svg")
  .style("overflow", "visible")
  .append("g")
  .attr("transform",
    "translate(" + marginHeatmap.left + "," + marginHeatmap.top + ")");

// Build color scale
var colorScale = d3.scaleSequential()
  .interpolator(eval("d3." + app_config.colorscale_heatmap_individual_analysis))
  .domain(app_config.colorscale_domain);

var colorScaleDiscrete = d3.scaleOrdinal(d3.schemeCategory10);
  // ----- showing color legend ------
  // The legend code used from https://stackoverflow.com/a/64807612/2374707
  
  var legend = function ({
    color,
    title,
    legendContainer,
    tickSize = 6,
    width = left_heatmap_width,
    height = 30 + tickSize,
    marginTop = 10,
    marginRight = 5,
    marginBottom = 10 + tickSize,
    marginLeft = 5,
    ticks = width / 64,
    tickFormat,
    tickValues
  } = {}) {
    const svg = d3.select('#' + legendContainer)
      .append('svg')
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("overflow", "visible")
      .style("display", "block");

    let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
    let x;

    // Continuous
    if (color.interpolate) {
      const n = Math.min(color.domain().length, color.range().length);

      x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));

      svg.append("image")
        .attr("x", marginLeft)
        .attr("y", marginTop)
        .attr("width", width - marginLeft - marginRight)
        .attr("height", height - marginTop - marginBottom)
        .attr("preserveAspectRatio", "none")
        .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
    }

    // Sequential
    else if (color.interpolator) {
      x = Object.assign(color.copy()
        .interpolator(d3.interpolateRound(marginLeft, width - marginRight)), {
        range() {
          return [marginLeft, width - marginRight];
        }
      });

      svg.append("image")
        .attr("x", marginLeft)
        .attr("y", marginTop)
        .attr("width", width - marginLeft - marginRight)
        .attr("height", height - marginTop - marginBottom)
        .attr("preserveAspectRatio", "none")
        .attr("xlink:href", ramp(color.interpolator()).toDataURL());

      // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
      if (!x.ticks) {
        if (tickValues === undefined) {
          const n = Math.round(ticks + 1);
          tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
        }
        if (typeof tickFormat !== "function") {
          tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
        }
      }
    }

    // Threshold
    else if (color.invertExtent) {
      const thresholds = color.thresholds ? color.thresholds() // scaleQuantize
        :
        color.quantiles ? color.quantiles() // scaleQuantile
          :
          color.domain(); // scaleThreshold

      const thresholdFormat = tickFormat === undefined ? d => d :
        typeof tickFormat === "string" ? d3.format(tickFormat) :
          tickFormat;

      x = d3.scaleLinear()
        .domain([-1, color.range().length - 1])
        .rangeRound([marginLeft, width - marginRight]);

      svg.append("g")
        .selectAll("rect")
        .data(color.range())
        .join("rect")
        .attr("x", (d, i) => x(i - 1))
        .attr("y", marginTop)
        .attr("width", (d, i) => x(i) - x(i - 1))
        .attr("height", height - marginTop - marginBottom)
        .attr("fill", d => d);

      tickValues = d3.range(thresholds.length);
      tickFormat = i => thresholdFormat(thresholds[i], i);
    }

    // Ordinal
    else {
      x = d3.scaleBand()
        .domain(color.domain())
        .rangeRound([marginLeft, width - marginRight]);

      svg.append("g")
        .selectAll("rect")
        .data(color.domain())
        .join("rect")
        .attr("x", x)
        .attr("y", marginTop)
        .attr("width", Math.max(0, x.bandwidth() - 1))
        .attr("height", height - marginTop - marginBottom)
        .attr("fill", color);

      tickAdjust = () => { };
    }

    svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x)
        .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
        .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
        .tickSize(tickSize)
        .tickValues(tickValues))
      .call(tickAdjust)
      .call(g => g.select(".domain").remove())
      .call(g => g.append("text")
        .attr("x", marginLeft)
        .attr("y", marginTop + marginBottom - height - 6)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(title));

    return svg.node();
  }

  function ramp(color, n = 256) {
    var canvas = document.createElement('canvas');
    canvas.width = n;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    for (let i = 0; i < n; ++i) {
      context.fillStyle = color(i / (n - 1));
      context.fillRect(i, 0, 1, 1);
    }
    return canvas;
  }

  legend({
    color: colorScale,
    title: "Expression",
    legendContainer: "colorLegend"
  });
  //---------------

var loadHeatmap = function (griddata) {
  markerGridData = griddata;
  var rows = d3.map(markerGridData, function (d) { return d.row; }).values();
  var cols = d3.map(markerGridData, function (d) { return d.col; }).keys();

  var clust_rows = d3.map(markerGridData, function (d) { return d.cluster; }).values();
  // Build X scales and axis:
  var xScaleHeatmap = d3.scaleBand()
    .range([0, widthHeatmap])
    .domain(cols)
    .padding(0.05);

  //Build Y scales and axis:
  var yScaleHeatmap = d3.scaleBand()
    .range([0, heightHeatmap])
    .domain(Array.from(rows, d => d.row))
    .padding(0.05);

  var yConti = d3.scaleLinear()
    .range([0, heightHeatmap])
    .domain([0, d3.max(clust_rows, d => d.row)]);

  //removing all subelements
  svgHeatmap.selectAll("*").remove();
  // $('#colorLegend').empty();

  //remove tooltip if already there
  d3.select("#leftVizTooltip").remove();
  // create a tooltip
  var tooltipHeatmap = d3.select("#leftViz")
    .append("div")
    .attr("id", "leftVizTooltip")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

  // Three function that change the tooltip when user hover / move / leave a cell
  var mouseoverHeatmap = function (d) {
    tooltipHeatmap
      .style("opacity", 1)
    d3.select(this)
      .style("stroke", "black")
      .style("opacity", 1)

    showExpressions(sampleId, d.gene);
  }
  var mouseEnterHeatmap = function (d) {
    tooltipHeatmap
      .html(function() {//checks if any spot is frozen or not then shows the expr
        if (!$('#frozen').is(':checked')) {
          return d.gene;
        } else {
          return d.gene + " : " + getSpotExpressions(sampleId, global_current_barcode, d.gene);
        }
      })
    .style("left", (d3.event.pageX - 20) + "px")
    .style("top", (d3.event.pageY - 50) + "px");

    $("#right_" + d.gene.trim()).css("color", "red");
    $("#right_" + d.gene.trim()).css("fontWeight", 500);

    showExpressions(sampleId, d.gene);
  }

  var mouseleaveHeatmap = function (d) {
    tooltipHeatmap
      .style("opacity", 0)
    d3.select(this)
      .style("stroke", "#B0C4DE")
      .style("opacity", 0.8);

    $("#right_" + d.gene.trim()).css("color", "black");
    $("#right_" + d.gene.trim()).css("fontWeight", "normal");
    removeExpressions();
    return(null);
  }

  // add the squares
  svgHeatmap.selectAll(null)
    .data(markerGridData)
    .enter()
    .append("rect")
    .attr("x", function (d) { return xScaleHeatmap(d.col) })
    .attr("y", function (d) { return yScaleHeatmap(d.row) })
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("width", xScaleHeatmap.bandwidth())
    .attr("height", yScaleHeatmap.bandwidth())
    .attr("id", function (d) { return "left_" + d.gene.trim() })
    .style("fill", function (d) { return colorScale(d.expr) })
    .style("stroke-width", 1)
    .style("stroke", "#B0C4DE")
    .style("opacity", 0.8)
    .attr("class", "pointer-click")
    .on("mouseover", mouseoverHeatmap)
    .on("mouseenter", mouseEnterHeatmap)
    .on("mouseleave", mouseleaveHeatmap)
    .on("click", function (d) { genecardPopup(d.gene); });

  //adding colored line corresponding to the clusters to the left of the heatmap
  svgHeatmap.selectAll(null)
    .data(clust_rows)
    .enter()
    .append("line")
    .style("stroke", function (d) { return cluster_cols[d.cluster]; })
    .style("stroke-width", 10)
    .attr("x1", -10)
    .attr("y1", function (d, i) { if (i === 0) { return yConti(0); } else { return yConti(clust_rows[i - 1].row) - 1.5; } })
    .attr("x2", -10)
    .attr("y2", function (d, i) { return yConti(d.row) - 1.5; })
    .on("mouseover", function (d) { highlightClustSpots(d.cluster); })
    .on("mouseleave", clearHighlightClustSpots);



  //Build Y scales and axis:
  var y_clustNo = d3.scaleLinear()
    .range([0, heightHeatmap])
    .domain([0, d3.max(clust_rows, d => d.row)]);
  //Adding cluster number to the left of the heatmap
  svgHeatmap.selectAll(null)
    .data(clust_rows)
    .enter()
    .append("text")
    .append("tspan")
    .attr("x", function (d) { return -25; })
    .attr("y", function (d, i) {
      if (i == 0) {
        return y_clustNo(d.row) / 2;
      } else {
        prev = y_clustNo(clust_rows[i - 1].row);
        return prev + (y_clustNo(d.row) - prev) / 2
      }
    }
    )
    .attr("text-anchor", "left")
    .style("font-size", "10px")
    .style("fill", "grey")
    .style("max-width", 10)
    .text(function (d, i) { return d.cluster; });
}


// Change the colorscale color and reload heatmap
var changeColorScale = function (domainMin, domainMax, clrScale) {

  if (domainMin !== "" & domainMin !== "undefined" & domainMin !== null) {
    app_config.colorscale_domain[0] = precision(Number(domainMin));
  }

  if (domainMax !== "" & domainMax !== "undefined" & domainMax !== null) {
    app_config.colorscale_domain[1] = precision(Number(domainMax));
  }

  if (clrScale !== "" & clrScale !== "undefined" & clrScale !== null) {
    app_config.colorscale_heatmap_individual_analysis = clrScale;
  }

  colorScale = d3.scaleSequential()
    .interpolator(eval("d3." + app_config.colorscale_heatmap_individual_analysis))
    .domain(app_config.colorscale_domain);

  // closeColorSidePanel();
  $('#colorLegend').empty();
  legend({
    color: colorScale,
    title: "Expression",
    legendContainer: "colorLegend"
  });
  if(clrScale !== null)loadHeatmap(getGridData(sampleId))
}

//Changing domain select to auto or manual
var changeDomainAuto = function(){
  if($('#autoDomain').prop('checked')){
    $('#colScaleDomainMin').prop('disabled',true);
    $('#colScaleDomainMax').prop('disabled',true);
    $('#pctColRange').prop('disabled',true);
  }else{
    $('#colScaleDomainMin').prop('disabled',false);
    $('#colScaleDomainMax').prop('disabled',false);
    $('#pctColRange').prop('disabled',false);

    changeColorScale($('#colScaleDomainMin').val(), $('#colScaleDomainMax').val(), null);
    
  }
}

var changePctColRange = function(){
  if(!$('#autoDomain').prop('checked')){
    changeColorScale($('#colScaleDomainMin').val(), $('#colScaleDomainMax').val(), null);
  }
}

var updateHeatmap = function (barcode) {
  let selSpotExpr = getSpotExpressions(sampleId, barcode, null);
  svgHeatmap.selectAll('rect')
    .transition()
    .duration(3)
    .ease(d3.easeLinear)
    .style('stroke', '#B0C4DE')
    .style('stroke-width', 1)
    .style("fill", function (d) { if (d.gene in selSpotExpr) { return (colorScale(selSpotExpr[d.gene])) } else { return colorScale(0) } });

}

var clearHeatmap = function () {
  svgHeatmap.selectAll('rect')
    .transition()
    .duration(3)
    .ease(d3.easeLinear)
    .style("fill", function (d) { return colorScale(0) });

}

// heatcolor options through side pane
function openColorSidePanel() {
  document.getElementById("colorSidepanel").style.width = "350px";
  $('.sidepanel').css('box-shadow', '0 24px 38px 3px rgb(0 0 0 / 14%), 0 9px 46px 8px rgb(0 0 0 / 12%), 0 11px 15px -7px rgb(0 0 0 / 20%)');

}
/* Set the width of the sidebar to 0 (hide it) */
function closeColorSidePanel() {
  document.getElementById("colorSidepanel").style.width = "0";
  $('.sidepanel').css('box-shadow', 'none');
}

highlightClustSpots = function (clusterId) {
  svg.selectAll('circle')
    .transition()
    .duration(10)
    .ease(d3.easeLinear)
    .style('stroke', function (d) {
      if (d.cluster.toString() === clusterId.toString() | highlightedClusters.includes('clust' + d.cluster)) { return '#000000'; }
      else { return "none" }
    })
    .style('stroke-width', function (d) {
      if (d.cluster === clusterId | highlightedClusters.includes('clust' + d.cluster)) { return 4; }
      else { return 0; }
    })
}

clearHighlightClustSpots = function () {
  svg.selectAll('circle')
    .transition()
    .duration(10)
    .ease(d3.easeLinear)
    .style('stroke', function (d) {
      if (highlightedClusters.includes('clust' + d.cluster)) { return '#000000'; }
      else { return "none" }
    })
    .style('stroke-width', function (d) {
      if (highlightedClusters.includes('clust' + d.cluster)) { return 4; }
      else { return 0; }
    })
}

var genecardPopup = function (gene) {
  if ($('#genecardChecked').is(':checked')) {
    popupWindow = window.open(app_config.genecard_url + gene.trim() + "#summaries", 'popUpWindow',
      'height=700,width=800,left=50,top=100,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes');
  }
}

function allowSampleDrop(ev) {
  ev.preventDefault();
}

var sampleDrag = function (ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function sampleDrop(ev) {
  ev.preventDefault();
  var data = ev.dataTransfer.getData("text");
  if (typeof data !== "undefined" & data !== null & document.getElementById(data) !== null) {
    var nodeCopy = document.getElementById(data).cloneNode(true);
    nodeCopy.id = "sampleComapre_" + nodeCopy.id;
    nodeCopy.classList.remove("border");
    nodeCopy.classList.add("imageSquare");
    nodeCopy.removeAttribute('onclick');
    nodeCopy.setAttribute("ondragleave", "removeSample(event)");
    ev.target.appendChild(nodeCopy);

    //update the visualization
    updateBox(global_current_gene);
    updateGrpHeat(global_current_gene);
  }
}

function removeSample(ev) {
  ev.preventDefault();
  var el = document.getElementById(ev.target.id);
  el.parentNode.removeChild(el);

  //update the visualization
  updateBox(global_current_gene);
  updateGrpHeat(global_current_gene);
}

var imgContrainerTab = function () {
  $('#img-container').css("display", "block");
  $('#dim-analysis').css("display", "none");
  $('#group-analysis').css("display", "none");
  $('#data-info').css("display", "none");
}

var dimAnalysisTab = function () {
  $('#img-container').css("display", "none");
  $('#dim-analysis').css("display", "block");
  $('#group-analysis').css("display", "none");
  $('#data-info').css("display", "none");
}

var groupAnalysisTab = function () {
  $('#img-container').css("display", "none");
  $('#dim-analysis').css("display", "none");
  $('#group-analysis').css("display", "block");
  $('#data-info').css("display", "none");
}

var dataTab = function () {
  $('#img-container').css("display", "none");
  $('#dim-analysis').css("display", "none");
  $('#group-analysis').css("display", "none");
  $('#data-info').css("display", "block");
}

var boxContrainerTab = function () {
  $('#grp-box-container').css("display", "block");
  $('#grp-heat-container').css("display", "none");
}

var heatContainerTab = function () {
  $('#grp-box-container').css("display", "none");
  $('#grp-heat-container').css("display", "block");
}
var genesContainerTab = function (e) {
  const genesTabContnets = $(".genenes-tab-content");
  if (genesTabContnets != null) {
    for (let i = 0; i < genesTabContnets.length; i++) {
      let contentid = genesTabContnets[i].id;
      $('#' + contentid).css("display", "none");
    }
  }
  const targetContainer = e.children[0].id + "Content"
  $('#' + targetContainer).css("display", "block");
}

var updateGroupsNums = function (n) {
  let divArea = document.getElementById("compGroupArea")
  divArea.innerHTML = '';
  removeBox();
  removeGrpHeat();
  $('#grpCompareStats').css("visibility", "hidden");

  for (let i = 1; i <= n; i++) {
    let compGroupDiv = document.createElement("div");
    compGroupDiv.innerHTML = "Group " + i;
    compGroupDiv.setAttribute("id", "compGroup_" + i);
    compGroupDiv.classList.add("col-5");
    compGroupDiv.classList.add("d-flex");

    let compGroupSel = document.createElement("div");
    compGroupSel.classList.add("compGroupArea");
    compGroupSel.setAttribute("id", "compGroupSel" + i);
    compGroupSel.setAttribute("ondragover", "allowSampleDrop(event)");
    compGroupSel.setAttribute("ondrop", "sampleDrop(event)");

    compGroupSel.setAttribute("contentEditable", true);
    compGroupSel.setAttribute("data-text", "For analysis, drag samples here.\nTo remove sample, drag the sample out of the box.");

    compGroupDiv.appendChild(compGroupSel);
    divArea.appendChild(compGroupDiv);
  }
  //remove the last gene selection
  global_current_gene = "";
}

var cleanGroups = function () {
  updateGroupsNums(d3.select("#numGroups").property("value"));
}

var updateGroupGenesTabs = function (tabGenesContainer, tabGenesData) {//genes in the group tab
  const ul = document.getElementById("DEGenesTab");
  const li = document.createElement("li");
  li.classList.add("nav-item");
  li.setAttribute("role", "presentation");
  li.setAttribute("onclick", "genesContainerTab(this)");

  const a = document.createElement("a");
  a.classList.add("nav-link");
  a.setAttribute("id", tabGenesContainer);
  a.setAttribute("href", "#" + tabGenesContainer);
  a.setAttribute("data-bs-toggle", "tab");
  a.setAttribute("role", "tab");
  a.setAttribute("aria-controls", tabGenesContainer + "Content");
  a.setAttribute("aria-selected", "false");
  a.appendChild(document.createTextNode(tabGenesContainer));
  li.appendChild(a);
  ul.appendChild(li);

  const tabContentDiv = document.getElementById("tabContent2");
  const genesContainerPDiv = document.createElement("div");
  genesContainerPDiv.classList.add("tab-pane");
  genesContainerPDiv.classList.add("fade");
  genesContainerPDiv.classList.add("show");
  genesContainerPDiv.classList.add("justify-content-center");
  genesContainerPDiv.classList.add("genenes-tab-content");
  genesContainerPDiv.setAttribute("role", "tabpanel");
  genesContainerPDiv.setAttribute("aria-labelledby", tabGenesContainer);
  genesContainerPDiv.setAttribute("id", tabGenesContainer + "Content");
  const genesContainerDiv = document.createElement("div");
  genesContainerDiv.classList.add("clustinfoScroll");

  if (Object.keys(tabGenesData).length === 0) {
    return null;
  }
  genesContainerDiv.innerHTML = "";
  for (let c in tabGenesData) {
    if (typeof c !== "undefined" & c !== null) {
      let cardDiv = document.createElement('div')
      cardDiv.setAttribute("id", "cardGroup" + c);
      cardDiv.classList.add("card");

      let cardBodyDiv = document.createElement('div');
      cardBodyDiv.classList.add("card-body");

      let cardH5 = document.createElement('h5');
      cardH5.classList.add("card-title");
      cardH5.setAttribute("data-toggle", "tooltip");
      cardH5.setAttribute("data-placement", "right");
      cardH5.setAttribute("title", "Click on the gene names to see its expression.");

      cardH5.setAttribute("style", "color:" + tabGenesData[c].color);
      cardH5.innerHTML = "Cluster" + c + " : " + tabGenesData[c].name;

      let cardP = document.createElement('p')
      cardP.classList.add("card-text");
      let c_genes = tabGenesData[c].genes;
      if (c_genes !== null & c_genes !== undefined) {
        c_genes_list = c_genes.split(',');
      } else {
        continue;
      }
      for (var i = 0; i < c_genes_list.length; i++) {
        c_gene = c_genes_list[i];
        var g_text = document.createElement('span');
        g_text.classList.add("gene-text");
        g_text.classList.add("pointer-click");
        g_text.addEventListener('mouseover', function (e) {
          e.target.style.color = "red";
          e.target.style.fontWeight = 500;
          if ($('#mouseChecked').is(':checked')) {
            updateBox(e.target.innerHTML);
            updateGrpHeat(e.target.innerHTML);
          }
        });
        g_text.addEventListener('mouseout', function (e) {
          e.target.style.color = "black";
          e.target.style.fontWeight = "normal";
          e.target.style.fontWeight = "normal";
          if ($('#mouseChecked').is(':checked')) {
          }
        });
        g_text.addEventListener('click', function (e) {
          updateBox(e.target.innerHTML);
          updateGrpHeat(e.target.innerHTML);
        });

        g_text.addEventListener('dblclick', function (e) {
          genecardPopup(e.target.innerHTML);
        });

        g_text.innerHTML = c_gene;
        cardP.appendChild(g_text);
      }

      cardBodyDiv.appendChild(cardH5);
      cardBodyDiv.appendChild(cardP);
      cardDiv.appendChild(cardBodyDiv);
      genesContainerDiv.appendChild(cardDiv);
    }
  }

  genesContainerPDiv.appendChild(genesContainerDiv);
  tabContentDiv.appendChild(genesContainerPDiv);

  var fist_li_a = $("#DEGenesTab li a").first()[0];

  fist_li_a.setAttribute("aria-selected", "true");

  var fist_genesContainerPDiv = $("#tabContent2 div").first()[0];
  fist_genesContainerPDiv.classList.add("show");

  tbs = document.getElementById('DEGenesTab')
  if (tbs.children.length > 0) {
    tbs.children[0].children[0].click();

    // Show the marker genes
    if ($("#minus").css('display') === 'none') {
      $("#showHideClustInfo").click();
    }
  }
}

// Adding a tab to the existing tabs and showing the data in table format
var addGroupGenesTabsAsTable = function (tabGenesContainer, tabGenesData, activate = false) {

  // -------
  const ul = document.getElementById("DEGenesTab")
  const li = document.createElement("li");
  li.classList.add("nav-item");
  li.setAttribute("role", "presentation");
  li.setAttribute("onclick", "genesContainerTab(this)");

  const a = document.createElement("a");
  a.classList.add("nav-link");
  a.setAttribute("id", tabGenesContainer);
  a.setAttribute("href", "#" + tabGenesContainer);
  a.setAttribute("data-bs-toggle", "tab");
  a.setAttribute("role", "tab");
  a.setAttribute("aria-controls", tabGenesContainer + "Content");
  a.setAttribute("aria-selected", "false");
  a.appendChild(document.createTextNode(tabGenesContainer));
  li.appendChild(a);
  ul.appendChild(li);

  const tabContentDiv = document.getElementById("tabContent2");
  const genesContainerPDiv = document.createElement("div");
  genesContainerPDiv.classList.add("tab-pane");
  genesContainerPDiv.classList.add("fade");
  genesContainerPDiv.classList.add("show");
  genesContainerPDiv.classList.add("justify-content-center");
  genesContainerPDiv.classList.add("genenes-tab-content");
  genesContainerPDiv.setAttribute("role", "tabpanel");
  genesContainerPDiv.setAttribute("aria-labelledby", tabGenesContainer);
  genesContainerPDiv.setAttribute("id", tabGenesContainer + "Content");


  const genesContainerDiv = document.createElement("div");

  genesContainerDiv.classList.add("clustinfoScroll");



  // -------

  if (tabGenesData === null | tabGenesData.length === 0) {
    return null;
  }
  genesContainerDiv.innerHTML = "";
  //updating right side cluster markers info

  let tableDiv = document.createElement('div');//table container
  let tbl = document.createElement('table');

  const currentTab = $('#DEGenesTab').children().length;
  let tblId = 'tblID_' + currentTab;
  tbl.setAttribute("id", tblId);
  tbl.classList.add("tabTable");
  tbl.classList.add("tablesorter");

  let thead = document.createElement('thead');

  let header_cols = Object.keys(tabGenesData[0]);
  let tbl_header = document.createElement('tr');

  for (let j = 0; j < header_cols.length; j++) {
    var headerCell = document.createElement("TH");
    headerCell.innerHTML = header_cols[j];
    tbl_header.appendChild(headerCell);
  }

  thead.appendChild(tbl_header);
  tbl.appendChild(thead);

  let tbody = document.createElement('tbody');

  for (let i = 0; i < tabGenesData.length; i++) {
    let row = document.createElement("tr");
    for (let j = 0; j < header_cols.length; j++) {
      let c = row.insertCell();
      let col_name = header_cols[j];
      if (col_name in tabGenesData[i]) {
        let col_content = tabGenesData[i][col_name];
        if (col_content === null) {
          continue;
        }
        let c_genes_list = col_content.toString().split(",");
        for (var m = 0; m < c_genes_list.length; m++) {
          c_gene = c_genes_list[m];

          var g_text = document.createElement('span');
          g_text.classList.add("gene-text");
          g_text.addEventListener('mouseover', function (e) {
            if (sampleGenes.includes(e.target.innerHTML.trim())) {
              e.target.style.color = "red";
              e.target.style.fontWeight = 500;
              if ($('#mouseChecked').is(':checked')) {
                updateBox(e.target.innerHTML);
                updateGrpHeat(e.target.innerHTML);
              }
            }
          });
          g_text.addEventListener('mouseout', function (e) {
            if (sampleGenes.includes(e.target.innerHTML.trim())) {
              e.target.style.color = "black";
              e.target.style.fontWeight = "normal";
              if ($('#mouseChecked').is(':checked')) {
              }
            }
          });
          g_text.addEventListener('click', function (e) {
            if (sampleGenes.includes(e.target.innerHTML.trim())) {
              updateBox(e.target.innerHTML);
              updateGrpHeat(e.target.innerHTML);
            }
          });

          g_text.addEventListener('dblclick', function (e) {
            if (sampleGenes.includes(e.target.innerHTML.trim())) {
              genecardPopup(e.target.innerHTML);
            }
          });
          g_text.innerHTML = c_gene;
          c.appendChild(g_text);
        }
      }

    }
    tbody.appendChild(row);
    tbl.appendChild(tbody);
  }
  tableDiv.appendChild(tbl);
  genesContainerDiv.appendChild(tableDiv);

  genesContainerPDiv.appendChild(genesContainerDiv);
  tabContentDiv.appendChild(genesContainerPDiv);

  var fist_li_a = $("#DEGenesTab li a").first()[0];

  fist_li_a.setAttribute("aria-selected", "true");

  var fist_genesContainerPDiv = $("#tabContent2 div").first()[0];
  fist_genesContainerPDiv.classList.add("show");

  if (activate) {
    tbs = document.getElementById('DEGenesTab')
    if (tbs.children.length > 0) {
      let l = tbs.children.length;
      tbs.children[l - 1].children[0].click();
    }
  } else {
    tbs = document.getElementById('DEGenesTab')
    if (tbs.children.length > 0) {
      tbs.children[0].children[0].click();
    }
  }

  $(function () {
    $("#" + tblId).tablesorter();
  });

}
// Plotly box plot

var prepareDataBox = function (gene) {
  let num_groups = d3.select("#numGroups").property("value");

  box_data = []
  for (let i = 1; i <= num_groups; i++) {
    const parent = document.getElementById("compGroupSel" + i);

    const children = Array.from(parent.children);

    var ids = children.map(element => {
      return element.id;
    });

    //removing sampleComapre_ from each ids and making unique array
    ids = ids.map(d => { return d.substring(14) });
    ids = [...new Set(ids)];

    var x_data = [];
    var y_data = [];
    for (const samp_id of ids) {
      x_data.push(...dataAllPatients[samp_id].map(function (r) { return r[app_config.data_cluster_column] }));
      spot_barcodes = dataAllPatients[samp_id].map(function (r) { return r['barcode'] });
      y_data.push(...spot_barcodes.map(function (d) { return getSpotExpressions(samp_id, d, gene.trim()) }));
    }
    box_data.push({
      type: 'box',
      x: x_data,
      y: y_data,
      legendgroup: 'Group ' + i,
      scalegroup: 'Group ' + i,
      name: 'Group ' + i,
      meanline: {
        visible: true
      },
      boxpoints: 'Outliers'
    });
  }

  return box_data;
}

var updateBox = function (gene) {
  global_current_gene = gene;

  if (gene === "") return;

  var layout = {
    title: "Expr. Distribution: " + gene,
    yaxis: {
      title: 'Normalized Expr.',
      zeroline: false
    },
    xaxis: {
      title: 'Clusters',
      autotick: false
    },
    boxmode: 'group'
  }
  var plotly_config = {
    displaylogo: false,
    responsive: true
  }
  Plotly.newPlot('groupDatavizBox', prepareDataBox(gene), layout, plotly_config);
}

var removeBox = function () {
  let groupDatavizDiv = document.getElementById('groupDatavizBox');
  groupDatavizDiv.innerHTML = "";
  global_current_gene = "";
}

var getClusterMeanExpr = function (samp_id, clust_id, gene) {
  const spotBarcodes = dataAllPatients[samp_id].map(function (r) { if (r[app_config.data_cluster_column] === clust_id) { return r['barcode'] } }).filter(x => x !== undefined);
  const exprAll = spotBarcodes.map(function (d) { return getSpotExpressions(samp_id, d, gene.trim()) });

  const meanExpr = exprAll.reduce((a, b) => Math.round((parseFloat(a) + parseFloat(b) + Number.EPSILON) * 1000) / 1000) / exprAll.length;

  return (meanExpr)
}

var getGroupSamples = function(){
  let num_groups = d3.select("#numGroups").property("value");
  var x_data = [];
  var grp_elms_count = [];
  var cnt = 0;

  for (let i = 1; i <= num_groups; i++) {
    const parent = document.getElementById("compGroupSel" + i);

    const children = Array.from(parent.children);
    cnt = cnt + children.length;
    grp_elms_count.push(cnt);
    var ids = children.map(element => {
      return element.id;
    });
    //removing sampleComapre_ from each ids and making unique array
    ids = ids.map(d => { return d.substring(14) });
    ids = [...new Set(ids)];
    x_data.push(ids);
  }
  return(x_data);
}

var prepareDataGrpHeat = function (gene) {
  let num_groups = d3.select("#numGroups").property("value");
  var grpHeatData = [];
  var x_data = [];
  var grp_elms_count = [];
  var cnt = 0;
  for (let i = 1; i <= num_groups; i++) {
    const parent = document.getElementById("compGroupSel" + i);

    const children = Array.from(parent.children);
    cnt = cnt + children.length;
    grp_elms_count.push(cnt);
    var ids = children.map(element => {
      return element.id;
    });

    //removing sampleComapre_ from each ids and making unique array
    ids = ids.map(d => { return d.substring(14) });
    ids = [...new Set(ids)];

    x_data = x_data.concat(ids);
  }
  var sampleClustMeanExpr = {}
  var y_data = [];
  var z_data = [];
  for (const samp_id of x_data) {
    sampleClustMeanExpr[samp_id] = {};
    const clusterNumAll = dataAllPatients[samp_id].map(function (r) { return r[app_config.data_cluster_column] });
    const sample_clusters = [...new Set(clusterNumAll)];

    y_data = y_data.concat(sample_clusters);//adding all unique cluster for number of row

    for (const c of sample_clusters) {
      sampleClustMeanExpr[samp_id][c.toString()] = getClusterMeanExpr(samp_id, c, gene);
    }
  }

  y_data = [...new Set(y_data)] //making unique cluster numbers
  y_data = y_data.map(d => d.toString());
  y_data.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  y_data.reverse();
  for (const c of y_data) {
    var sampClutExpr = [];
    for (const samp_id of x_data) {
      if ((samp_id in sampleClustMeanExpr) & (c in sampleClustMeanExpr[samp_id])) {
        sampClutExpr.push(sampleClustMeanExpr[samp_id][c]);
      } else {
        sampClutExpr.push(null);
      }
    }
    z_data.push(sampClutExpr);
  }

  var text = z_data.map((row, i) => row.map((item, j) => {
    let avg_val = null;
    if (item !== null) {
      avg_val = item.toFixed(4);
    }
    return `
        Sample: ${x_data[j]}<br>
        Cluster: ${cluster_names[y_data[i]]}<br>
        Norm. Avg. Expr: ${avg_val}`
  }))

  grpHeatData.push({
    z: z_data,
    x: [...Array(x_data.length).keys()],
    y: y_data,
    text: text,
    type: 'heatmap',
    colorscale: app_config.colorscale_heatmap_group_analysis,
    hoverinfo: 'text',
    hoverongaps: false
  })

  var annotations = []
  for (var i = 0; i < grp_elms_count.length - 1; i++) {
    var lns = {
      type: 'line',
      x0: grp_elms_count[i] - 0.5,
      y0: 0 - 0.5,
      x1: grp_elms_count[i] - 0.5,
      y1: y_data.length - 0.5,
      opacity: 1,
      line: {
        color: 'black',
        width: 2.5
      }
    };
    annotations.push(lns);
  }

  var layout = {
    title: "Expr. Distribution: " + gene,
    yaxis: {
      title: 'Clusters',
      ticks: '',
      autosize: true,
      showticklabels: true,
      type: 'category',
    },
    xaxis: {
      title: '',
      ticks: '',
      side: 'top',
      type: 'category',
      showticklabels: true,
      tickmode: 'array',
      ticktext: x_data,
      tickvals: [...Array(x_data.length).keys()]
    },
    shapes: annotations
  }

  var plotly_config = {
    displaylogo: true,
    responsive: true
  }

  return { 'data': grpHeatData, 'layout': layout, 'config': plotly_config};
}

var groupDatavizHeatPlot = document.getElementById('groupDatavizHeat');

// Prepares data for t-test and other comparision tests assuing all spots independent
// Not used, instead prepareStatsDataPsudoBulk is used.
var prepareStatsData = function (gene, d) {
  const k = Object.keys(cluster_names).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))[Object.keys(cluster_names).length - d - 1]
  const clust_name = cluster_names[k];
  let num_groups = d3.select("#numGroups").property("value");

  var x_data = [];
  for (let i = 1; i <= num_groups; i++) {
    const parent = document.getElementById("compGroupSel" + i);

    const children = Array.from(parent.children);
    var ids = children.map(element => {
      return element.id;
    });

    //removing sampleComapre_ from each ids and making unique array
    ids = ids.map(d => { return d.substring(14) });
    ids = [...new Set(ids)];

    let x_data_grp = [];
    for (let j = 0; j < ids.length; j++) {
      let grp_samp_id = ids[j];
      let clust_barcodes = [];
      clust_barcodes.push(...dataAllPatients[grp_samp_id].map(function (r) {
        if (r[app_config.data_cluster_column] === k | r[app_config.data_cluster_column].toString() === k) {
          return r.barcode;
        } else {
          return null;
        }
      }));
      clust_barcodes = clust_barcodes.filter(function (el) { return el != null; });

      x_data_grp = x_data_grp.concat(clust_barcodes.map(function (r) {
        return getSpotExpressions(grp_samp_id.trim(), r.trim(), gene.trim());
      }));
    }
    x_data.push(x_data_grp);
  }
  return x_data;
}

// Prepares data for t-test and other comparision tests using psudo bulk expression
// bulk expression for each sample is calculated taking mean expression from the spots in the sample
var prepareStatsDataPsudoBulk = function (gene, d) {

  const k = Object.keys(cluster_names).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))[Object.keys(cluster_names).length - d - 1]
  let num_groups = d3.select("#numGroups").property("value");

  //For single group one vs rest comparision
  if (num_groups == 1) {
    return prepareStatsDataSingleGroup(gene, d);
  }

  var x_data = [];
  for (let i = 1; i <= num_groups; i++) {
    const parent = document.getElementById("compGroupSel" + i);

    const children = Array.from(parent.children);
    var ids = children.map(element => {
      return element.id;
    });

    //removing sampleComapre_ from each ids and making unique array
    ids = ids.map(d => { return d.substring(14) });
    ids = [...new Set(ids)];

    let x_data_grp = [];
    for (let j = 0; j < ids.length; j++) {
      let grp_samp_id = ids[j];
      let clust_barcodes = [];
      clust_barcodes.push(...dataAllPatients[grp_samp_id].map(function (r) {
        if (r[app_config.data_cluster_column] === k | r[app_config.data_cluster_column].toString() === k) {
          return r.barcode;
        } else {
          return null;
        }
      }));
      clust_barcodes = clust_barcodes.filter(function (el) { return el != null; });

      let all_spots_expr = clust_barcodes.map(function (r) {
        return getSpotExpressions(grp_samp_id.trim(), r.trim(), gene.trim());
      })
      if (all_spots_expr.length != 0) {
        x_data_grp = x_data_grp.concat(ss.mean(all_spots_expr));
      } else {
        x_data_grp = x_data_grp.concat(0);
      }
    }
    x_data.push(x_data_grp);
  }
  return x_data;
}

var prepareStatsDataSingleGroup = function (gene, d) {
  const k = Object.keys(cluster_names).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))[Object.keys(cluster_names).length - d - 1]

  var x_data = [];
  const parent = document.getElementById("compGroupSel1");
  const children = Array.from(parent.children);
  var ids = children.map(element => {
    return element.id;
  });

  //removing sampleComapre_ from each ids and making unique array
  ids = ids.map(d => { return d.substring(14) });
  ids = [...new Set(ids)];

  var sel_grp = [];
  var rest_grp = [];
  for (let j = 0; j < ids.length; j++) {
    let grp_samp_id = ids[j];

    var grouped_res;
    grouped_res = dataAllPatients[grp_samp_id].reduce(function (res, r) {
      if (!res[r[app_config.data_cluster_column]]) {
        res[r[app_config.data_cluster_column]] = [r.barcode];
      } else {
        res[r[app_config.data_cluster_column]].push(r.barcode);
      }
      return res;
    }, {});

    for (let cl in grouped_res) {
      let all_spots_expr = grouped_res[cl].map(function (r) {
        return getSpotExpressions(grp_samp_id.trim(), r.trim(), gene.trim());
      })
      if (cl === k | cl.toString() === k) {
        sel_grp.push(ss.mean(all_spots_expr));
      } else {
        rest_grp.push(ss.mean(all_spots_expr));
      }
    }
  }
  x_data.push(sel_grp);
  x_data.push(rest_grp);

  return (x_data)
}

var computeWelchT = function (x, y) {

  const n1 = x.length;
  const n2 = y.length;
  const xBar = ss.mean(x);
  const yBar = ss.mean(y);

  const xSD = ss.sampleStandardDeviation(x);
  const ySD = ss.sampleStandardDeviation(y);

  const tVal = (xBar - yBar) / Math.sqrt(((xSD ** 2) / n1) + ((ySD ** 2) / n2))
  return (tVal)
}

var computeTdf = function (x, y) {
  const n1 = x.length;
  const n2 = y.length;
  const xBar = ss.mean(x);
  const yBar = ss.mean(y);

  const xSD = ss.sampleStandardDeviation(x);
  const ySD = ss.sampleStandardDeviation(y);

  const xSD2 = (xSD ** 2) / n1;
  const ySD2 = (ySD ** 2) / n2;

  const df = ((xSD2 + ySD2) ** 2) / (((xSD2 ** 2) / (n1 - 1)) + ((ySD2 ** 2) / (n2 - 1)));

  return (df)
}

// Updating the t-test table
var updateCompStatInfo = function (compData, gene, clusterName) {
  const ngrp = d3.select("#numGroups").property("value");
  var testType = ""
  var pVal = 1.0;
  var significance = '';
  var table = document.getElementById("testResTbl");

  var tval = 0;
  var df = 0;

  table.rows[0].cells[1].innerHTML = gene + '(' + clusterName + ')';
  // creat the table
  while (table.rows.length > 2) {
    table.deleteRow(2);
  }


  if (ngrp == 1) {
    table.rows[0].cells[0].innerHTML = 'Welch Two Sample t-test';
    testType = 'Cluster ' + clusterName + ' vs. Rest';
    pVal = '--';
    adj_pVal = '--'
    var meanx = 'NA';
    if (compData[0].length > 0) {
      meanx = precision(ss.mean(compData[0]));
    }

    var meany = 'NA';
    if (compData[1].length > 0) {
      meany = precision(ss.mean(compData[1]));
    }

    tval = '--';
    adj_pVal = '--';
    // Minimum 3 samples needed for one sample t-test
    if (compData[0].length >= 3) {

      tval = computeWelchT(compData[0], compData[1]);
      df = computeTdf(compData[0], compData[1]);

      pVal = precision(pt(Math.abs(tval), df, 0, false, false) * 2);
      tval = precision(tval) //rounding for print
      df = precision(df);
      adj_pVal = Math.min(pVal * sampleGenes.length, 1.00);
    }

    var row = table.insertRow(2);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);

    cell1.innerHTML = testType;

    cell2.innerHTML = 'Mean X = ' + meanx + ', Mean Y = ' + meany;
    cell2.innerHTML = cell2.innerHTML + "<br> Log<sub>2</sub><sup>(Mean X)</sup>&frasl;<sub>(Mean Y)</sub> = " + precision(Math.log2(meanx / meany));
    cell3.innerHTML = 't = ' + tval + ', df = ' + df + '<br> p-value = ' + pVal;
    cell4.innerHTML = adj_pVal;

  } else if (ngrp > 1 & compData.length >= 2) {
    table.rows[0].cells[0].innerHTML = 'Welch Two Sample t-test';
    const current_group_samples = getGroupSamples();
    for (let i = 0; i < ngrp - 1; i++) {
      for (let j = i + 1; j < ngrp; j++) {
        testType = 'Group ' + (i + 1) + ' ['+ current_group_samples[i].join() +'] <br>vs.<br> Group ' + (j + 1)+' ['+current_group_samples[j].join()+']';

        //Need at least 2 samples for testing and at least one of the group has 3 or more samples.
        if ((compData[i].length >= 3 & compData[j].length >= 2) | (compData[i].length >= 2 & compData[j].length >= 3)) {
          tval = computeWelchT(compData[i], compData[j]);
          df = computeTdf(compData[i], compData[j]);

          pVal = precision(pt(Math.abs(tval), df, 0, false, false) * 2);
          tval = precision(tval); //rounding for print
          df = precision(df); //rounding for print
          adj_pVal = Math.min(pVal * sampleGenes.length, 1.00);

        } else {
          pVal = '--';
          adj_pVal = '--';
          tval = 'NA';
          df = 'NA';
        }

        var row = table.insertRow(table.rows.length);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);

        var meanx = 'NA';
        if (compData[i].length > 0) {
          meanx = precision(ss.mean(compData[i]));
        }

        var meany = 'NA';
        if (compData[j].length > 0) {
          meany = precision(ss.mean(compData[j]));
        }

        cell1.innerHTML = testType;
        cell2.innerHTML = 'Mean X = ' + meanx + ', Mean Y = ' + meany;
        cell2.innerHTML = cell2.innerHTML + "<br> Log<sub>2</sub><sup>(Mean X)</sup>&frasl;<sub>(Mean Y)</sub> = " + precision(Math.log2(meanx / meany));
        cell3.innerHTML = 't = ' + tval + ', df = ' + df + '<br> p-value = ' + pVal;
        cell4.innerHTML = adj_pVal;
      }
    }
  }
}

function openNav() {
  document.getElementById("DESidepanel").style.width = "350px";
  $('.sidepanel').css('box-shadow', '0 24px 38px 3px rgb(0 0 0 / 14%), 0 9px 46px 8px rgb(0 0 0 / 12%), 0 11px 15px -7px rgb(0 0 0 / 20%)');

}

/* Set the width of the sidebar to 0 (hide it) */
function closeNav() {
  document.getElementById("DESidepanel").style.width = "0";
  $('.sidepanel').css('box-shadow', 'none');
}

async function t_test(gene, d) {
  // getting the cut-off values for DE test.
  let minMeanExpCutoff = $('#minMeanExp').val();
  let minLogFCCutoff = $('#minLogFC').val();
  if (minMeanExpCutoff === null | minMeanExpCutoff === undefined | isNaN(minMeanExpCutoff)) {
    minMeanExpCutoff = 1.0;
  }

  if (minLogFCCutoff === null | minLogFCCutoff === undefined | isNaN(minLogFCCutoff)) {
    minLogFCCutoff = 1.0;
  }

  var compData = prepareStatsDataPsudoBulk(gene.trim(), d);
  const ngrp = d3.select("#numGroups").property("value");
  const k = Object.keys(cluster_names).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))[Object.keys(cluster_names).length - d - 1]
  const clust_name = cluster_names[k]

  var meanx = 'NA';
  var meany = 'NA';
  var log2fc = 'NA';
  if (ngrp == 1 &
    ((compData[0].length >= 3 & compData[1].length >= 2) | (compData[0].length >= 2 & compData[1].length >= 3)) &
    (ss.max(compData[0]) >= minMeanExpCutoff | ss.max(compData[1]) >= minMeanExpCutoff)) {

    meanx = precision(ss.mean(compData[0]));
    meany = precision(ss.mean(compData[1]));
    log2fc = precision(Math.log2(meanx / meany));

    if (Math.abs(log2fc) < minLogFCCutoff) {
      return null;
    }

    tval = computeWelchT(compData[0], compData[1]);
    df = computeTdf(compData[0], compData[1]);
    pVal = pt(Math.abs(tval), df, 0, false, false) * 2;
    adj_pVal = Math.min(pVal * sampleGenes.length, 1.00);

    pVal = precision(pVal);
    tval = precision(tval) //rounding for print
    df = precision(df);

    testType = clust_name + ' vs. Rest ';
    return [{
      'gene': gene,
      'cluster': clust_name,
      'Compared Groups': testType,
      'Mean X': meanx,
      'Mean Y': meany,
      'Log2FC': log2fc,
      'p_value': pVal.toString(),
      'adj_p_value': adj_pVal.toString()
    }];

  } else if (ngrp > 1 & compData.length >= 2) {
    var test_results = [];
    const current_group_samples = getGroupSamples();
    for (let i = 0; i < ngrp - 1; i++) {
      for (let j = i + 1; j < ngrp; j++) {
        if ((compData[i].length >= 3 & compData[j].length >= 2) | (compData[i].length >= 2 & compData[j].length >= 3)) {

          meanx = 'NA'
          if (compData[i].length > 0) {
            meanx = precision(ss.mean(compData[i]));
          }

          meany = 'NA'
          if (compData[j].length > 0) {
            meany = precision(ss.mean(compData[j]));
          }

          if (Math.max(meanx, meany) < minMeanExpCutoff) {
            continue;
          }

          log2fc = precision(Math.log2(meanx / meany));

          if (Math.abs(log2fc) < minLogFCCutoff) {
            continue;
          }

          tval = computeWelchT(compData[i], compData[j]);
          df = computeTdf(compData[i], compData[j]);

          pVal = pt(Math.abs(tval), df, 0, false, false) * 2;
          adj_pVal = Math.min(pVal * sampleGenes.length, 1.00);

          tval = precision(tval); //rounding for print
          pVal = precision(pVal);
          df = precision(df);

          testType = 'Group ' + (i + 1) + ' ['+ current_group_samples[i].join() +'] vs. Group ' + (j + 1)+' ['+current_group_samples[j].join()+']';
          test_results.push({
            'Gene': gene,
            'Cluster': clust_name,
            'Compared Groups': testType,
            'Mean X': meanx, 'Mean Y': meany,
            'Log2FC': precision(Math.log2(meanx / meany)),
            'p-value': pVal.toString(),
            'Adj. p-value': adj_pVal.toString()
          });
        }
      }
    }
    return test_results;
  }
  return null;
}

async function t_test_allgenes() {
  var test_process = 0;
  var test_process_show = 0;
  var de_result_array = [];
  const clust_ks = Object.keys(cluster_names).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
  for (let k = 0; k < clust_ks.length; k++) {
    for (let g_i = 0; g_i < sampleGenes.length; g_i++) {
      test_res = await t_test(sampleGenes[g_i], k);

      test_process = test_process + 1
      test_process_show = ( test_process *100)/(clust_ks.length * sampleGenes.length);
      $("#tTestProgress").css("width",test_process_show+"%");
      $("#tTestProgress").text(test_process_show+"%");

      if (test_res !== null) {
        de_result_array = [...de_result_array, ...test_res];
      }

      
    

    }
  }
  // $("#tTestProgressBG").hide();

  // download csv using papa papa parser
  //https://codepen.io/anon/pen/Oovegj
  var csv = Papa.unparse(de_result_array);
  var csvData = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var csvURL = null;
  if (navigator.msSaveBlob) {
    csvURL = navigator.msSaveBlob(csvData, 'DE_results.csv');
  }
  else {
    csvURL = window.URL.createObjectURL(csvData);
  }

  var tempLink = document.createElement('a');
  tempLink.href = csvURL;
  tempLink.setAttribute('download', 'DE_results.csv');
  tempLink.click();

}

var runDETest = function () {

  let num_groups = d3.select("#numGroups").property("value");

  let samplesInGroups = [];
  for (let i = 1; i <= num_groups; i++) {
    const parent = document.getElementById("compGroupSel" + i);

    const children = Array.from(parent.children);
    var ids = children.map(element => {
      return element.id;
    });
    ids = ids.map(d => { return d.substring(14) });
    ids = [...new Set(ids)];
    samplesInGroups.push(ids.length);
  }

  if (samplesInGroups.length === 0 | ss.max(samplesInGroups) < 3) {
    $('#dataloadedAlert').html('Minimum 3 samples required in a group.');
    $('#dataAlertLoaded').show();
    setTimeout(function () {
      $('#dataAlertLoaded').hide();
    }, 2000);
    return null;
  }
  closeNav();
  $('#dataloadedAlert').html('Running t-Test. The results will be downloaded.');
  $('#dataAlertLoaded').show();
  setTimeout(function () {
    $('#dataAlertLoaded').hide();
  }, 2000);

  $("#tTestProgressBG").show();
  $("#tTestProgress").css("width","0%");
  $("#tTestProgress").text("0%");

  t_test_allgenes().then(
    function () {
      $("#tTestProgressBG").hide();
      console.log("File downloaded....");
    }
  )
}

var updateGrpHeat = function (gene) {
  global_current_gene = gene;

  if (gene === "") return;

  const prepared_data = prepareDataGrpHeat(gene);
  Plotly.newPlot('groupDatavizHeat', prepared_data.data, prepared_data.layout, prepared_data.config);

  groupDatavizHeatPlot.on('plotly_hover', function (d) {
    $('#grpCompareStats').css("visibility", "visible");
    var grp_comp_data = prepareStatsDataPsudoBulk(gene.trim(), d.points[0].pointIndex[0]);
    const sorted_keys = Object.keys(cluster_names).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    const k = sorted_keys[Object.keys(cluster_names).length - d.points[0].pointIndex[0] - 1];
    const clust_name = cluster_names[k];
    updateCompStatInfo(grp_comp_data, gene, clust_name);
  })
  $('#grpCompareStats').css("visibility", "hidden");
}

var removeGrpHeat = function () {
  let groupDatavizDiv = document.getElementById('groupDatavizHeat');
  groupDatavizDiv.innerHTML = "";
  global_current_gene = "";
}

updateGroupsNums(d3.select("#numGroups").property("value"));

//showing sample info on mouse over sample image
var showSampleInfo = function (sampleId, e) {

  let infoBox = document.getElementById("sample_infoBox")
  infoBox.innerHTML = "";
  let sampleInfoData = sampleInfo[sampleId];

  if (typeof sampleInfoData !== "undefined" & sampleInfoData !== null) {

    var table = document.createElement("table");
    //Add a header
    var header = document.createElement("tr");
    var idHeaderCell = document.createElement("th");
    var nameHeaderCell = document.createElement("th");
    var relevanceHeaderCell = document.createElement("th");

    header.appendChild(idHeaderCell);
    header.appendChild(nameHeaderCell);
    header.appendChild(relevanceHeaderCell);
    table.appendChild(header);

    //Add the rest of the data to the table
    for (var i = 0; i < Object.keys(sampleInfoData).length; i++) {

      var tr = document.createElement("tr");
      var probCell = document.createElement("td");
      var valCell = document.createElement("td");

      k = Object.keys(sampleInfoData)[i];

      probCell.innerHTML = '<b>' + k + '</b>:';
      valCell.innerHTML = sampleInfoData[k];

      tr.appendChild(probCell);
      tr.appendChild(valCell);
      table.appendChild(tr);
    }

    infoBox.appendChild(table);
    $('#sample_infoBox').show();
    $('#sample_infoBox').css('left', e.pageX - 20);
    $('#sample_infoBox').css('top', e.pageY + 30);
  }

  highlight_sampl_dimplot(sampleId);
}

var hideSampleInfo = function () {
  $('#sample_infoBox').hide();
  highlight_sampl_dimplot('');
}

//showing and hiding cite information
var showCiteInfo = function () {
  $('#citeText').show();
  $('#citeBtn').hide();
}

var hideCiteInfo = function () {
  $('#citeText').hide();
  $('#citeBtn').show();
}

var dataloadingAlertOn = function () {
  $('#dataAlert').show();
  setTimeout(function () {
    $('#dataAlert').hide();
  }, app_config.dataAlert_timeout);
}

var dataloadedAlertOn = function (sampleName) {
  $('#dataloadedAlert').html('<strong>' + sampleName + '</strong> loaded.');
  $('#dataAlertLoaded').show();
  setTimeout(function () {
    $('#dataAlertLoaded').hide();
  }, 1000);

  // remove the dataloading animation and show the normal border
  $('#' + sampleName).removeClass("dataloadingbox");
  $('#' + sampleName).addClass("border");
}

var searchSampleAnalysis = function () {
  g_serch = $("#searchSampleAnalysisTxt").val()
  if (g_serch !== "") {
    showExpressions(sampleId, g_serch);
  } else {
    removeExpressions();
  }
}

var clearSampleSrh = function(){
  $("#searchSampleAnalysisTxt").val("");
  removeExpressions();
}

var searchDimViz = function () {
  g_serch = $("#searchDimVizTxt").val()
  if (g_serch !== "") {
    color_gene_dimplot(g_serch);
  } else {
    color_gene_dimplot(null);
  }
}

var clearDimViz = function(){
  $("#searchDimVizTxt").val("");
  color_gene_dimplot(null);
}

var searchGroupAnalysis = function () {
  g_search = $("#searchGroupAnalysisTxt").val();
  updateBox(g_search);
  updateGrpHeat(g_search);
}

var clearGrpSrh = function(){
  $("#searchGroupAnalysisTxt").val("");
  removeBox();
  removeGrpHeat();
  $('#grpCompareStats').css("visibility", "hidden");
}

// Search on enter key pressed
var srhSampleTxt = document.getElementById("searchSampleAnalysisTxt");
srhSampleTxt.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("searchSampleAnalysisBtn").click();
  }
});

// Search on enter key pressed
var srhDimTxt = document.getElementById("searchDimVizTxt");
srhDimTxt.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("searchDimVizTxtBtn").click();
  }
});

// Search on enter key pressed
var srhGrpTxt = document.getElementById("searchGroupAnalysisTxt");
srhGrpTxt.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("searchGroupAnalysisBtn").click();
  }
});


var getFilesNames = function (local_path) {
  $.get(local_path, function (out, status) {
    htmlObj = $.parseHTML(out);
    files_in_dir = [];
    $(htmlObj).find('a').each(function (i) {
      file_name = $(this).text();
      file_name = file_name.trim();
      if (file_name.charAt(file_name.length - 1) === "/") {
        file_name = file_name.slice(0, -1);
        files_in_dir.push(file_name);
      }
    });
    files_in_dir = files_in_dir.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    loadData(files_in_dir);
  });
}
getFilesNames("data");

// getting the csv files from the  group folder to show in card format
var getGroupGenes = function (local_path, prepare_card = true) {
  $.get(local_path, function (out, status) {
    htmlObj = $.parseHTML(out);
    $(htmlObj).find('a').each(function (i) {
      file_name = $(this).text();
      file_name = file_name.trim();
      if (file_name.slice(-4) === ".csv") {

        Papa.parse(local_path + file_name, {
          skipEmptyLines: true,
          header: true,
          download: true,
          dynamicTyping: true,
          complete: function (results, file_id) {

            file_id = file_id.split("/");
            file_id = file_id[file_id.length - 1];
            file_id = file_id.substring(0, file_id.length - 4);
            file_id = file_id.replace(/\s/g, "");
            file_id = file_id.trim();
            let k = 0;
            while (document.getElementById(file_id) !== null) {
              k = k + 1;
              file_id = file_id + k;
            }
            if (prepare_card) {
              genes_obj = {}
              results.data.forEach(function (item, index) {
                genes_obj[item.cluster] = item;
              })
              updateGroupGenesTabs(file_id, genes_obj);
            } else {
              genes_obj = results.data;
              addGroupGenesTabsAsTable(file_id, genes_obj);
            }
          }
        });
      }
    });
  });
}
getGroupGenes('group_data/group_genes/');
getGroupGenes('group_data/show_tables/', prepare_card = false);

$("#dataInfoContent").load("config/data_location.html");

// This function is called multiple times till all the samples are loaded.
//Also, if spot size or opacity changes, this function re-creates the dimentionality visualization.
var reloadDimplot = function(){

  $("#searchDimVizTxt").val("");
  $("#dimColorBy").text("Clusters");
  $('#dim_switch').prop("checked", false);

  gloabl_all_barcodes = Object.keys(dataAllPatients).map(samp => dataAllPatients[samp].map(el => samp+'_'+el.barcode)).flat()
 
  gloabl_all_point_clust_colors = Object.values(dataAllPatients).flatMap(element => element.map(pts => pts.cluster).map(clust => cluster_cols[clust]))
  gloabl_all_point_clust =  Object.keys(dataAllPatients).map(samp => dataAllPatients[samp].map(el => '<b>Sample:</b> '+samp+'<br><b>Cluster:</b> '+el.cluster+'</br><b> Barcode:'+el.barcode+'</b>')).flat()
  global_dim_x = Object.values(dataAllPatients).flatMap(element => element.map(pts => pts[app_config.dim_plot+'_1']));
  global_dim_y = Object.values(dataAllPatients).flatMap(element => element.map(pts => pts[app_config.dim_plot+'_2']));

  
  var dim_range_min_x = Math.min(...global_dim_x)
  var dim_range_max_x = Math.max(...global_dim_x)
  var dim_range_min_y = Math.min(...global_dim_y)
  var dim_range_max_y = Math.max(...global_dim_y)

  var dim_mapping_scale_x = d3.scaleLinear().domain([dim_range_min_x,dim_range_max_x]).range([0,global_spatial_cor_range]);
  var dim_mapping_scale_y = d3.scaleLinear().domain([dim_range_min_y,dim_range_max_y]).range([0,global_spatial_cor_range]);
  global_dim_x = global_dim_x.map(v => dim_mapping_scale_x(v));
  global_dim_y = global_dim_y.map(v => dim_mapping_scale_y(v));

  
  // const dimplots_width = parseInt($("#dimplots").css("width"));
  // console.log(dimplots_width)
  // $("#dimplots").css("height", dimplots_width);

  // var tsne_key
  Plotly.newPlot('dimplots', [{
    x: global_dim_x,
    y: global_dim_y,
    opacity:d3.select("#dimPointOpacity").property("value"),
    marker:{size:parseInt(d3.select("#dimPointRaius").property("value")),
         color: gloabl_all_point_clust_colors,
         line: {
          color: 'rgb(0, 0, 0)',
          width: 0
        }},
    ids: gloabl_all_barcodes,
    text: gloabl_all_point_clust,
    hovertemplate:'%{text}<extra></extra>',
    mode: 'markers'
  }], {
    xaxis: {
      zeroline: false,
      autotick: true,
      ticks: '',
      showticklabels: false,
      range: [0, global_spatial_cor_range]
    },
    yaxis: {
      autorange_opt: "reversed",
      zeroline: false,
      autotick: true,
      ticks: '',
      showticklabels: false,
      range: [0, global_spatial_cor_range]
    },
    title:{
      text:app_config.dim_plot +' - All samples'
    },
    margin:{
      t:60,
      b:10
    },
    // plot_bgcolor:"black",
    // paper_bgcolor:"#FFF3"
  });

}

function shuffleInPlace(dim_name) {

  var alt_data = {}
  var title = {}
  if(dim_name === null){
    alt_data['ids'] = gloabl_all_barcodes;
    alt_data['x'] = global_dim_x;
    alt_data['y'] = global_dim_y;

    title['text'] = app_config.dim_plot + ' - All samples';
  }else if(dim_name === "spatial"){
    let samp_spot_x = Object.keys(dataAllPatients).map(samp => dataAllPatients[samp].map(el => samp === sampleId?el.pxl_col_in_fullres: null)).flat()
    let samp_spot_y = Object.keys(dataAllPatients).map(samp => dataAllPatients[samp].map(el => samp === sampleId?el.pxl_row_in_fullres: null)).flat()
    
    alt_data['x'] = samp_spot_x.map(v => v * scaleResolutions[sampleId]);
    alt_data['y'] = samp_spot_y.map(v => global_spatial_cor_range - v * scaleResolutions[sampleId]);

    title['text'] = sampleId;
  }

  return({data:alt_data, title:title});
}

// Mouse over hilight or filter sample points
function highlight_sampl_dimplot(selSampleID){

  if($('#dim_switch').prop("checked")){
    return(null);
  }

  if($('#dimFilterPoints').prop("checked")){
    let curr_opacity = d3.select("#dimPointOpacity").property("value");
    let _opacity = curr_opacity
    if(selSampleID !== '') {
      _opacity = Object.keys(dataAllPatients).map(samp => dataAllPatients[samp].map(el => samp === selSampleID? curr_opacity:0)).flat()
    }
    Plotly.animate('dimplots', {
      data: [{marker:{
        opacity :_opacity
      }
    }],
    },
          {transition: {
                  duration: 200,
                  easing: 'linear'
                },
          frame :{
                  duration:200,
                  redraw:false
                }
          }
        );
  }else{
    let _border_width = Object.keys(dataAllPatients).map(samp => dataAllPatients[samp].map(el => samp === selSampleID? 1:0)).flat()
    Plotly.animate('dimplots', {
      data: [{marker:{
        line:{
          width : _border_width
        }
      },}],
    },
          {transition: {
                  duration: 200,
                  easing: 'linear'
                },
          frame :{
                  duration:200,
                  redraw:false
                }
          }
        );
  }
  
}

function color_gene_dimplot(gene){

  if(gene === null){
    $("#dimColorBy").text("Clusters");
  }else{
    $("#dimColorBy").text(gene);
  }

  var gene_colors = null;
  var point_text = null;
  if(gene === null){
    gene_colors = gloabl_all_point_clust_colors
    point_text = gloabl_all_point_clust;
  }else{
    gene_colors = Object.keys(dataAllPatients).map(samp => dataAllPatients[samp].map(el => getSpotExpressions(samp, el.barcode, gene))).flat()
    point_text = Object.keys(dataAllPatients).map(samp => dataAllPatients[samp].map(el => '<b>Sample:</b> '+samp+'<br><b>Cluster:</b> '+el.cluster+'</br><b> Barcode:</b> '+el.barcode+'</br><b>'+gene+':</b> '+ getSpotExpressions(samp, el.barcode, gene))).flat();

    if(typeof gene_colors[0] !== "number"){
      gene_colors = gene_colors.map(di => colorScaleDiscrete(di))
      gene = "discrete";
    }
  }
    
    Plotly.animate('dimplots', {
      data: [{marker:{
        color :gene_colors,
        colorscale: 'Portland',
        showscale: gene !== null & gene !== "discrete",
        colorbar:{
          thickness:10,
          len: 0.5
        }
      },
      text: point_text,
    },
    ],
    },
      {transition: {
                  duration: 200,
                  easing: 'linear'
                },
          frame :{
                  duration:200,
                  redraw:false
                }
          }
        );
  if(gene !== null & gene !== "discrete"){
    Plotly.animate('dimplots', {
      data: [{marker:{
        showscale: true}
            },
          ],
      },
      {transition: {
                  duration: 5,
                  easing: 'linear'
                }
          }
        );
  }else{
    Plotly.animate('dimplots', {
      data: [{marker:{
        showscale: false
      }
    },
    ],
    },
      {transition: {
                  duration: 5,
                  easing: 'linear'
                }
          }
        );
  }
}

function toggleDimPlot(switchSample = false) {
  var viewSpatial = $('#dim_switch').prop("checked");
  
  if(!switchSample){
    $('#dim_switch').prop("checked", !viewSpatial);
  }else if(switchSample & !$('#dim_switch').prop("checked")){
    return(null);
  }
 
  var dim_name = null;
  if($('#dim_switch').prop("checked")){
    dim_name = "spatial";
  }
  var new_dim_data = shuffleInPlace(dim_name);
  Plotly.animate('dimplots', {
    data: [new_dim_data.data]
  },
        {transition: {
                duration: $('#dimToggleDuration').prop("value"),
                easing: 'linear'
              },
        frame :{
                duration:$('#dimToggleDuration').prop("value"),
                redraw:false
              }
        }
      );
      Plotly.animate('dimplots', {
        layout: {
          title: {
            text:new_dim_data.title.text
          },
        },
      },
            {transition: {
                    duration: 5,
                    easing: 'linear'
                  }
            }
          );
}

// loading the csv reader for group tab
window.onload = () => {
  var reader = new FileReader();
  var picker = document.getElementById("csvPicker");

  //reading the csv file
  picker.onchange = () => reader.readAsText(picker.files[0]);
  reader.onloadend = (evt) => {
    let csv = reader.result;

    Papa.parse(csv, {
      header: true,
      dynamicTyping: true,
      complete: function (results) {
        genes_obj = results.data;
        file_id = "Upload";
        let k = 0;
        while (document.getElementById(file_id) !== null) {
          k = k + 1;
          file_id = file_id + k;
        }
        addGroupGenesTabsAsTable(file_id, genes_obj, true);
      }
    });
  }
};