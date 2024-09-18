import * as d3 from 'd3';
import './app.css';
import $ from "jquery";
import * as pf from 'pareto-frontier';
import * as clusterMaker from 'clusters';
import * as d3Polygon from "d3-polygon";


// ./node_modules/.bin/webpack-cli src/app.js --output=build/build.js -d -w


let MAIN_DATA = {};
let MAIN_METRICS = {};
let MAIN_METADATA = {};
let better = {};

// List of full challenge names : acronyms. Will be different depending on the community
var challenge_names = {
    ALL: "All cancer types",
    ACC: "Adrenocortical Carcinoma",
    BLCA: "Bladder Urothelial Carcinoma",
    BRCA: "Breast Invasive Carcinoma",
    CESC: "Cervical Squamous Cell Carcinoma and Endocervical Adenocarcinoma",
    CHOL: "Cholangiocarcinoma",
    COAD: "Colon Adenocarcinoma",
    DLBC: "Lymphoid Neoplasm Diffuse Large B-cell Lymphoma",
    ESCA: "Esophageal Carcinoma",
    GBM: "Glioblastoma Multiforme",
    HNSC: "Head and Neck Squamous Cell Carcinoma",
    KICH: "Kidney Chromophobe",
    KIRC: "Kidney Renal Clear Cell Carcinoma",
    KIRP: "Kidney Renal Papillary Cell Carcinoma",
    LAML: "Acute Myeloid Leukemia",
    LGG: "Brain Lower Grade Glioma",
    LIHC: "Liver Hepatocellular Carcinoma",
    LUAD: "Lung Adenocarcinoma",
    LUSC: "Lung Squamous Cell Carcinoma",
    MESO: "Mesothelioma",
    OV: "Ovarian Serous Cystadenocarcinoma",
    PAAD: "Pancreatic Adenocarcinoma",
    PANCAN: "Previous PanCancer study",
    PCPG: "Pheochromocytoma and Paraganglioma",
    PRAD: "Prostate Adenocarcinoma",
    READ: "Rectum Adenocarcinoma",
    SARC: "Sarcoma",
    SKCM: "Skin Cutaneous Melanoma",
    STAD: "Stomach Adenocarcinoma",
    TGCT: "Testicular Germ Cell Tumors",
    THCA: "Thyroid Carcinoma",
    THYM: "Thymoma",
    UCEC: "Uterine Corpus Endometrial Carcinoma",
    UCS: "Uterine Carcinosarcoma",
    UVM: "Uveal Melanoma",
    "GO": "Gene Ontology conservation test",
    "EC": "Enzyme Classification (EC) conservation test",
    "SwissTrees": "Agreement with Reference Gene Phylogenies: SwissTree",
    "TreeFam-A": "Agreement with Reference Gene Phylogenies: TreeFam-A",
    "STD_Eukaryota": "Species Tree Discordance Benchmark - Eukaryota",
    "STD_Fungi": "Species Tree Discordance Benchmark - Fungi",
    "STD_Bacteria": "Species Tree Discordance Benchmark - Bacteria",
    "G_STD_Luca": "Generalized Species Tree Discordance Benchmark - Luca",
    "G_STD_Eukaryota": "Generalized Species Tree Discordance Benchmark - Eukaryota",
    "G_STD_Vertebrata": "Generalized Species Tree Discordance Benchmark - Vertebrata",
    "G_STD_Fungi": "Generalized Species Tree Discordance Benchmark - Fungi",
    "G_STD2_Luca": "Generalized Species Tree Discordance Benchmark (Variant 2) - Luca",
    "G_STD2_Fungi": "Generalized Species Tree Discordance Benchmark (Variant 2) - Fungi",
    "G_STD2_Eukaryota": "Generalized Species Tree Discordance Benchmark (Variant 2) - Eukaryota",
    "G_STD2_Vertebrata": "Generalized Species Tree Discordance Benchmark (Variant 2) - Vertebrata",
    "lDDT": "Aggregation Dataset for plotting 3D Metric lDDT results for week 2021-05-29"
};

var readthedocsLink = 'https://openebench.readthedocs.io/en/latest/how_to/1_explore_results.html'
var API = 'https://dev-openebench.bsc.es/api/scientific/public/'

function loadurl(data_dir) {
    let divid;

    let charts = document.getElementsByClassName("benchmarkingChart");

    let i;
    let dataId;
    let y;

    // append ids to chart/s and make d3 plot
    for (y of charts) {

        // get benchmarking event id
        dataId = y.getAttribute('data-id');
        i = y.getAttribute('element_id');
        //set chart id
        divid = (dataId + i).replace(":", "_");
        y.id = divid;

        // append buttons
        let button1_id = divid + "__none";
        let button2_id = divid + "__squares";
        let button3_id = divid + "__diagonals";
        let button4_id = divid + "__clusters";

        // append selection list agenttip container
        d3.select('#' + divid).append("div")
            .attr("id", "agenttip_container")

        let select_list = d3.select('#' + divid).append("form").append("select")
            .attr("class", "classificators_list")
            .attr("id", divid + "_dropdown_list")
            .on('change', function(d) {
                onQuartileChange(this.options[this.selectedIndex].id);
            })
            .append("optgroup")
            .attr("label", "Select a classification method:");

        select_list.append("option")
            .attr("class", "selection_option")
            .attr("id", button1_id)
            .attr("title", "Show only raw data")
            .attr("selected", "disabled")
            .attr("data-toggle", "list_agenttip")
            .attr("data-container", "#agenttip_container")
            .text("NO CLASSIFICATION")

        select_list.append("option")
            .attr("class", "selection_option")
            .attr("id", button2_id)
            .attr("title", "Apply square quartiles classification method (based on the 0.5 quartile of the X and Y metrics)")
            .attr("data-toggle", "list_agenttip")
            .attr("data-container", "#agenttip_container")
            .text("SQUARE QUARTILES")

        select_list.append("option")
            .attr("class", "selection_option")
            .attr("id", button3_id)
            .attr("title", "Apply diagonal quartiles classifcation method (based on the assignment of a score to each participant proceeding from its distance to the 'optimal performance' corner)")
            .attr("data-toggle", "list_agenttip")
            .attr("data-container", "#agenttip_container")
            .text("DIAGONAL QUARTILES")

        select_list.append("option")
            .attr("class", "selection_option")
            .attr("id", button4_id)
            .attr("title", "Apply diagonal quartiles classifcation method (based on the assignment of a score to each participant proceeding from its distance to the 'optimal performance' corner)")
            .attr("data-toggle", "list_agenttip")
            .attr("data-container", "#agenttip_container")
            .text("K-MEANS CLUSTERING")

        read_jsons(dataId, divid, data_dir, i)


        //check the transformation to table attribute and append table to html
        if (y.getAttribute('toTable') == "true") {
            let table_id = divid + "_table";
            var input = $('<br><br><table id="' + table_id + '" data-id="' + dataId + '" class="benchmarkingTable"></table>');
            $("#" + divid).append(input);
        };


    }



};


function run_visualizer(challenge_names) {

    // append accordion
    var input = $('<div class="togglebox"></div>');
    $("#custom_body").append(input);

    try {

        let data_dir = $('#custom_body').data("dir")
        build_accordion(data_dir, challenge_names)

    } catch (err) {
        console.log(`Invalid Url Error: ${err.stack} `);
    }


};


async function read_manifest(run_dir) {

    let response = await fetch(run_dir + "/Manifest.json");
    let res = await response.json();

    return res
}

