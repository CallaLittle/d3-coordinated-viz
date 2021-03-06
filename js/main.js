
(function() {

	// pseudo-global variables
	var csvData = 'data/studentDebtRenamedFields.csv';
	var geoData = 'data/50Reshaped.topojson';
	var width = $(window).width() *.8;
	//var height = $(window).height() * .45;
	var height = width *.45
	var chartWidth = $(window).width();
	var chartHeight = $(window).height() * .18,
	    leftPadding = 70,
        rightPadding = 2,
		topPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topPadding * 2,
        translate = "translate(" + leftPadding + "," + topPadding + ")";

    var dataMin = 0;
    var dataMax = 35000;

	var yScale = d3.scale.linear()
			.range([0, chartHeight])
			.domain([dataMin, dataMax]);

	var axisScale = d3.scale.linear()
		.range([0, chartHeight + topPadding])
		.domain([dataMax, dataMin]);

	var csvAttributeArray = ['average_debt', 'average_tuition', 'default_rate', 'five_year_tuition_change', 'median_income', 'percent_with_debt', 'unemployment_rate'];

	var expressed = csvAttributeArray[0];

	window.onload = setMap();


	//Define the map parameters and create the map container
	function setMap() {

		var map = d3.select('#content')
			.append('svg')
			.attr('class', 'map')
			.attr('width', width )
			.attr('height', height);

		var projection = d3.geo.albersUsa()
	        .scale(width)
	        .translate([width / 2, height / 2]);

		var path = d3.geo.path()
	        .projection(projection);

		d3_queue.queue()
			.defer(d3.csv, csvData)
			.defer(d3.json, geoData)
			.await(callback);

		//access data, call rest of functions
		function callback(error, csvData, geoData) {

			var states = topojson.feature(geoData, geoData.objects.ne_50m_admin_1_states_provinces_lakes).features;

			joinData(states, csvData);

			var colorScale = makeColorScale(csvData);

			drawStates(map, states, path, colorScale);

			setChart(csvData, colorScale);

			createDropdown(csvData);

		};
	};


	//join csv with topojson
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


	//create a color scale for the map
	function makeColorScale(csvData) {

		// var colorClasses = [
		// 	"#edf8fb",
		// 	"#b2e2e2",
		// 	"#66c2a4",
		// 	"#2ca25f",
		// 	"#006d2c"
		// ];

		var colorClasses = [
			"#DAF0B1",
			"#CADEA4",
			"#B2C491",
			"#909E75",
			"#565E46"
		];

		var colorScale = d3.scale.quantile()
			.range(colorClasses);

		var minmax = [
	        d3.min(csvData, function(d) { return parseFloat(d[expressed]); }),
	        d3.max(csvData, function(d) { return parseFloat(d[expressed]); })
	    ];

	    colorScale.domain(minmax);

		return colorScale;

	};


	//draw the map enumeration units
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


	//create the chart container and draw the bars
	function setChart(csvData, colorScale) {

		var chart = d3.select('#chartContainer')
			.append('svg')
			.attr('width', chartWidth)
			.attr('height', chartHeight + 20)
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


	//create dropdown for variable selection
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



	//change the coloring of the map enumeration units to match selected attribute
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


	//change the coloring of the bars to match selected attribute
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
				return (chartHeight - yScale(parseFloat(d[expressed]))) + topPadding;
			})
			.style('fill', function(d) {
				return colorScale(d[expressed]);
			});

		updateAxis();

		updateChartTitle();

		// var chartTitle = d3.select("#chartTitle")
	 //        .text(function() {
		// 		var expressedVariable = expressed.split('_');
		// 		var optionText = expressedVariable[0][0].toUpperCase() + expressedVariable[0].slice(1);
		// 		for(var i = 1; i < expressedVariable.length; i++) {
		// 			optionText += " " + expressedVariable[i];
		// 		}
		// 		return optionText;

		// 	});
	};

	//update the chart axis to reflect current data values
	function updateAxis() {

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
	
	//update the title of the chart according to selected attribute
	function updateChartTitle() {

		var chartTitleArray = [
			'Average Student Debt',
			'Average Yearly Tuition',
			'Loan Default Rate',
			'Five Year Change in Tuition',
			'Household Median Income',
			'Percent of Graduating Seniors with Debt',
			'State Unemployment Rate'
		];

		var expressedIndex;

		for(var i = 0; i < csvAttributeArray.length; i++) {
			if(expressed == csvAttributeArray[i]) {
				expressedIndex = i;
			};
		};

		console.log(expressedIndex)

		var chartTitle = d3.select("#chartTitle")
	        .text(function() {
				return chartTitleArray[expressedIndex];
			});
	};


	//determine highlight appearance
	function highlight(state, props) {
		var selected = d3.selectAll('.' + state)
			.style({
				'stroke': '#b5e5e5e',
				'stroke-width': '4'
			});

		setLabel(state, props);
	};

	//create the pop up label
	function setLabel(state, props) {

		var expressedVariable = expressed.split('_');
		state = state.replace('_', ' ');
		var labelAttribute = '<h4>' + state + '</h4><p>'+ expressedVariable[0][0].toUpperCase() + expressedVariable[0].slice(1);

		for(var i = 1; i < expressedVariable.length; i++) {
			labelAttribute += " " + expressedVariable[i][0].toUpperCase() + expressedVariable[i].slice(1);
		};

		var value = props[expressed];

		if(isNaN(value)) {
			value = "No Data";
		};

		labelAttribute  += ': ' + value + '</p>';

		var infolabel = d3.select('#content')
			.append('div')
			.attr({
				'class': 'infolabel',
				'id': state + '_label'
			})
			.html(labelAttribute);

	};




	//return feature to default appearance
	function dehighlight(state) {
		var selected = d3.selectAll('.' + state)
			.style({
				'stroke': '#FFF',
				'stroke-width': '1px'
			});

		d3.select('.infolabel')
			.remove();
	};


	//move label with mouse during mouse over
	function moveLabel() {

		var labelWidth = d3.select('.infolabel')
			.node()
			.getBoundingClientRect()
			.width;

		var mapWidth = d3.select('#content')
			.node()
			.getBoundingClientRect()
			.width;

		var x1 = d3.event.clientX + 10;
		var y1 = d3.event.clientY - 75;
		var x2 = d3.event.clientX - labelWidth - 10;
		var y2 = d3.event.clientY + 25;

		//console.log(d3.event.clientX)
		console.log(d3.event.clientY)

		var x = d3.event.clientX > mapWidth - labelWidth - 20 ? x2 : x1;

		var y = d3.event.clientY < 170 ? y2 : y1; 

		d3.select('.infolabel') 
			.style({
				'left': x + 'px',
				'top': y + 'px'
			});
	}



})();

