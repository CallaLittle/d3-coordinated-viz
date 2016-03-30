/* 575 boilerplate main.js */

(function() {

	// pseudo-global variables
	var csvData = 'data/studentDebtRenamedFields.csv';
	var geoData = 'data/50Reshaped.topojson';
	var width = 730;
	var height = 470;
	var csvAttributeArray = ['average_debt', 'average_tuition', 'default_rate', 'five_year_tuition_change', 'median_income', 'percent_with_debt', 'unemployment_rate'];
	var expressed = csvAttributeArray[0];


	window.onload = setMap();

	function setMap() {

		var map = d3.select('#content')
			.append('svg')
			.attr('class', 'map')
			.attr('width', width)
			.attr('height', height);

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

			joinData(states, csvData);

			var colorScale = makeColorScale();

			drawStates(map, states, path, colorScale);

		};
	};

	function joinData(states, csvData) {

		for(var i = 0; i < csvData.length; i++) {

			var csvLocation = csvData[i];
			var	csvState = csvData[i].State;

			for(var j = 0; j < states.length; j++) {

				var jsonProps = states[j].properties
				var jsonState = states[j].properties.name;

				if(csvState == jsonState) {
						
					csvAttributeArray.forEach(function(attr) {

						var val = parseFloat(csvLocation[attr]);
						jsonProps[attr] = val;
						console.log(true)

					});

				};

			};
		};

	};

	function makeColorScale() {

		var colorClasses = [
			"#D4B9DA",
	        "#C994C7",
	        "#DF65B0",
	        "#DD1C77",
	        "#980043"
		];

		var colorScale = d3.scale.quantile()
			.range(colorClasses);

		var domainArray = [];
		for(var i = 0; i < csvData.length; i++) {
			var val = parseFloat(csvData[i][expressed]);
			domainArray.push(val);
		};

		colorScale.domain(domainArray);

		return colorScale;

	};

	function drawStates(map, states, path, colorScale) {

		//console.log(states);
		var statesUS = map.selectAll('.states')
	        .data(states)
	        .enter()
	        .append("path")
	        .attr("class", function(d) {
	            return d.properties.name;
	        })
	        .attr("d", path)
	        .style('fill', function(d) {
	        	console.log(d.properties[expressed]);
	        	return colorScale(d.properties[expressed]);
	        });
	};

})();