async function build_accordion(data_dir, challenge_names) {

    var accordion_challenges = []; // this var will store the ids of challenges that are already in the accordion

    // loop over all the directories passed to the div and read manifest
    for (const run_dir of data_dir) {

        let res = await read_manifest(run_dir);
        var i = 0;
        for (const element of res) {
            let content = await $.getJSON(run_dir + "/" + element.id + "/" + element.id + ".json")
            
            // append new challenge to accordion, if it is not already there
            for (let i = 0; i < content.length; i++) {
				if(content[i].datalink.inline_data.visualization.type == "2D-plot"){
					
					var input = $('<div>\
								<input id="radio_' + element.id + i + '" type="radio" name="toggle"/>\
								<label for="radio_' + element.id + i + '">' + content[i]._id + '</label>\
								<div class="content">\
								  <div style= "float:left" element_id ='+i+' data-id=' + element.id + ' toTable="true" class="benchmarkingChart">\
								</div>\
							  </div>');
					$(".togglebox").append(input);
				}

            }
            /**
            if (accordion_challenges.includes(element.id) == false) {

                if (element.id in challenge_names) {
                    var full_name = element.id + " - " + challenge_names[element.id];
                } else {
                    var full_name = element.id;
                };

                var input = $('<div>\
                            <input id="radio_' + element.id + +i + '" type="radio" name="toggle"/>\
                            <label for="radio_' + element.id + +i + '">Challenge name: ' + full_name + '</label>\
                            <div class="content">\
                              <div style= "float:left" data-id=' + element.id + ' toTable="true" class="benchmarkingChart">\
                            </div>\
                          </div>');



                i++;
                accordion_challenges.push(element.id)
            }
            **/


        };


    };

    loadurl(data_dir);

}
async function read_jsons(dataId, divid, data_dir, i) {

    // look for challenge data in all dir runs

    for (const run_dir of data_dir) {
        var full_json = [];
        var metadata = [];
        var metric_x_name;
        var metric_y_name;
        var metric_x_id = "";
        var metric_y_id = "";
        var datasetId;
        try {
            let content = await $.getJSON(run_dir + "/" + dataId + "/" + dataId + ".json")
				
            datasetId = content[i]._id
            metric_x_name = content[i].datalink.inline_data.visualization.x_axis;
            metric_y_name = content[i].datalink.inline_data.visualization.y_axis;
            metadata['datasetId'] = datasetId
            metadata['metric_x_id'] = metric_x_id;
            metadata['metric_y_id'] = metric_y_id;
            if (content[i].datalink.inline_data.metrics) {
                metric_x_id = content[i].datalink.inline_data.metrics.metric_x_id;
                metric_y_id = content[i].datalink.inline_data.metrics.metric_y_id;
                metadata['metric_x_id'] = metric_x_id;
                metadata['metric_y_id'] = metric_y_id;
            }

            // build array with every participant as a simple json object
            content[i].datalink.inline_data.challenge_participants.forEach(function(element) {

                if (content[i].datalink.inline_data.visualization.optimization != null) {
                    better[divid] = content[i].datalink.inline_data.visualization.optimization;
                } else {
                    better[divid] = "top-right";
                }
                //if participant name is too long, slice it
                var name;
                if (element.participant_id.length > 22) {
                    name = element.participant_id.substring(0, 22);
                } else {
                    name = element.participant_id
                }

                //only add participant to final json if it is not already there
                // due to the multi run combinations...participants could be added more than once
                let found;
                full_json.forEach(function(agent) {
                    if (agent.agentname == name) {
                        found = true;
                    }
                });

                if (found != true) {
                    full_json.push({
                        "agentname": name,
                        "x": parseFloat(element.metric_x),
                        "y": parseFloat(element.metric_y),
                        "e_x": element.stderr_x ? parseFloat(element.stderr_x) : 0,
                        "e_y": element.stderr_y ? parseFloat(element.stderr_y) : 0
                    });
                }



            });

        } catch { // if not found, skip to next directory

            continue;

        }
        load_data_chart(full_json, metadata, divid, metric_x_name, metric_y_name, data_dir)
    };



}

function load_data_chart(full_json, metadata, divid, metric_x_name, metric_y_name, data_dir) {

    MAIN_DATA[divid] = full_json;
    MAIN_METRICS[divid] = [metric_x_name, metric_y_name]
    MAIN_METADATA = metadata
    // by default, no classification method is applied. it is the first item in the selection list
    var e = document.getElementById(divid + "_dropdown_list");
    let classification_type = e.options[e.selectedIndex].id;

    createChart(full_json, divid, classification_type, metric_x_name, metric_y_name, metadata);

}


function onQuartileChange(ID, metric_x_name, metric_y_name) {

    var chart_id = ID.split("__")[0];
    // console.log(d3.select('#'+'svg_'+chart_id));
    d3.select('#' + 'svg_' + chart_id).remove();
    let classification_type = ID;
    createChart(MAIN_DATA[chart_id], chart_id, classification_type, MAIN_METRICS[chart_id][0], MAIN_METRICS[chart_id][1], MAIN_METADATA);
};

function compute_classification(data, svg, xScale, yScale, div, width, height, removed_agents, divid, classification_type, legend_color_palette) {

    let transform_to_table; //this variable is set to true if there are table elements with the corresponden divid in the html file
    // every time a new classification is compute the previous results table is deleted (if it exists)
    if (document.getElementById(divid + "_table") != null) {
        document.getElementById(divid + "_table").innerHTML = '';
        transform_to_table = true;
    };

    // append optimization arrow
    add_arrow(divid, svg, xScale, yScale, better[divid]);

    if (classification_type == (divid + "__squares")) {
        draw_pareto(data, svg, xScale, yScale, div, width, height, removed_agents, divid, better[divid]);
        get_square_quartiles(data, svg, xScale, yScale, div, removed_agents, better[divid], divid, transform_to_table, legend_color_palette);
        append_quartile_numbers_to_plot(svg, xScale, yScale, better[divid], divid);
    } else if (classification_type == (divid + "__diagonals")) {
        draw_pareto(data, svg, xScale, yScale, div, width, height, removed_agents, divid, better[divid]);
        get_diagonal_quartiles(data, svg, xScale, yScale, div, width, height, removed_agents, better[divid], divid, transform_to_table, legend_color_palette);
    } else if (classification_type == (divid + "__clusters")) {
        draw_pareto(data, svg, xScale, yScale, div, width, height, removed_agents, divid, better[divid]);
        get_clusters(data, svg, xScale, yScale, div, width, height, removed_agents, better[divid], divid, transform_to_table, legend_color_palette);
    } else {
        draw_pareto(data, svg, xScale, yScale, div, width, height, removed_agents, divid, better[divid]);
    }
};


function add_arrow(divid, svg, xScale, yScale, better) {
    // append optimization arrow

    svg.append("svg:defs").append("svg:marker")
        .attr("id", "opt_triangle")
        .attr("class", function(d) {
            return divid + "___better_annotation";
        })
        .attr("refX", 6)
        .attr("refY", 6)
        .attr("markerWidth", 30)
        .attr("markerHeight", 30)
        .attr("markerUnits", "userSpaceOnUse")
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 0 0 12 6 0 12 3 6")
        .style("fill", "black")
        .style("opacity", 0.7);

    let x_axis = xScale.domain();
    let y_axis = yScale.domain();

    // set coordinates depending on optimization
    let x1, y1, x2, y2, top, right;

    if (better == "bottom-right") {
        x1 = (x_axis[1] - (0.05 * (x_axis[1] - x_axis[0])))
        y1 = (y_axis[1] - (0.9 * (y_axis[1] - y_axis[0])))
        x2 = (x_axis[1] - (0.009 * (x_axis[1] - x_axis[0])))
        y2 = (y_axis[1] - (0.97 * (y_axis[1] - y_axis[0])))
        right = 1
        top = 0
    } else if (better == "top-right") {
        x1 = (x_axis[1] - (0.05 * (x_axis[1] - x_axis[0])))
        y1 = (y_axis[1] - (0.1 * (y_axis[1] - y_axis[0])))
        x2 = (x_axis[1] - (0.009 * (x_axis[1] - x_axis[0])))
        y2 = (y_axis[1] - (0.03 * (y_axis[1] - y_axis[0])))
        right = 1
        top = 1

    } else if (better == "top-left") {
        x1 = (x_axis[1] - (0.95 * (x_axis[1] - x_axis[0])))
        y1 = (y_axis[1] - (0.1 * (y_axis[1] - y_axis[0])))
        x2 = (x_axis[1] - (0.991 * (x_axis[1] - x_axis[0])))
        y2 = (y_axis[1] - (0.03 * (y_axis[1] - y_axis[0])))
        right = 0
        top = 1
    }

    var line = svg.append("line")
        .attr("class", function(d) {
            return divid + "___better_annotation";
        })
        .attr("x1", xScale(x1))
        .attr("y1", yScale(y1))
        .attr("x2", xScale(x2))
        .attr("y2", yScale(y2))
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#opt_triangle)")
        .style("opacity", 0.4);

    svg.append("text")
        .attr("class", function(d) {
            return divid + "___better_annotation";
        })
        .attr("x", xScale(x_axis[right]))
        .attr("y", yScale(y_axis[top]))
        .style("opacity", 0.4)
        .style("font-size", ".7vw")
        .text("better");

};


