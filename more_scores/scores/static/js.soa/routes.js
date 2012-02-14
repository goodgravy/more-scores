Stateofappiness.Router = Backbone.Router.extend({

	routes: {
		"":"index",// entry point
		"feed/:slug":"feed"// #feed/feed-slug
	},

	index: function() {
		var index = new Stateofappiness.Views.Index({
			collection: Stateofappiness.feeds
		});
		index.show();
	},

	feed: function(slug) {
		//feed has slug in, find it in the collection and pass it to view
		var feed_model = Stateofappiness.feeds.find(function(feed){
			if(feed.get("slug") === slug) {
				return true;
			}
			else {
				return false;
			}
		});

		Stateofappiness.Utils.parse_feed(slug, function(feed_json){
			var feed = new Stateofappiness.Collections.Items(feed_json.entries);
			var feed_view = new Stateofappiness.Views.FeedItems({
				collection: feed
			});
			feed_view.show();
		});

	}

});