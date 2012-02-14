var Stateofappiness = {
	Models: {},
	Collections: {},
	Views: {},
	Utils: {},

	init: function () {
		Stateofappiness.router = new Stateofappiness.Router();
		Stateofappiness.feeds = new Stateofappiness.Collections.Feeds(feed_list);
		Backbone.history.start();
	}
};