function compute_chart_height(data) {

    if (data.length % 5 == 0) {
        return (90 + (20 * (Math.trunc(data.length / 5))));
    } else if (data.lenght % 5 != 0) {
        return (90 + (20 * (Math.trunc(data.length / 5) + 1)));
    }

};

function get_avg_stderr(data, axis) {

    var sum = 0;

    data.forEach(function(element) {
        if (axis == "y") {
            sum = sum + element.e_y;
        } else if (axis == "x") {
            sum = sum + element.e_x;
        }
    });

    return sum / data.length

}

function createChart(data, divid, classification_type, metric_x_name, metric_y_name, metadata) {

    let margin = {
            top: 20,
            right: 40,
            bottom: compute_chart_height(data),
            left: 60
        },
        width = Math.round($(window).width() * 0.6818) - margin.left - margin.right,
        height = Math.round($(window).height() * 0.5787037) - margin.top - margin.bottom;

    let min_x = d3.min(data, function(d) {
        return d.x;
    });
    let max_x = d3.max(data, function(d) {
        return d.x;
    });

	if (min_x == max_x) {
		min_x = 0;
	}
    //the x axis domain is calculated based in the difference between the max and min, and the average stderr (BETA)
    var proportion = get_avg_stderr(data, "x") / (max_x - min_x);

    let xScale = d3.scaleLinear()
        .range([0, width])
        .domain([min_x - proportion * (max_x - min_x), max_x + proportion * (max_x - min_x)]).nice();

    let min_y = d3.min(data, function(d) {
        return d.y;
    });
    let max_y = d3.max(data, function(d) {
        return d.y;
    });
	if (min_y == max_y) {
		min_y = 0;
	}
    //the y axis domain is calculated based in the difference between the max and min, and the average stderr (BETA)
    proportion = get_avg_stderr(data, "y") / (max_y - min_y);

    let yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([min_y - proportion * (max_y - min_y), max_y + proportion * (max_y - min_y)]).nice();

    let xAxis = d3.axisBottom(xScale).ticks(12 * height / width),
        yAxis = d3.axisLeft(yScale).ticks(12 * height / width);

    let line = d3.line()
        .x(function(d) {
            return xScale(d.x);
        })
        .y(function(d) {
            return yScale(d.y);
        });

    // Define the div for the agenttip

    let div = d3.select('body').append("div").attr("class", "benchmark_agenttip").style("opacity", 0);

    // append the svg element
    // d3.select("svg").remove()
    // console.log(d3.select("svg").remove());
    let svg = d3.select('#' + divid).append("svg")
        .attr("class", "benchmarkingSVG")
        .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom))
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr('id', 'svg_' + divid)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g").append("rect").attr("width", width).attr("height", height).attr("class", "plot-bg");

    // Add Axis numbers
    svg.append("g").attr("class", "axis axis--x")
        .attr("transform", "translate(" + 0 + "," + height + ")")
        .call(xAxis);

    svg.append("g").attr("class", "axis axis--y").call(yAxis);

    // add axis labels
    svg.append("text")
        .attr("transform",
            "translate(" + (width / 2) + " ," +
            (height + margin.top + (Math.round($(window).height() * 0.0347))) + ")")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("font-size", ".75vw")
        .text(metric_x_name);

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("font-size", ".75vw")
        .text(metric_y_name);

    // add pareto legend

    svg.append("line")
        .attr("x1", 0)
        .attr("y1", height + margin.top + (Math.round($(window).height() * 0.0347)))
        .attr("x2", Math.round($(window).width() * 0.02083))
        .attr("y2", height + margin.top + (Math.round($(window).height() * 0.0347)))

        .attr("stroke", "grey")
        .attr("stroke-width", 2)
        .style("stroke-dasharray", ("15, 5"))
        .style("opacity", 0.7)

    svg.append("text")
        .attr("transform",
            "translate(" + (Math.round($(window).width() * 0.05208)) + " ," +
            (height + margin.top + (Math.round($(window).height() * 0.0347)) + 5) + ")")
        .style("text-anchor", "middle")
        // .style("font-weight", "bold")
        .style("font-size", ".75vw")
        .text("Pareto frontier");

    // add X and Y Gridlines
    var gridlines_x = d3.axisBottom()
        .ticks(12 * height / width)
        .tickFormat("")
        .tickSize(height)
        .scale(xScale);

    var gridlines_y = d3.axisLeft()
        .ticks(12 * height / width)
        .tickFormat("")
        .tickSize(-width)
        .scale(yScale);

    svg.append("g")
        .attr("class", "bench_grid")
        .call(gridlines_x);

    svg.append("g")
        .attr("class", "bench_grid")
        .call(gridlines_y);

    let removed_agents = []; // this array stores the agents when the user clicks on them

    // setup fill color
    let cValue_func = function(d) {
            return d.agentname;
        },
        color_func = d3.scaleOrdinal(d3.schemeSet1.concat(d3.schemeSet3).concat(d3.schemeSet2));

    // get object with agents and colors:
    var legend_color_palette = {};
    data.forEach(function(element) {
        legend_color_palette[element.agentname] = color_func(element.agentname);
    });

    append_dots_errobars(svg, data, xScale, yScale, div, cValue_func, color_func, divid, metric_x_name, metric_y_name);

    draw_legend(data, svg, xScale, yScale, div, width, height, removed_agents, color_func, color_func.domain(), margin, divid, classification_type, legend_color_palette);

    compute_classification(data, svg, xScale, yScale, div, width, height, removed_agents, divid, classification_type, legend_color_palette);

    //metadata
    $('.container-fluid#' + divid).remove();
    addMetadataLegend(divid, $('#custom_body').data("dir"), metadata['datasetId'], metric_x_name, metadata['metric_x_id'], metric_y_name, metadata['metric_y_id']);

};

