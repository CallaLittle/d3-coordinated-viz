/* 575 boilerplate main.js */

//global variables
var csvData = 'data/studentDebtRenamedFields.csv';
var geoData = 'data/50Reshaped.topojson';
var width = 730;
var height = 470;


window.onload = setMap();

function setMap() {

	var map = d3.select('#content')
		.append('svg')
		.attr('class', 'map')
		.attr('width', width)
		.attr('height', height);

	// var projection = d3.geo.albers()
	// 	.center([1.82, 34.51])
	// 	.rotate([99.18, -5.45, 0])
	// 	.parallels([33.471773, 44.031051])
	// 	.scale(806.07)
	// 	.translate([width/2, height/2]);

	var projection = d3.geo.albersUsa()
        .scale(1000)
        .translate([width / 2, height / 2]);

	var path = d3.geo.path()
        .projection(projection);

	d3_queue.queue()
		.defer(d3.csv, csvData)
		.defer(d3.json, geoData)
		.await(callback);

	function callback(error, csvData, geoData) {
		var states = topojson.feature(geoData, geoData.objects.ne_50m_admin_1_states_provinces_lakes).features;
		console.log(states);

		var statesUS = map.selectAll('.states')
            .data(states)
            .enter()
            .append("path")
            .attr("class", function(d) {
            	return d.properties.name;
            })
            .attr("d", path);

        console.log(states);
	};
};

