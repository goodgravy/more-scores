var MoreScores = {
	Models: {},
	Collections: {},
	Views: {},
	Utils: {},

	init: function () {
		MoreScores.config = {
			appId: 'LwvhP24g9g3LRFRWohv2n5kMfpyp7My7Nbj0P4ah',
			restKey: '7E77gMuTAjNMxhlJBB2K48ePDoNhRyYvQLmEvBrB'
		};
		MoreScores.router = new MoreScores.Router();
		MoreScores.session = new Backbone.Model;
		MoreScores.dispatcher = _.clone(Backbone.Events);
		MoreScores.Collections.results = new MoreScores.Collections.Results;
		MoreScores.Collections.users = new MoreScores.Collections.Users;
		MoreScores.Collections.users.fetch();
		Backbone.history.start()
	}
};
