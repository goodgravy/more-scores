MoreScores.Router = Backbone.Router.extend({
	routes: {
		"": "index",
		"result/add": "result_add",
		"result": "result",
		"user/:username": "user"
	},

	initialize: function (options) {
		this.appView = new AppView;
	},

	index: function() {
		var indexView = new MoreScores.Views.Index;
		this.appView.showView(indexView);
	},
	
	result: function() {
		var resultsView = new MoreScores.Views.Results({
			collection: MoreScores.Collections.results
		});
		this.appView.showView(resultsView);
		MoreScores.Collections.results.fetch();
	},

	result_add: function() {
		var resultAddView = new MoreScores.Views.ResultAdd({
			collection: MoreScores.Collections.results
		});
		this.appView.showView(resultAddView);
	},

	user: function(username) {
		var userInResult = function(username, result) {
			return _.contains(
					_(result.get('winners')).pluck('username'),
					username
				) ||
				_.contains(
					_(result.get('losers')).pluck('username'),
					username
				);
		}

		var resultsView = new MoreScores.Views.Results({
			collection: MoreScores.Collections.results,
			filterFn: function(result) {
				return userInResult(username, result);
			}
		});
		this.appView.showView(resultsView);
		MoreScores.Collections.results.fetch();
	}
});
