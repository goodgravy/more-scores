Backbone._sync = Backbone.sync;
Backbone.sync = function(method, model, options) {
	// add extra jQuery.ajax options to make requests work with Parse
	options = options || {};
	var url = _.isFunction(model.url) ? model.url() : model.url;
	options.url = 'https://api.parse.com/1' + url;
	options.contentType = 'application/json';
	options.data = options.data || {};
	if (method === 'read') {
		options.data.limit = 1000;
	}
	var headers = options.headers || {};
	headers['X-Parse-Application-Id'] = MoreScores.config.appId;
	headers['X-Parse-REST-API-Key'] = MoreScores.config.restKey;
	options.headers = headers;
	return Backbone._sync.call(this, method, model, options);
};

MoreScores.Models.Result = Backbone.Model.extend({
	idAttribute: "objectId",
	parse: function(result) {
		if ("played" in result) {
			result.played = parseDateToDate(result.played);
		}

		function pullUsersOut(key) {
			var users = [];
			var index = 0;
			while (result[key+index]) {
				// XXX: should be able to do this, or something similar, when figured out relational queries
				// users.push(result[key+index]);
				users.push(MoreScores.Collections.users.get(result[key+index].objectId).toJSON())
				delete result[key+index];
				index += 1;
			}
			return users;
		}

		result.winners = pullUsersOut("winner");
		result.losers = pullUsersOut("loser");
		return result;
	},

	toJSON: function() {
		function toUserPointer(user) {
			return { "__type": "Pointer",
				"className": "User",
				"objectId": user.id
			}
		}
		var result = Backbone.Model.prototype.toJSON.call(this);
		result.played = dateToParseDate(result.played);
		
		result.winners.sort();
		result.losers.sort();

		_.each(result.winners, function(winner, index) {
			result["winner"+index] = toUserPointer(winner);
		});
		_.each(result.losers, function(loser, index) {
			result["loser"+index] = toUserPointer(loser);
		});

		delete result["winners"];
		delete result["losers"];
		return result;
	}
});
MoreScores.Models.User = Backbone.Model.extend({
	idAttribute: "objectId",
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
	url: '/classes/Result',
	model: MoreScores.Models.Result,

	parse: function(resp) {
		return resp.results;
	},

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
		function realUser(userJson) {
			// return existing user matching userJson, or create a new one in collection
			var newUser = new MoreScores.Models.User(userJson);
			user = MoreScores.Collections.users.get(newUser.id) || MoreScores.Collections.users.add(newUser);
			return user;
		}

		function teamPoints(users) {
			var points = _.reduce(users, function(memo, user) {
				var savedUser = realUser(user);
				return memo + (savedUser.get('points') || 0);
			}, 0);
			return Math.floor(points / users.length);
		}
		function processUserPoints(user, points, add) {
			var savedUser = realUser(user);
			var multiplier = add? 1: -1;
			savedUser.set({'points': (savedUser.get('points') || 0) + multiplier * points});
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

			MoreScores.Collections.users.each(function(user) {
				pointsObj[user.get('username')] = user.get('points');
			});

			result.set({'points': resultPoints});
			result.set({'userPoints': pointsObj});
		});
		that.trigger('new-scores', this);
	}
});

MoreScores.Collections.Users = Backbone.Collection.extend({
	url: '/users',
	model: MoreScores.Models.User,

	parse: function (resp) {
		return resp.results;
	},

	comparator: function(user) {
		return user.id;
	}
});

