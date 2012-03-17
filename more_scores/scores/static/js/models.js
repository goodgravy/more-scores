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
	return Math.floor ( ( rationalTanh(scaledDiff) + 1 ) * 50 );
}

MoreScores.Collections.Results = Backbone.Collection.extend({
	url: '/result',
	model: MoreScores.Models.Result,

	comparator: function(result) {
		return result.get('played');
	},

	fetch: function() {
		Backbone.Collection.prototype.fetch.call(this, {
			success: function(collection) {
				collection._scoreResults();
			}
		});
	},
	
	_scoreResults: function () {
		var that = this;

		// first reset the user scores: will be re-calculating them
		MoreScores.Collections.users.each(function (user) {
			user.set({'points': 0});
		});

		function teamPoints(users) {
			var points = _.reduce(users, function(memo, user) {
				var savedUser = MoreScores.Collections.users.get(user.id);
				if (!savedUser) {
					savedUser = MoreScores.Collections.users.add(user);
				}
				return memo + (savedUser.get('points') || 0);
			}, 0);
			return Math.floor(points / users.length);
		}
		function processUserPoints(user, points, add, pointsAggr) {
			var savedUser = MoreScores.Collections.users.get(user.id);
			if (!savedUser) {
				savedUser = MoreScores.Collections.users.add(user);
			}
			var multiplier = add? 1: -1;
			savedUser.set({'points': (savedUser.get('points') || 0) + multiplier * points});
			pointsAggr[savedUser.get('username')] = savedUser.get('points');
		}

		that.each(function(result) {
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
			result.set({'points': resultPoints});
			result.set({'userPoints': pointsObj});
		});
		that.trigger('new-scores', this);
	}
});

MoreScores.Collections.Users = Backbone.Collection.extend({
	url: '/user',
	model: MoreScores.Models.User,

	comparator: function(user) {
		return user.id;
	}
});

