/* 575 boilerplate main.js */

(function() {

	console.log($(window).width());
	console.log($(window).height());

	// pseudo-global variables
	var csvData = 'data/studentDebtRenamedFields.csv';
	var geoData = 'data/50Reshaped.topojson';
	var width = $(window).width()*.7;
	var height = $(window).height() * .7;
	var chartWidth = $(window).width()*.7;
	var chartHeight = $(window).height() * .2,
	    leftPadding = 45,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    var dataMin = 0;
    var dataMax = 35000;

	var yScale = d3.scale.linear()
			.range([0, chartHeight])
			.domain([dataMin, dataMax]);

	var axisScale = d3.scale.linear()
		.range([0, chartHeight])
		.domain([dataMax, dataMin]);

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

			createDropdown(csvData);

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
			"#edf8e9",
			"#bae4b3",
			"#74c476",
			"#31a354",
			"#006d2c"
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

		var statesUS = map.selectAll('.states')
	        .data(states)
	        .enter()
	        .append("path")
	        .attr("class", function(d) {
	            return 'states ' + d.properties.name;
	        })
	        .attr("d", path)
	        .style('fill', function(d) {
	        	return colorScale(d.properties[expressed]);
	        })
	        .on('mouseover', function(d) {
	        	highlight(d.properties.name, d.properties);
	        })
	        .on('mouseout', function(d) {
	        	dehighlight(d.properties.name);
	        })
	        .on('mousemove', moveLabel);
	};

	function setChart(csvData, colorScale) {

		var chart = d3.select('#chartContainer')
			.append('svg')
			.attr('width', chartWidth)
			.attr('height', chartHeight)
			.attr('class', 'chart pull-right');

		var chartBackground = chart.append("rect")
	        .attr("class", "chartBackground")
	        .attr("width", chartInnerWidth)
	        .attr("height", chartInnerHeight)
	        .attr("transform", translate);

		var bars = chart.selectAll('.bar')
			.data(csvData)
			.enter()
			.append('rect')
			.sort(function(a, b) {
				if(isNaN(a[expressed])) {
					return 1;
				};
				return b[expressed] - a[expressed];
			})
			.attr('class', function(d) {
				return 'bar ' + d.State;
			})
			.attr('width', chartInnerWidth/csvData.length - 1)
			.on('mouseover', function(d) {
				highlight(d.State, d);
			})
			.on('mouseout', function(d) {
	        	dehighlight(d.State);
	        })
	        .on('mousemove', moveLabel);

		updateChart(bars, csvData.length, colorScale);

	};

	function createDropdown(csvData) {
		var options = d3.select('.dropdown')
			.on('change', function() {
				changeAttribute(this.value, csvData);
			})
			.selectAll('options')
			.data(csvAttributeArray)
			.enter()
			.append('option')
			.attr('value', function(d) {
				return d;
			})
			.text(function(d) {
				var expressedVariable = d.split('_');
				var optionText = expressedVariable[0][0].toUpperCase() + expressedVariable[0].slice(1);
				for(var i = 1; i < expressedVariable.length; i++) {
					optionText += " " + expressedVariable[i];
				}
				return optionText;

			});
	};

	function updateAxis() {

		console.log(dataMax)

		axisScale = d3.scale.linear()
			.range([0, chartHeight])
			.domain([dataMax, dataMin]);

    	var yAxis = d3.svg.axis()
	        .scale(axisScale)
	        .orient("left");

		d3.select('.axis')
			.remove();	        

	    var axis = d3.select('.chart')
	    	.append("g")
	        .attr("class", "axis")
	        .attr('transform', translate)
	        .call(yAxis);

	};

	function changeAttribute(attribute, csvData) {

		expressed = attribute;

		var colorScale = makeColorScale(csvData);

		var statesUS = d3.selectAll('.states')
			.transition()
			.duration(1000)
	        .style('fill', function(d) {
	        	return colorScale(d.properties[expressed]);
	        });

	    var bars = d3.selectAll('.bar')
	    	.sort(function(a, b) {
				if(isNaN(a[expressed])) {
					return 1;
				};
				// console.log(a[expressed])
				return b[expressed] - a[expressed];
			})
			.transition()
			.delay(function(d, i) {
				return i * 11;
			})
			.duration(250);

	    dataMax = d3.max(csvData, function(d) { return parseFloat(d[expressed]); })

	    updateChart(bars, csvData.length, colorScale);
	};

	function updateChart(bars, n, colorScale) {

		var yScale = d3.scale.linear()
			.range([0, chartHeight])
			.domain([dataMin, dataMax]);

		bars.attr('x', function(d, i) {
				return i * (chartInnerWidth/n) + leftPadding;
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

		updateAxis();

		var chartTitle = d3.select("#chartTitle")
	        .text(function() {
				var expressedVariable = expressed.split('_');
				var optionText = expressedVariable[0][0].toUpperCase() + expressedVariable[0].slice(1);
				for(var i = 1; i < expressedVariable.length; i++) {
					optionText += " " + expressedVariable[i];
				}
				return optionText;

			});
	};


function setLabel(state, props) {

		var expressedVariable = expressed.split('_');
		state = state.replace('_', ' ');
		var labelAttribute = '<h4>' + state + ' '+ expressedVariable[0][0].toUpperCase() + expressedVariable[0].slice(1);

		for(var i = 1; i < expressedVariable.length; i++) {
			labelAttribute += " " + expressedVariable[i][0].toUpperCase() + expressedVariable[i].slice(1);
		};

		labelAttribute  += '</h4><p>' + props[expressed] + '</p>';

		var infolabel = d3.select('#content')
			.append('div')
			.attr({
				'class': 'infolabel',
				'id': state + '_label'
			})
			.html(labelAttribute);

	};
	function highlight(state, props) {
		var selected = d3.selectAll('.' + state)
			.style({
				'stroke': '#00c24e',
				'stroke-width': '3'
			});

		setLabel(state, props);
	};

	function dehighlight(state) {
		var selected = d3.selectAll('.' + state)
			.style({
				'stroke': '#e5e5e5',
				'stroke-width': '.5px'
			});

		d3.select('.infolabel')
			.remove();
	};

	function moveLabel() {

		var labelWidth = d3.select('.infolabel')
			.node()
			.getBoundingClientRect()
			.width;

		var x1 = d3.event.clientX + 10;
		var y1 = d3.event.clientY - 75;
		var x2 = d3.event.clientX - labelWidth - 10;
		var y2 = d3.event.clientY + 25;

		var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;

		var y = d3.event.clientY < 75 ? y2 : y1; 

		d3.select('.infolabel') 
			.style({
				'left': x + 'px',
				'top': y + 'px'
			});
	}



})();

