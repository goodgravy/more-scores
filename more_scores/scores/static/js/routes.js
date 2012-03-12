MoreScores.Router = Backbone.Router.extend({

	routes: {
		"": "index",
		"result/add": "result_add",
		"result": "result",
		"user/:username": "user"
	},

	index: function() {
		var indexView = new MoreScores.Views.Index;
		indexView.show();
	},
	
	result: function() {
		if (!this.resultsView) {
			this.resultsView = new MoreScores.Views.Results({
				collection: MoreScores.Collections.results
			});
		}
		this.resultsView.show();
		MoreScores.Collections.results.fetch();
	},

	result_add: function() {
		var resultAddView = new MoreScores.Views.ResultAdd({
			collection: MoreScores.Collections.results
		});
		resultAddView.show();
	},

	user: function(username) {
		var userInResult = function(username, result) {
			return _.contains(
					_(result.get('winner').users).pluck('username'),
					username
				) ||
				_.contains(
					_(result.get('loser').users).pluck('username'),
					username
				);
		}

		var resultsView = new MoreScores.Views.Results({
			collection: MoreScores.Collections.results,
			filterFn: function(result) {
				return userInResult(username, result);
			}
		});
		MoreScores.Collections.results.fetch();
		resultsView.show();
	},
});
