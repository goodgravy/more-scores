MoreScores.Models.Result = Backbone.Model.extend({
	parse: function(result) {
		result.played = isoStringToDate(result.played);
		return result;
	},

	toJSON: function() {
		var result = Backbone.Model.prototype.toJSON.call(this);
		result.played = dateToIsoString(result.played);
		return result;
	}
});
MoreScores.Models.User = Backbone.Model.extend({
	defaults: {
		points: 0
	}
});

function rationalTanh(x) {
	// http://stackoverflow.com/questions/6118028/fast-hyperbolic-tangent-approximation-in-javascript
	if ( x < -3 ) {
		return -1;
	} else if( x > 3 ) {
		return 1;
	} else {
		return x * ( 27 + x * x ) / ( 27 + 9 * x * x );
	}
}

function calculatePoints(pointsDiff) {
	// based on difference between players scores, how many points should a particular
	// result be worth
	// 0 <= result <= 100

	// negative to cause bigger diff to result in smaller points
	var scaledDiff = pointsDiff / -1000;
	return Math.floor ( ( rationalTanh(scaledDiff) + 1 ) * 50 )
}

MoreScores.Collections.Results = Backbone.Collection.extend({
	url: '/result',
	model: MoreScores.Models.Result,

	comparator: function(result) {
		return result.get('played');
	},
	
	fetch: function() {
		// idea here is for score re-calculation to only occur after
		// we've done a fetch-and-reset - not a plain call to .reset()
		var that = this;
		this.on('reset', scoreResults, this);
		Backbone.Collection.prototype.fetch.call(this);
		
		function scoreResults () {
			that.off('reset');
			function teamPoints(users) {
				var points = _.reduce(users, function(memo, user) {
					var user = MoreScores.Collections.users.get(user.id) ||
						new MoreScores.Models.User(user);
					return memo + (user.get('points') || 0);
				}, 0);
				return Math.floor(points / users.length);
			}
			function processUserPoints(user, points, add, pointsAggr) {
				var user = MoreScores.Collections.users.get(user.id) ||
					new MoreScores.Models.User(user);
				var multiplier = add? 1: -1;
				user.set('points',
						(user.get('points') || 0) + multiplier * points);
				pointsAggr[user.get('username')] = user.get('points');
			}

			that.each(function(result) {
				if(result.get('points')) {
					// already scored this result
					return;
				}
				var winnerPoints = teamPoints(result.get('winners'));
				var loserPoints = teamPoints(result.get('losers'));
				var pointsDiff = winnerPoints - loserPoints;
				var resultPoints = calculatePoints(pointsDiff);
				var pointsObj = {};

				_.each(result.get('winners'), function(user) {
					processUserPoints(user, resultPoints, true, pointsObj);
				});
				_.each(result.get('losers'), function(user) {
					processUserPoints(user, resultPoints, false, pointsObj);
				});
				result.set('points', resultPoints);
				result.set('userPoints', pointsObj);
				console.log(result.get('played')+': '+JSON.stringify(pointsObj));
			});
			that.trigger('new-scores', this);
		}
	},


	toDataTableJSON: function() {
		var cols = [{id: "played", label: "played", type: "date"}];
		MoreScores.Collections.users.each(function(user) {
			cols.push({
				id: user.get('username'),
				label: user.get('first_name'),
				type: "number"
			});
		});

		var rows = [];
		this.each(function(result) {
			var row = {c:[{
				v: result.get('played'),
				f: result.get('played')
			}]};
			MoreScores.Collections.users.each(function(user) {
				if (user.get('username') in result.get('userPoints')) {
					row.c.push({
						v: result.get('userPoints')[user.get('username')]
					});
				} else {
					row.c.push(null);
				}
			});
			rows.push(row);
		});
		return {cols: cols, rows: rows}
	}
});

MoreScores.Collections.Users = Backbone.Collection.extend({
	url: '/user',
	model: MoreScores.Models.User
});

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
		(date.getMonth() + 1) + '-' +
		date.getDate() + ' ' +
		date.getHours() + ':' +
		date.getMinutes() + ':' +
		date.getSeconds();
	return isoString;
}