async function addMetadataLegend(divid, data_dir, idAggreagation, metric_x_name, metric_x_id, metric_y_name, metric_y_id) {
    //get metrics description

    //read manifest 
    let res = await read_manifest(data_dir);
    var timestamp = ""
    if (res[0].timestamp) {
        timestamp = res[0].timestamp.split("+")[0].split("T")
    }

    var participant = res[0].participants.pop()
    var mode = res[0].mode

    var container = document.createElement("div");
    container.setAttribute("class", "container-fluid");
    container.setAttribute("id", divid);

    var row = document.createElement("div");
    row.setAttribute("class", "row");

    var line = document.createElement("hr");
    line.setAttribute("style", "color: #056483; height: 10px; margin: 0; opacity: 100");
    //
    var col1 = document.createElement("div");
    col1.setAttribute("class", "col-1 text-center title-tag");
    col1.setAttribute("style", "color:white; background-color: #056483");
    var txt1 = document.createTextNode("Analysis Details");
    col1.appendChild(txt1);
    //
    var col2 = document.createElement("div");
    col2.setAttribute("class", "col-3");
    var span = document.createElement('span');
    span.setAttribute("class", "title-tag");
    var txt2 = document.createTextNode("Plot generated at: ");
    span.appendChild(txt2);
    col2.appendChild(span);
    col2.appendChild(document.createTextNode(timestamp));
    //
    var col3 = document.createElement("div");
    col3.setAttribute("class", "col-3");
    var span = document.createElement('span');
    span.setAttribute("class", "title-tag");
    var txt3 = document.createTextNode("Source Datasets: ");
    span.appendChild(txt3);
    col3.appendChild(span);
    col3.appendChild(document.createElement('br'))

    var span = document.createElement('span');
    span.setAttribute("class", "title-tag");
    span.setAttribute("class", "title-tag ident");
    var txt3 = document.createTextNode("Public participants: ");
    span.appendChild(txt3);
    col3.appendChild(span);

    //get aggregation id if not the first participant
    if (idAggreagation.startsWith('OEB')) {
        var link3 = document.createElement("a");
        link3.setAttribute("href", API + 'Dataset/' + idAggreagation)
        link3.setAttribute("target", "_blank")
        link3.appendChild(document.createTextNode(idAggreagation))

    } else {
        var link3 = document.createTextNode('-');
    }
    col3.appendChild(link3);

    col3.appendChild(document.createElement('br'))

    var span = document.createElement('span');
    span.setAttribute("class", "title-tag ident");
    var txt3 = document.createTextNode("New participant: ");
    span.appendChild(txt3);
    col3.appendChild(span);
    var txt3 = document.createTextNode(participant);
    col3.appendChild(txt3);
    col3.appendChild(document.createElement('br'))

    //
    var col4 = document.createElement("div");
    col4.setAttribute("class", "col-2");
    var span = document.createElement('span');
    span.setAttribute("class", "title-tag");
    var txt4 = document.createTextNode("Assessment Metrics: ");
    span.appendChild(txt4);
    col4.appendChild(span);
    col4.appendChild(document.createElement('br'))

    var span = document.createElement('span');
    span.setAttribute("class", "title-tag ident");
    var txt4 = document.createTextNode("x-axis: ");
    span.appendChild(txt4);
    if (metric_x_id != "") {
        var linkMetricsX = document.createElement("a");
        linkMetricsX.setAttribute("href", API + 'Metrics/' + metric_x_id)
        linkMetricsX.setAttribute("target", "_blank")
        linkMetricsX.appendChild(document.createTextNode(metric_x_name))

    } else {
        var linkMetricsX = document.createTextNode(metric_x_name);
    }

    col4.appendChild(span);

    col4.appendChild(linkMetricsX);
    col4.appendChild(document.createElement('br'))

    var span = document.createElement('span');
    span.setAttribute("class", "title-tag ident");
    var txt4 = document.createTextNode("y-axis: ");
    span.appendChild(txt4);
    if (metric_x_id != "") {
        var linkMetricsY = document.createElement("a");
        linkMetricsY.setAttribute("href", API + 'Metrics/' + metric_y_id)
        linkMetricsY.setAttribute("target", "_blank")
        linkMetricsY.appendChild(document.createTextNode(metric_y_name))

    } else {
        var linkMetricsY = document.createTextNode(metric_y_name);
    }
    col4.appendChild(span);


    col4.appendChild(linkMetricsY);
    col4.appendChild(document.createElement('br'))

    //
    var col5 = document.createElement("div");
    col5.setAttribute("class", "col-2");
    var span = document.createElement('span');
    span.setAttribute("class", "title-tag");
    var txt5 = document.createTextNode("More information: ");
    var link = document.createElement("a");
    link.setAttribute("href", readthedocsLink)
    link.setAttribute("target", "_blank")
    link.appendChild(document.createTextNode("Visualitzation and interpretation"))
    span.appendChild(txt5)
    col5.appendChild(span)
    col5.appendChild(link)

    var line2 = document.createElement("hr");
    line2.setAttribute("style", "color: #056483; height: 10px; margin: 0; opacity: 100");

    row.appendChild(line);
    row.appendChild(col1);
    row.appendChild(col2);
    row.appendChild(col3)
    row.appendChild(col4)
    row.appendChild(col5)

    container.append(row)
    $("#" + divid).append(container);
    //$("#" + divid).append(document.createElement("br"));
}

function append_dots_errobars(svg, data, xScale, yScale, div, cValue, color, divid, metric_x_name, metric_y_name) {

    // Add Error Line
    svg.append("g").selectAll("line")
        .data(data).enter()
        .append("line")
        .attr("class", "error-line")
        .attr("id", function(d) {
            return divid + "___line" + d.agentname.replace(/[\. ()/-]/g, "_");
        })
        .attr("x1", function(d) {
            return xScale(d.x);
        })
        .attr("y1", function(d) {
            return yScale(d.y + d.e_y);
        })
        .attr("x2", function(d) {
            return xScale(d.x);
        })
        .attr("y2", function(d) {
            return yScale(d.y - d.e_y);
        });

    // Add X Axis Error Line
    svg.append("g").selectAll("line")
        .data(data).enter()
        .append("line")
        .attr("class", "error-line")
        .attr("id", function(d) {
            return divid + "___lineX" + d.agentname.replace(/[\. ()/-]/g, "_");
        })
        .attr("x1", function(d) {
            return xScale(d.x - d.e_x);
        })
        .attr("y1", function(d) {
            return yScale(d.y);
        })
        .attr("x2", function(d) {
            return xScale(d.x + d.e_x);
        })
        .attr("y2", function(d) {
            return yScale(d.y);
        });

    // Add Error Top Cap
    svg.append("g").selectAll("line")
        .data(data).enter()
        .append("line")
        .attr("id", function(d) {
            return divid + "___top" + d.agentname.replace(/[\. ()/-]/g, "_");
        })
        .attr("class", "error-cap")
        .attr("x1", function(d) {
            return xScale(d.x) - 4;
        })
        .attr("y1", function(d) {
            return yScale(d.y + d.e_y);
        })
        .attr("x2", function(d) {
            return xScale(d.x) + 4;
        })
        .attr("y2", function(d) {
            return yScale(d.y + d.e_y);
        });

    // Add Error Bottom Cap
    svg.append("g").selectAll("line")
        .data(data).enter()
        .append("line")
        .attr("id", function(d) {
            return divid + "___bottom" + d.agentname.replace(/[\. ()/-]/g, "_");
        })
        .attr("class", "error-cap")
        .attr("x1", function(d) {
            return xScale(d.x) - 4;
        })
        .attr("y1", function(d) {
            return yScale(d.y - d.e_y);
        })
        .attr("x2", function(d) {
            return xScale(d.x) + 4;
        })
        .attr("y2", function(d) {
            return yScale(d.y - d.e_y);
        });

    // add right error cap
    svg.append("g").selectAll("line")
        .data(data).enter()
        .append("line")
        .attr("class", "error-cap")
        .attr("id", function(d) {
            return divid + "___right" + d.agentname.replace(/[\. ()/-]/g, "_");
        })
        .attr("x1", function(d) {
            return xScale(d.x + d.e_x);
        })
        .attr("y1", function(d) {
            return yScale(d.y) - 4;
        })
        .attr("x2", function(d) {
            return xScale(d.x + d.e_x);
        })
        .attr("y2", function(d) {
            return yScale(d.y) + 4;
        });

    // add left error cap
    svg.append("g").selectAll("line")
        .data(data).enter()
        .append("line")
        .attr("class", "error-cap")
        .attr("id", function(d) {
            return divid + "___left" + d.agentname.replace(/[\. ()/-]/g, "_");
        })
        .attr("x1", function(d) {
            return xScale(d.x - d.e_x);
        })
        .attr("y1", function(d) {
            return yScale(d.y) - 4;
        })
        .attr("x2", function(d) {
            return xScale(d.x - d.e_x);
        })
        .attr("y2", function(d) {
            return yScale(d.y) + 4;
        });

    // add dots
    let symbol = d3.symbol();

    let formatComma = d3.format(",");
    let formatDecimal = d3.format(".4f");

    let dots = svg.selectAll(".dots")
        .data(data)
        .enter()
        .append("path")
        .attr("class", "benchmark_path");

    dots.attr("d", symbol.type(function() {
            return d3.symbolSquare
        }))
        .attr("id", function(d) {
            return divid + "___" + d.agentname.replace(/[\. ()/-]/g, "_");
        })
        .attr("class", "line")
        .attr('transform', function(d) {
            return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
        })
        .attr("r", 6)
        .style("fill", function(d) {
            return color(cValue(d));
        })
        .on("mouseover", function(d) {
            // show agenttip only if the agent is visible
            let ID = divid + "___" + d.agentname.replace(/[\. ()/-]/g, "_");

            if (d3.select("#" + ID).style("opacity") == 1) {
                div.transition()
                    .duration(100)
                    .style("display", "block")
                    .style("opacity", .9);
                div.html("<b>" + d.agentname + "</b><br/>" + metric_x_name + ": " + formatComma(d.x) + "<br/>" + metric_y_name + ": " + formatDecimal(d.y))
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY) + "px");
            }
        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(1500)
                .style("display", "none")
                .style("opacity", 0);
        });

};

