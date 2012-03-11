var MoreScores = {
	Models: {},
	Collections: {},
	Views: {},
	Utils: {},

	init: function () {
		MoreScores.router = new MoreScores.Router();
		MoreScores.Collections.results = new MoreScores.Collections.Results;
		MoreScores.Collections.users = new MoreScores.Collections.Users;
		MoreScores.Collections.users.fetch({
			success: function() {
				Backbone.history.start()
			}
		});
	}
};
