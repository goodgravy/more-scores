MoreScores.Router = Backbone.Router.extend({

	routes: {
		"": "index",
		"user/:username": "user"
	},

	_handlePointsChanges: function(url, pageTitle) {
		$.ajax({
			url: url,
			dataType: 'json',
			success: function(data) {
				var rawPoints = new MoreScores.Collections.PointsChanges(data);
				var cumulativePoints = new MoreScores.Collections.CumulativePoints();
				cumulativePoints.cumulatePoints(rawPoints);

				var scoreView = new MoreScores.Views.ScoresView({
					rawPoints: rawPoints,
					cumulativePoints: cumulativePoints,
					pageTitle: pageTitle
				}).show();

			}
		});
	},

	index: function() {
		this._handlePointsChanges('/results', "All Scores");
	},
	
	user: function(username) {
		this._handlePointsChanges('/results/user/'+username, "Scores for {{ name }}");
	}
});