function draw_legend(data, svg, xScale, yScale, div, width, height, removed_agents, color, color_domain, margin, divid, classification_type, legend_color_palette) {

    //set number of elements per legend row
    let n = 5;

    let legend = svg.selectAll(".legend")
        .data(color_domain)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            return "translate(" + (-width + i % n * (Math.round($(window).width() * 0.113636))) + "," + (height + (Math.round($(window).height() * 0.0862962)) + Math.floor(i / n) * (Math.round($(window).height() * 0.0231481))) + ")";
        });

    // draw legend colored rectangles
    legend.append("rect")
        .attr("x", width + Math.round($(window).width() * 0.010227))
        .attr("width", Math.round($(window).width() * 0.010227))
        .attr("height", Math.round($(window).height() * 0.020833))
        .attr("id", function(d) {
            return divid + "___leg_rect" + d.replace(/[\. ()/-]/g, "_");
        })
        .attr("class", "benchmark_legend_rect")
        .style("fill", color)
        .on('click', function(d) {

            let dot = d3.select("text#" + divid + "___" + d.replace(/[\. ()/-]/g, "_"));
            let ID = dot._groups[0][0].id;

            if (data.length - removed_agents.length - 1 >= 4) {

                let legend_rect = this;
                show_or_hide_participant_in_plot(ID, data, svg, xScale, yScale, div, width, height, removed_agents, divid, classification_type, legend_rect, legend_color_palette);

            } else if (data.length - removed_agents.length - 1 < 4 && (d3.select("#" + ID).style("opacity")) == 0) {

                let legend_rect = this;
                show_or_hide_participant_in_plot(ID, data, svg, xScale, yScale, div, width, height, removed_agents, divid, classification_type, legend_rect, legend_color_palette);

            } else {

                $('.removal_alert').remove();
                var alert_msg = $('<div class="removal_alert">\
                                <span class="closebtn" onclick="(this.parentNode.remove());">&times;</span>\
                                At least four participants are required for the benchmark!!\
                              </div>');
                $("#" + divid).append(alert_msg);

                setTimeout(function() {
                    if ($('.removal_alert').length > 0) {
                        $('.removal_alert').remove();
                    }
                }, 5000)

            };
        })
        .on("mouseover", function(d) {

            let dot = d3.select("text#" + divid + "___" + d.replace(/[\. ()/-]/g, "_"));
            let ID = dot._groups[0][0].id;
            let agent_id = ID.split("___")[1];

            if (d3.select("#" + ID).style("opacity") == 0) {
                d3.select(this).style("opacity", 1);
                d3.select("text#" + divid + "___" + agent_id).style("opacity", 1);
            } else {
                d3.select(this).style("opacity", 0.2);
                d3.select("text#" + divid + "___" + agent_id).style("opacity", 0.2);
            };

        })
        .on("mouseout", function(d) {

            let dot = d3.select("text#" + divid + "___" + d.replace(/[\. ()/-]/g, "_"));
            let ID = dot._groups[0][0].id;
            let agent_id = ID.split("___")[1];

            if (d3.select("#" + ID).style("opacity") == 0) {
                d3.select(this).style("opacity", 0.2);
                d3.select("text#" + divid + "___" + agent_id).style("opacity", 0.2);
            } else {
                d3.select(this).style("opacity", 1);
                d3.select("text#" + divid + "___" + agent_id).style("opacity", 1);
            };
        });

    // draw legend text
    legend.append("text")
        .attr("x", width + Math.round($(window).width() * 0.022727))
        .attr("y", Math.round($(window).height() * 0.01041))
        .attr("id", function(d) {
            return divid + "___" + d.replace(/[\. ()/-]/g, "_");
        })
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .style("font-size", ".7vw")
        .text(function(d) {
            return d;
        });

};

function draw_pareto(data, svg, xScale, yScale, div, width, height, removed_agents, divid, better) {

    const points = [];

    let agents_not_hidden = remove_hidden_agents(data, removed_agents);

    agents_not_hidden.forEach(function(element) {
        points.push([element['x'], element['y']])
    });

    let pf_coords;
    let x_axis = xScale.domain();
    let y_axis = yScale.domain();

    if (better == "bottom-right") {
        pf_coords = pf.getParetoFrontier(points, {
            optimize: 'bottomRight'
        });
        // append edges to pareto frontier
        pf_coords.unshift([pf_coords[0][0], y_axis[1]]);
        pf_coords.push([x_axis[0], pf_coords[pf_coords.length - 1][1]]);

    } else if (better == "top-right") {
        pf_coords = pf.getParetoFrontier(points, {
            optimize: 'topRight'
        });
        // append edges to pareto frontier
        pf_coords.unshift([pf_coords[0][0], y_axis[0]]);
        pf_coords.push([x_axis[0], pf_coords[pf_coords.length - 1][1]]);

    } else if (better == "top-left") {
        pf_coords = pf.getParetoFrontier(points, {
            optimize: 'topLeft'
        });
        // append edges to pareto frontier
        pf_coords.unshift([pf_coords[0][0], y_axis[0]]);
        pf_coords.push([x_axis[1], pf_coords[pf_coords.length - 1][1]]);
    }
    for (var i = 0; i < (pf_coords.length - 1); i++) {
        svg.append("line")
            .attr("clip-path", "url(#clip)")
            .attr("x1", xScale(pf_coords[i][0]))
            .attr("y1", yScale(pf_coords[i][1]))
            .attr("x2", xScale(pf_coords[i + 1][0]))
            .attr("y2", yScale(pf_coords[i + 1][1]))
            .attr("id", function(d) {
                return divid + "___pareto";
            })
            .attr("stroke", "grey")
            .attr("stroke-width", 2)
            .style("stroke-dasharray", ("20, 5"))
            .style("opacity", 0.4)
    };


}

function show_or_hide_participant_in_plot(ID, data, svg, xScale, yScale, div, width, height, removed_agents, divid, classification_type, legend_rect, legend_color_palette) {

    let agent_id = ID.split("___")[1];
    // remove the existing number and classification lines from plot (if any)
    svg.selectAll("#" + divid + "___x_quartile").remove();
    svg.selectAll("#" + divid + "___y_quartile").remove();
    svg.selectAll("#" + divid + "___diag_quartile_0").remove();
    svg.selectAll("#" + divid + "___diag_quartile_1").remove();
    svg.selectAll("#" + divid + "___diag_quartile_2").remove();
    svg.selectAll("#" + divid + "___num_bottom_right").remove();
    svg.selectAll("#" + divid + "___num_top_right").remove();
    svg.selectAll("#" + divid + "___num_bottom_left").remove();
    svg.selectAll("#" + divid + "___num_top_left").remove();
    svg.selectAll("#" + divid + "___pareto").remove();
    svg.selectAll("." + divid + "___diag_num").remove();
    svg.selectAll("." + divid + "___cluster_num").remove();
    svg.selectAll("." + divid + "___clust_lines").remove();
    svg.selectAll("." + divid + "___clust_polygons").remove();
    svg.selectAll("." + divid + "___better_annotation").remove();

    let blockopacity = d3.select("#" + ID).style("opacity");

    // change the opacity to 0 or 1 depending on the current state
    if (blockopacity == 0) {
        d3.select("#" + ID).style("opacity", 1);
        d3.select("#" + divid + "___top" + agent_id).style("opacity", 1);
        d3.select("#" + divid + "___bottom" + agent_id).style("opacity", 1);
        d3.select("#" + divid + "___line" + agent_id).style("opacity", 1);
        d3.select("#" + divid + "___lineX" + agent_id).style("opacity", 1);
        d3.select("#" + divid + "___right" + agent_id).style("opacity", 1);
        d3.select("#" + divid + "___left" + agent_id).style("opacity", 1);
        // recalculate the quartiles after removing the agents
        let index = $.inArray(agent_id.replace(/_/g, "-"), removed_agents);
        removed_agents.splice(index, 1);
        compute_classification(data, svg, xScale, yScale, div, width, height, removed_agents, divid, classification_type, legend_color_palette);
        //change the legend opacity to keep track of hidden agents
        d3.select(legend_rect).style("opacity", 1);
        d3.select("text#" + divid + "___" + agent_id).style("opacity", 1);

    } else {
        d3.select("#" + ID).style("opacity", 0);
        d3.select("#" + divid + "___top" + agent_id).style("opacity", 0);
        d3.select("#" + divid + "___bottom" + agent_id).style("opacity", 0);
        d3.select("#" + divid + "___line" + agent_id).style("opacity", 0);
        d3.select("#" + divid + "___lineX" + agent_id).style("opacity", 0);
        d3.select("#" + divid + "___right" + agent_id).style("opacity", 0);
        d3.select("#" + divid + "___left" + agent_id).style("opacity", 0);
        removed_agents.push(agent_id.replace(/_/g, "-"));
        compute_classification(data, svg, xScale, yScale, div, width, height, removed_agents, divid, classification_type, legend_color_palette);
        //change the legend opacity to keep track of hidden agents
        d3.select(legend_rect).style("opacity", 0.2);
        d3.select("text#" + divid + "___" + agent_id).style("opacity", 0.2);
    }

};

