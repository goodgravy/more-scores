Stateofappiness.Utils = {

	parse_feed: function(feed_slug, callback) {
		var the_feed = Stateofappiness.feeds.find(function(feed){
			if (feed.get("slug") === feed_slug) {
				return true;
			} else {
				return false;
			}
		});
		this.parseRSS(the_feed.get("url"), callback);
	},

	parseRSS: function(url, callback) {
		$.ajax({
			url: 'http:' + '//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&callback=?&q=' + encodeURIComponent(url),
			dataType: 'json',
			success: function(data) {
				callback(data.responseData.feed);
			}
		});
	}
}