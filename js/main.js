/* 575 boilerplate main.js */

//global variables
var csvData = 'data/studentDebtRenamedFields.csv';
var geoData = 'data/50Reshaped.topojson';
var width = 960;
var height = 460;


window.onload = setMap();

function setMap() {

	var map = d3.select('body')
		.append('svg')
		.attr('class', map)
		.attr('width', width)
		.attr('height', height);

	var projection = d3.geo.albers()
		.center([-98.555319, 39.808801])
		.rotate([-2, 0, 0])
		.parallels([33.471773, 44.031051])
		.scale(2500)
		.translate([width/2, height/2]);

	var path = d3.geo.path()
        .projection(projection);

	d3_queue.queue()
		.defer(d3.csv, csvData)
		.defer(d3.json, geoData)
		.await(callback);

	function callback(error, csvData, geoData) {
		var states = topojson.feature(geoData, geoData.objects.ne_50m_admin_1_states_provinces_lakes).features;
		console.log(states);

		var statesUS = map.append("path")
            .datum(states)
            .attr("class", "states")
            .attr("d", path);
	};
};