function get_square_quartiles(data, svg, xScale, yScale, div, removed_agents, better, divid, transform_to_table, legend_color_palette) {

    let agents_not_hidden = remove_hidden_agents(data, removed_agents);

    // compute the quartiles over the new seet of data
    let x_values = agents_not_hidden.map(a => a.x).sort(function(a, b) {
        return a - b
    });
    let y_values = agents_not_hidden.map(a => a.y).sort(function(a, b) {
        return a - b
    });

    let quantile_x = d3.quantile(x_values, 0.5);
    let quantile_y = d3.quantile(y_values, 0.5);

    let x_axis = xScale.domain();
    let y_axis = yScale.domain();

    let formatComma = d3.format(",");

    svg.append("line")
        .attr("x1", xScale(quantile_x))
        .attr("y1", yScale(y_axis[0]))
        .attr("x2", xScale(quantile_x))
        .attr("y2", yScale(y_axis[1]))
        .attr("id", function(d) {
            return divid + "___x_quartile";
        })
        .attr("stroke", "#0A58A2")
        .attr("stroke-width", 2)
        .style("stroke-dasharray", ("20, 5"))
        .style("opacity", 0.4)
        .on("mouseover", function(d) {
            div.transition()
                .duration(100)
                .style("display", "block")
                .style("opacity", .9);
            div.html("X quartile = " + formatComma(quantile_x))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY) + "px");
        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(1000)
                .style("display", "none")
                .style("opacity", 0);
        });

    svg.append("line")
        .attr("x1", xScale(x_axis[0]))
        .attr("y1", yScale(quantile_y))
        .attr("x2", xScale(x_axis[1]))
        .attr("y2", yScale(quantile_y))
        .attr("id", function(d) {
            return divid + "___y_quartile";
        })
        .attr("stroke", "#0A58A2")
        .attr("stroke-width", 2)
        .style("stroke-dasharray", ("20, 5"))
        .style("opacity", 0.4)
        .on("mouseover", function(d) {
            div.transition()
                .duration(100)
                .style("display", "block")
                .style("opacity", .9);
            div.html("Y quartile = " + formatComma(quantile_y))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY) + "px");
        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(1500)
                .style("display", "none")
                .style("opacity", 0);
        });


    //the tranformation to tabular format is done only if there are any table elements in the html file
    if (transform_to_table == true) {
        transform_sqr_classif_to_table(better, agents_not_hidden, quantile_x, quantile_y, divid, legend_color_palette, data, removed_agents);
    };

};

function transform_sqr_classif_to_table(better, data, quantile_x, quantile_y, divid, legend_color_palette, all_participants, removed_agents) {
    if (better == "bottom-right") {
        data.forEach(function(element) {
            if (element['x'] >= quantile_x && element['y'] <= quantile_y) {
                element['quartile'] = 1;
            } else if (element['x'] >= quantile_x && element['y'] > quantile_y) {
                element['quartile'] = 3;
            } else if (element['x'] < quantile_x && element['y'] > quantile_y) {
                element['quartile'] = 4;
            } else if (element['x'] < quantile_x && element['y'] <= quantile_y) {
                element['quartile'] = 2;
            }
        });
    } else if (better == "top-right") {
        data.forEach(function(element) {
            if (element['x'] >= quantile_x && element['y'] < quantile_y) {
                element['quartile'] = 3;
            } else if (element['x'] >= quantile_x && element['y'] >= quantile_y) {
                element['quartile'] = 1;
            } else if (element['x'] < quantile_x && element['y'] >= quantile_y) {
                element['quartile'] = 2;
            } else if (element['x'] < quantile_x && element['y'] < quantile_y) {
                element['quartile'] = 4;
            }
        });
    } else if (better == "top-left") {
        data.forEach(function(element) {
            if (element['x'] >= quantile_x && element['y'] < quantile_y) {
                element['quartile'] = 4;
            } else if (element['x'] >= quantile_x && element['y'] >= quantile_y) {
                element['quartile'] = 2;
            } else if (element['x'] < quantile_x && element['y'] >= quantile_y) {
                element['quartile'] = 1;
            } else if (element['x'] < quantile_x && element['y'] < quantile_y) {
                element['quartile'] = 3;
            }
        });
    }

    fill_in_table(divid, data, all_participants, removed_agents);
    set_cell_colors(divid, legend_color_palette, removed_agents);

};


function append_quartile_numbers_to_plot(svg, xScale, yScale, better, divid) {

    let x_axis = xScale.domain();
    let y_axis = yScale.domain();

    let num_bottom_right, num_bottom_left, num_top_right, num_top_left;
    // append quartile numbers to plot
    if (better == "bottom-right") {
        num_bottom_right = "1";
        num_bottom_left = "2";
        num_top_right = "3";
        num_top_left = "4";
    } else if (better == "top-right") {
        num_bottom_right = "3";
        num_bottom_left = "4";
        num_top_right = "1";
        num_top_left = "2";

    } else if (better == "top-left") {
        num_bottom_right = "4";
        num_bottom_left = "3";
        num_top_right = "2";
        num_top_left = "1";
    }


    svg.append("text")
        .attr("id", function(d) {
            return divid + "___num_bottom_right";
        })
        .attr("x", xScale(x_axis[1] - (0.05 * (x_axis[1] - x_axis[0]))))
        .attr("y", yScale(y_axis[1] - (0.97 * (y_axis[1] - y_axis[0]))))
        .style("opacity", 0.4)
        .style("font-size", "2vw")
        .style("fill", "#0A58A2")
        .text(num_bottom_right);

    svg.append("text")
        .attr("id", function(d) {
            return divid + "___num_bottom_left";
        })
        .attr("x", xScale(x_axis[1] - (0.98 * (x_axis[1] - x_axis[0]))))
        .attr("y", yScale(y_axis[1] - (0.97 * (y_axis[1] - y_axis[0]))))
        .style("opacity", 0.4)
        .style("font-size", "2vw")
        .style("fill", "#0A58A2")
        .text(num_bottom_left);

    svg.append("text")
        .attr("id", function(d) {
            return divid + "___num_top_right";
        })
        .attr("x", xScale(x_axis[1] - (0.05 * (x_axis[1] - x_axis[0]))))
        .attr("y", yScale(y_axis[1] - (0.1 * (y_axis[1] - y_axis[0]))))
        .style("opacity", 0.4)
        .style("font-size", "2vw")
        .style("fill", "#0A58A2")
        .text(num_top_right);

    svg.append("text")
        .attr("id", function(d) {
            return divid + "___num_top_left";
        })
        .attr("x", xScale(x_axis[1] - (0.98 * (x_axis[1] - x_axis[0]))))
        .attr("y", yScale(y_axis[1] - (0.1 * (y_axis[1] - y_axis[0]))))
        .style("opacity", 0.4)
        .style("font-size", "2vw")
        .style("fill", "#0A58A2")
        .text(num_top_left);

}

