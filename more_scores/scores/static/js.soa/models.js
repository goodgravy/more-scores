Stateofappiness.Models.Feed = Backbone.Model.extend();

Stateofappiness.Models.Item = Backbone.Model.extend();

Stateofappiness.Collections.Feeds = Backbone.Collection.extend({
	model: Stateofappiness.Models.Feed
});

Stateofappiness.Collections.Items = Backbone.Collection.extend({
	model: Stateofappiness.Models.Item
});

