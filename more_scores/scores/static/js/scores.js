var MoreScores = {
	Models: {},
	Collections: {},
	Views: {},
	Utils: {},

	init: function () {
		MoreScores.router = new MoreScores.Router();
		Backbone.history.start();
	}
};