function get_diagonal_quartiles(data, svg, xScale, yScale, div, width, height, removed_agents, better, divid, transform_to_table, legend_color_palette) {

    let agents_not_hidden = remove_hidden_agents(data, removed_agents);

    let x_values = agents_not_hidden.map(a => a.x);
    let y_values = agents_not_hidden.map(a => a.y);

    // get distance to lowest score corner

    // normalize data to 0-1 range
    let normalized_values = normalize_data(x_values, y_values);
    let [x_norm, y_norm] = [normalized_values[0], normalized_values[1]];

    let max_x = Math.max.apply(null, x_values);
    let max_y = Math.max.apply(null, y_values);

    // # compute the scores for each of the agent. based on their distance to the x and y axis
    let scores = []
    let scores_coords = {}; //this object will store the scores and the coordinates
    for (let i = 0; i < x_norm.length; i++) {

        if (better == "bottom-right") {
            scores.push(x_norm[i] + (1 - y_norm[i]));
            scores_coords[x_norm[i] + (1 - y_norm[i])] = [x_values[i], y_values[i]];
            //append the score to the data array
            agents_not_hidden[i]['score'] = x_norm[i] + (1 - y_norm[i]);

        } else if (better == "top-right") {
            scores.push(x_norm[i] + y_norm[i]);
            scores_coords[x_norm[i] + y_norm[i]] = [x_values[i], y_values[i]];
            //append the score to the data array
            agents_not_hidden[i]['score'] = x_norm[i] + y_norm[i];

        } else if (better == "top-left") {
            scores.push(1 - x_norm[i] + y_norm[i]);
            scores_coords[(1 - x_norm[i]) + y_norm[i]] = [x_values[i], y_values[i]];
            //append the score to the data array
            agents_not_hidden[i]['score'] = (1 - x_norm[i]) + y_norm[i];
        }
    };

    // sort the scores and compute quartiles
    scores.sort(function(a, b) {
        return b - a
    });

    let first_quartile = d3.quantile(scores, 0.25);
    let second_quartile = d3.quantile(scores, 0.5);
    let third_quartile = d3.quantile(scores, 0.75);

    // compute the diagonal line coords
    let coords = [get_diagonal_line(scores, scores_coords, first_quartile, better, max_x, max_y, svg, xScale, yScale),
        get_diagonal_line(scores, scores_coords, second_quartile, better, max_x, max_y, svg, xScale, yScale),
        get_diagonal_line(scores, scores_coords, third_quartile, better, max_x, max_y, svg, xScale, yScale)
    ];

    // append the 3 lines to the svg
    let index = 0;

    coords.forEach(line => {
        let [x_coords, y_coords] = [line[0], line[1]];
        svg.append("line")
            .attr("clip-path", "url(#clip)")
            .attr("x1", xScale(x_coords[0]))
            .attr("y1", yScale(y_coords[0]))
            .attr("x2", xScale(x_coords[1]))
            .attr("y2", yScale(y_coords[1]))
            .attr("id", function(d) {
                return divid + "___diag_quartile_" + index;
            })
            .attr("stroke", "#0A58A2")
            .attr("stroke-width", 2)
            .style("stroke-dasharray", ("20, 5"))
            .style("opacity", 0.4)

        svg.append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        index += 1;
    });

    //the tranformation to tabular format is done only if there are any table elements in the html file
    if (transform_to_table == true) {
        transform_diag_classif_to_table(agents_not_hidden, first_quartile, second_quartile, third_quartile, divid, svg, xScale, yScale, legend_color_palette, data, removed_agents);
    };

};

function transform_diag_classif_to_table(data, first_quartile, second_quartile, third_quartile, divid, svg, xScale, yScale, legend_color_palette, all_participants, removed_agents) {

    let poly = [
        [],
        [],
        [],
        []
    ]
    data.forEach(function(element) {

        if (element['score'] > first_quartile) {
            element['quartile'] = 1;
            poly[0].push([element['x'], element['y']]);
        } else if (element['score'] > second_quartile && element['score'] <= first_quartile) {
            element['quartile'] = 2;
            poly[1].push([element['x'], element['y']]);
        } else if (element['score'] > third_quartile && element['score'] <= second_quartile) {
            element['quartile'] = 3;
            poly[2].push([element['x'], element['y']]);
        } else if (element['score'] <= third_quartile) {
            element['quartile'] = 4;
            poly[3].push([element['x'], element['y']]);
        }
    });
    let i = 1;
    poly.forEach(function(group) {

        var center = getCentroid(group);

        svg.append("text")
            .attr("class", function(d) {
                return divid + "___diag_num";
            })
            .attr("x", xScale(center[0]))
            .attr("y", yScale(center[1]))
            .style("opacity", 0.4)
            .style("font-size", "2vw")
            .style("fill", "#0A58A2")
            .text(i);
        i++;

    });

    fill_in_table(divid, data, all_participants, removed_agents);
    set_cell_colors(divid, legend_color_palette, removed_agents);

};

function getCentroid(coord) {
    var center = coord.reduce(function(x, y) {
        return [x[0] + y[0] / coord.length, x[1] + y[1] / coord.length]
    }, [0, 0])
    return center;
}

function normalize_data(x_values, y_values) {

    let maxX = Math.max.apply(null, x_values);
    let maxY = Math.max.apply(null, y_values);

    let x_norm = x_values.map(function(e) {
        return e / maxX;
    });

    let y_norm = y_values.map(function(e) {
        return e / maxY;
    });

    return [x_norm, y_norm];
};

function get_diagonal_line(scores, scores_coords, quartile, better, max_x, max_y, svg, xScale, yScale) {

    let target;
    for (let i = 0; i < scores.length; i++) {
        // # find out which are the two points that contain the percentile value

        if (scores[i] <= quartile) {
            target = [
                [scores_coords[scores[i - 1]][0], scores_coords[scores[i - 1]][1]],
                [scores_coords[scores[i]][0], scores_coords[scores[i]][1]]
            ];
            break;
        };
    };
    // # get the the mid point between the two, where the quartile line will pass
    let half_point = [(target[0][0] + target[1][0]) / 2, (target[0][1] + target[1][1]) / 2];

    // # draw the line depending on which is the optimal corner
    let x_coords;
    let y_coords;
    if (better == "bottom-right") {
        x_coords = [half_point[0] - 2 * max_x, half_point[0] + 2 * max_x];
        y_coords = [half_point[1] - 2 * max_y, half_point[1] + 2 * max_y];

    } else if (better == "top-right") {
        x_coords = [half_point[0] + 2 * max_x, half_point[0] - 2 * max_x];
        y_coords = [half_point[1] - 2 * max_y, half_point[1] + 2 * max_y];

    } else if (better == "top-left") {
        x_coords = [half_point[0] + 2 * max_x, half_point[0] - 2 * max_x];
        y_coords = [half_point[1] + 2 * max_y, half_point[1] - 2 * max_y];
    };

    return [x_coords, y_coords];
};

function remove_hidden_agents(data, removed_agents) {
    // remove from the data array the participants that the user has hidden (removed_agents)
    // create a new array where the agents that have not been hidden will be stored
    let agents_not_hidden = [];
    data.forEach(element => {
        let index = $.inArray(element.agentname.replace(/[\. ()/_]/g, "-"), removed_agents);
        if (index == -1) {
            agents_not_hidden.push(element);
        }
    });

    return agents_not_hidden;

};

