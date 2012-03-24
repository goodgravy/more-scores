function isoStringToDate(dateStr) {
	var iosRE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;
	var match = iosRE.exec(dateStr);
	if (match) {
		// looks like a date - parse and instantiate a useful object
		return new Date(
			match[1], // year
			Number(match[2]) - 1, // zero-indexed month
			match[3],
			match[4],
			match[5],
			match[6]
		);
	} else {
		return dateStr;
	}
}

function drawChart() {
	var data = new google.visualization.DataTable();
	$.getJSON('/results', function(response) {
		for (var i=0; i<response.headers.length; i++) {
			data.addColumn(response.headers[i] === "date"? "date": "number", response.headers[i]);	
		}
		
		for (var j=0; j<response.data.length; j++) {
			for (var k=0; k<response.data[j].length; k++) {
				// convert dates, leaving non-dates alone
				response.data[j][k] = isoStringToDate(response.data[j][k]);
			}
			data.addRow(response.data[j]);
		}
		var chart = new google.visualization.AnnotatedTimeLine($('#chart_div').get(0));
		chart.draw(data);
	});
}