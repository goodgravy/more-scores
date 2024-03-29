function pad(number, length) {
	var str = '' + number;
	while (str.length < length) {
		str = '0' + str;
	}
	return str;
}

function isoStringToDate(string) {
	var isoDate = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/;
	var match = isoDate.exec(string);
	if (!match) {
		throw {type: 'TypeError', message: string+' is not an ISO-formatted string'}
	}
	return new Date(match[1], match[2] - 1, match[3], match[4], match[5], match[6]);
}
function dateToIsoString(date) {

	var isoString = date.getFullYear() + '-' +
		pad((date.getMonth() + 1), 2) + '-' +
		pad(date.getDate(), 2) + ' ' +
		pad(date.getHours(), 2) + ':' +
		pad(date.getMinutes(), 2) + ':' +
		pad(date.getSeconds(), 2);
	return isoString;
}
function percentToSpectrum (percent) {
	// translate a 0..100 value to a HSL color value
	return "hsl(210, "+percent+"%, "+(100-percent/2)+"%)";
}
function toDataTableJSON (results, users) {
	var cols = [
		{id: "played", label: "Played", type: "date"},
	];
	users.each(function(user) {
		cols.push({
			id: user.get('username'),
			label: user.get('first_name'),
			type: "number"
		});
	});
	// points column last
	cols.push(
		{id: "points", label: "Points", type: "number"}
	);

	// pre-process results into chunks of 1 day, to allow even spacing across days
	var daysResults = {};
	// can't use _.each as it doesn't work for collections!?
	results.forEach(function(result) {
		var played = result.get('played');
		var playedDate = [played.getFullYear(), played.getMonth(), played.getDate()].join("-");
		daysResults[playedDate] = daysResults[playedDate] || [];
		daysResults[playedDate].push(result);
	});

	// for each chunk, space the results out evenly across the day
	function processDaysResults (day, results) {
		var daysResults = [];
		var yearMonthDate = day.split("-");
		var spacing = Math.floor(24.0 / results.length);

		_.each(results, function(result, index) {
			var resultPoints = result.get('userPoints') || {};
			var artificialTime = new Date(
				yearMonthDate[0],
				yearMonthDate[1],
				yearMonthDate[2],
				spacing * index
			);
			var row = {c:[
				{
					v: artificialTime,      // time as used on graph
					f: dateToIsoString(result.get('played')) // time as displayed
				}
			]};
			users.each(function(user) {
				if (user.get('username') in resultPoints) {
					var cell = { v: resultPoints[user.get('username')] };
					// XXX: need to manually add-in google classes, to avoid overwriting :/
					if (_.contains(_.pluck(result.get('winners'), 'username'), user.get('username'))) {
						cell.p = {className: 'google-visualization-table-td google-visualization-table-td-number winner'};
					} else if (_.contains(_.pluck(result.get('losers'), 'username'), user.get('username'))) {
						cell.p = {className: 'google-visualization-table-td google-visualization-table-td-number loser'};
					}
				} else {
					cell = { v: null };
				}
				row.c.push(cell);
			});
			row.c.push(
				{
					v: result.get('points'),
					p: {style: "background-color: "+percentToSpectrum(result.get('points'))+";"}
				}
			);
			daysResults.push(row);
		});
		return daysResults;
	}

	var rows = [];
	for (var day in daysResults) {
		if (daysResults.hasOwnProperty(day)) {
			var results = daysResults[day];
			rows = rows.concat(processDaysResults(day, results));
		}
	}
	return {cols: cols, rows: rows}
}
