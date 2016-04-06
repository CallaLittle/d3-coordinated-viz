/* 575 boilerplate main.js */

(function() {

	// pseudo-global variables
	var csvData = 'data/studentDebtRenamedFields.csv';
	var geoData = 'data/50Reshaped.topojson';
	var width = window.innerWidth * 0.5;
	var height = 550;
	var chartWidth = window.innerWidth * 0.425;
	var chartHeight = height,
	    leftPadding = 45,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

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

			var colorScale = makeColorScale(csvData);

			drawStates(map, states, path, colorScale);

			setChart(csvData, colorScale);

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

					});

				};

			};
		};

	};

	function makeColorScale(csvData) {

		var colorClasses = [
			"#D4B9DA",
	        "#C994C7",
	        "#DF65B0",
	        "#DD1C77",
	        "#980043"
		];

		var colorScale = d3.scale.quantile()
			.range(colorClasses);

		// var domainArray = [];

		// for(var i = 0; i < csvData.length; i++) {
		// 	var val = parseFloat(csvData[i][expressed]);
		// 	domainArray.push(val);
		// };

		// var clusters = ss.ckmeans(domainArray, 5);
		// console.log(clusters)

		// domainArray = clusters.map(function(d) {
		// 	return d3.min(d);
		// });

		// domainArray.shift();

		// colorScale.domain(domainArray);

		var minmax = [
	        d3.min(csvData, function(d) { return parseFloat(d[expressed]); }),
	        d3.max(csvData, function(d) { return parseFloat(d[expressed]); })
	    ];
	    //assign two-value array as scale domain
	    colorScale.domain(minmax);

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
	        	return colorScale(d.properties[expressed]);
	        });
	};

	function setChart(csvData, colorScale) {

		var chart = d3.select('#content')
			.append('svg')
			.attr('width', chartWidth)
			.attr('height', chartHeight)
			.attr('class', 'chart');
			//.attr('class', 'chart pull-right');

		var chartBackground = chart.append("rect")
	        .attr("class", "chartBackground")
	        .attr("width", chartInnerWidth)
	        .attr("height", chartInnerHeight)
	        .attr("transform", translate);

		var yScale = d3.scale.linear()
			.range([0, chartHeight])
			.domain([0, 35000]);

		var bars = chart.selectAll('.bars')
			.data(csvData)
			.enter()
			.append('rect')
			.sort(function(a, b) {
				if(isNaN(a[expressed])) {
					return 1;
				};
				//console.log(a[expressed])
				return b[expressed] - a[expressed];
			})
			.attr('class', function(d) {
				return 'bars ' + d.State;
			})
			.attr('width', chartInnerWidth/csvData.length - 1)
			.attr('x', function(d, i) {
				return i * (chartInnerWidth/csvData.length) + leftPadding;
			})
			.attr('height', function(d) {
				if(isNaN(d[expressed])) {
					return 0;
				};
				return yScale(parseFloat(d[expressed]));
			})
			.attr('y', function(d) {
				if(isNaN(d[expressed])) {
					return 0;
				};
				return (chartHeight - yScale(parseFloat(d[expressed]))) + topBottomPadding;
			})
			.style('fill', function(d) {
				return colorScale(d[expressed]);
			});

		var axisScale = d3.scale.linear()
			.range([0, chartHeight])
			.domain([35000, 0]);

    	var yAxis = d3.svg.axis()
	        .scale(axisScale)
	        .orient("left");

	    var axis = chart.append("g")
	        .attr("class", "axis")
	        .attr('transform', translate)
	        .call(yAxis);

	    var chartTitle = chart.append("text")
	        .attr("x", 130)
	        .attr("y", 40)
	        .attr("class", "chartTitle")
	        .text(function() {
	        	var expressedVariable = expressed.split('_');
	        	return expressedVariable[0][0].toUpperCase() + expressedVariable[0].slice(1) + " student " + expressedVariable[1] + " in each state";
	    	});

	};

})();