function fill_in_table(divid, data, all_participants, removed_agents) {

    //create table dinamically
    var table = document.getElementById(divid + "_table");
    var row = table.insertRow(-1);
    row.insertCell(0).innerHTML = "<b>TOOL</b>";
    row.insertCell(1).innerHTML = "<b>QUARTILE</b>";

    all_participants.forEach(function(element) {
        var row = table.insertRow(-1);
        row.insertCell(0).innerHTML = element.agentname;
        //if the participant is not hidden the 2nd column is filled with the corresponding quartile
        // if not it is filled with --
        if ($.inArray(element.agentname.replace(/[\. ()/_]/g, "-"), removed_agents) == -1) {
            // var quartile;
            let obj = data.find(o => o.agentname.replace(/[\. ()/_]/g, "-") === element.agentname.replace(/[\. ()/_]/g, "-"));
            row.insertCell(1).innerHTML = obj.quartile;
        } else {
            row.insertCell(1).innerHTML = "--";
        }

        // add id
        var my_cell = row.cells[0];
        my_cell.id = divid + "___cell" + element.agentname.replace(/[\. ()/-]/g, "_");

        my_cell.addEventListener('click', function(d) {

            let ID = this.id;
            // trigger a click event on the legend rectangle (hide participant)
            let legend_rect = (divid + "___leg_rect" + ID.split("___cell")[1]);
            document.getElementById(legend_rect).dispatchEvent(new Event('click'));
        });

        my_cell.addEventListener('mouseover', function(d) {

            let ID = this.id;
            d3.select(this).style("cursor", "pointer");
            let legend_rect = (divid + "___leg_rect" + ID.split("___cell")[1]);

            if (d3.select(this).style("opacity") == 1 || d3.select(this).style("opacity") == 0.5) {
                $(this).css('opacity', 0.7);
                $(this).closest("tr").css('opacity', 0.7);
            } else {
                $(this).css('opacity', 1);
                $(this).closest("tr").css('opacity', 1);
            };

        });

        my_cell.addEventListener('mouseout', function(d) {

            let ID = this.id;
            d3.select(this).style("cursor", "default");
            let legend_rect = (divid + "___leg_rect" + ID.split("___cell")[1]);

            if (d3.select("#" + legend_rect).style("opacity") == 0.2 || d3.select("#" + legend_rect).style("opacity") == 0.5) {
                $(this).css('opacity', 0.5);
                $(this).closest("tr").css('opacity', 0.5);
            } else {
                $(this).css('opacity', 1);
                $(this).closest("tr").css('opacity', 1);
            };

        });

    });

};

function set_cell_colors(divid, legend_color_palette, removed_agents) {

    var agents = Object.keys(legend_color_palette);

    var cell = $("#" + divid + "_table td");

    cell.each(function() { //loop through all td elements ie the cells

        var cell_value = $(this).html(); //get the value
        if (cell_value == 1) { //if then for if value is 1
            $(this).css({
                'background': '#238b45'
            }); // changes td to red.
        } else if (cell_value == 2) {
            $(this).css({
                'background': '#74c476'
            });
        } else if (cell_value == 3) {
            $(this).css({
                'background': '#bae4b3'
            });
        } else if (cell_value == 4) {
            $(this).css({
                'background': '#edf8e9'
            });
        } else if (cell_value == "--") {
            $(this).css({
                'background': '#f0f0f5'
            });
        } else if ($.inArray(cell_value, agents) > -1 && $.inArray(cell_value.replace(/[\. ()/_]/g, "-"), removed_agents) == -1) {
            $(this).css({
                'background': 'linear-gradient(to left, white 92%, ' + legend_color_palette[cell_value] + ' 8%)'
            });
        } else if ($.inArray(cell_value.replace(/[\. ()/_]/g, "-"), removed_agents) > -1) {
            $(this).css({
                'background': 'linear-gradient(to left, white 92%, ' + legend_color_palette[cell_value] + ' 8%)',
                'opacity': 0.5
            });
            $(this).closest("tr").css('opacity', 0.5);
        } else {
            $(this).css({
                'background': '#FFFFFF'
            });
        };

        // lighten(' + legend_color_palette[cell_value] + ', 50%)

    });

};

function get_clusters(data, svg, xScale, yScale, div, width, height, removed_agents, better, divid, transform_to_table, legend_color_palette) {

    let agents_not_hidden = remove_hidden_agents(data, removed_agents);
    let x_values = agents_not_hidden.map(a => a.x);
    let y_values = agents_not_hidden.map(a => a.y);

    let coordinates = [];

    for (let i = 0; i < x_values.length; i++) {
        coordinates.push([x_values[i], y_values[i]]);
    };

    //number of clusters
    clusterMaker.k(4);

    //number of iterations (higher number gives more time to converge)
    clusterMaker.iterations(500);

    //data from which to identify clusters
    clusterMaker.data(coordinates);

    let results = clusterMaker.clusters();

    // normalize data to 0-1 range
    let centroids_x = []
    let centroids_y = []
    results.forEach(function(element) {
        centroids_x.push(element.centroid[0])
        centroids_y.push(element.centroid[1])
    });
    let [x_norm, y_norm] = normalize_data(centroids_x, centroids_y)

    // get distance from centroids to better corner

    let scores = [];
    if (better == "top-right") {

        for (let i = 0; i < x_norm.length; i++) {
            let distance = x_norm[i] + y_norm[i];
            scores.push(distance);
            results[i]['score'] = distance;
        };

    } else if (better == "bottom-right") {

        for (let i = 0; i < x_norm.length; i++) {
            let distance = x_norm[i] + (1 - y_norm[i]);
            scores.push(distance);
            results[i]['score'] = distance;
        };

    } else if (better == "top-left") {

        for (let i = 0; i < x_norm.length; i++) {
            let distance = (1 - x_norm[i]) + y_norm[i];
            scores.push(distance);
            results[i]['score'] = distance;
        };
    };

    let sorted_results = sortByKey(results, "score");

    sorted_results = print_clusters(svg, divid, xScale, yScale, sorted_results);

    //the tranformation to tabular format is done only if there are any table elements in the html file
    if (transform_to_table == true) {
        transform_clust_classif_to_table(agents_not_hidden, sorted_results, divid, legend_color_palette, data, removed_agents);
    };

};


function print_clusters(svg, divid, xScale, yScale, sorted_results) {

    let cluster_no = 1;

    var arrayOfPolygons = [];

    sorted_results.forEach(function(element) {

        var poly = [];

        element['cluster'] = cluster_no;
        svg.append("text")
            .attr("class", function(d) {
                return divid + "___cluster_num";
            })
            .attr("x", xScale(element.centroid[0]))
            .attr("y", yScale(element.centroid[1]))
            .style("opacity", 0.9)
            .style("font-size", "2vw")
            .style("fill", "#0A58A2")
            .text(cluster_no);
        let participants = element['points'];
        participants.forEach(function(coords) {

            poly.push([coords[0], coords[1]])
            svg.append("line")
                .attr("x1", xScale(element.centroid[0]))
                .attr("y1", yScale(element.centroid[1]))
                .attr("x2", xScale(coords[0]))
                .attr("y2", yScale(coords[1]))
                .attr("class", function(d) {
                    return divid + "___clust_lines";
                })
                .attr("stroke", "#0A58A2")
                .attr("stroke-width", 2)
                .style("stroke-dasharray", ("20, 5"))
                .style("opacity", 0.4)
        });

        var hull = d3Polygon.polygonHull(poly);

        arrayOfPolygons.push({
            "points": hull
        });

        cluster_no++;
    });

    svg.selectAll("polygon")
        .data(arrayOfPolygons)
        .enter().append("polygon")
        .attr("points", function(d) {
            if (d.points != null) {
                return d.points.map(function(d) {
                    return [xScale(d[0]), yScale(d[1])].join(",");
                }).join(" ");
            };
        })
        .attr("class", function(d) {
            return divid + "___clust_polygons";
        })
        .attr("fill", "#0A58A2")
        .style("opacity", 0.1);



    return (sorted_results);
};


function transform_clust_classif_to_table(data, results, divid, legend_color_palette, all_participants, removed_agents) {

    data.forEach(function(element) {

        let coords = [element.x, element.y];

        results.forEach(function(result) {

            if (isArrayInArray(result.points, coords) == true) {
                element['quartile'] = result.cluster;
            };

        });
    });

    fill_in_table(divid, data, all_participants, removed_agents);
    set_cell_colors(divid, legend_color_palette, removed_agents);

};


function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key];
        var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0)) * -1;
    });
};

function isArrayInArray(arr, item) {
    var item_as_string = JSON.stringify(item);

    var contains = arr.some(function(ele) {
        return JSON.stringify(ele) === item_as_string;
    });
    return contains;
};

export {
    loadurl,
    onQuartileChange
}


run_visualizer(challenge_names);
