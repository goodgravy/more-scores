Stateofappiness.Views.Page = Backbone.View.extend({
	className: "page",

	initialize: function () {
		this.render();
	},
	show: function () {
		var el = this.el;
		if ($('.page, .loading').length) {
			// TODO: reuse pages.
			$('.page, .loading').not(el).remove();
			$(el).appendTo('body').hide();
			$(el).show();
		} else {
			$(el).appendTo('body').hide();
			$(el).show();
		}
	}
});


Stateofappiness.Views.Index = Stateofappiness.Views.Page.extend({

	initialize: function() {
		this.render();
	},

	render: function() {
		var that = this;
		var header = new Stateofappiness.Views.Header({name: app_config.name});
		$(that.el).append(header.el);
		this.collection.each(function(feed_item, index) {
			var new_view = new Stateofappiness.Views.Feed({model: feed_item});
			$(that.el).append(new_view.el);
		});
		return this;
	}
});

Stateofappiness.Views.Header = Backbone.View.extend({
	className: "top-level header",
	
	initialize: function() {
		this.render();
	},
	
	render: function() {
		$(this.el).text(this.options.name);
	}
});

Stateofappiness.Views.Feed = Backbone.View.extend({
	className: "top-level feed",

	events: {
		//TODO: click is sub-optimal on phones, use forge.is to use tap on phones
		"click": "expand_item"
	},

	expand_item: function () {
		Stateofappiness.router.navigate("feed/" + this.model.get("slug"), true);
	},

	initialize: function() {
		this.render();
	},

	render: function() {
		$(this.el).html(this.model.get("title"));
		
		return this;
	},
});


Stateofappiness.Views.FeedItems = Stateofappiness.Views.Page.extend({

	events: {
		//TODO: click is sub-optimal on phones, use forge.is to use tap on phones
		"click .back": "goHome"
	},

	goHome: function () {
		Stateofappiness.router.navigate("", true);
	},

	initialize: function() {
		this.render();
	},

	render: function() {
		$(this.el).html('<div class="back">&larr; Back</li>');
		var that = this, items = $('<div class="items"></div>').appendTo(this.el);
		
		if (this.collection.length > 0) {
			this.collection.each(function(item, index) {
				var new_view = new Stateofappiness.Views.Item({model: item});
				items.append(new_view.el);
			});
		} else {
			items.html('No Items')
		}
		return this;
	}
});


Stateofappiness.Views.Item = Backbone.View.extend({
	className: "item",

	events: {
		//TODO: click is sub-optimal on phones, use forge.is to use tap on phones
		"click": "expand_item"
	},

	expand_item: function () {
		forge.tabs.open(this.model.get("link"));
	},

	initialize: function() {
		this.render();
	},

	render: function() {
		var author = this.model.get("author");
		var author_line = (author ? " by " + author : "");
		$(this.el).html(
			'<h1>' + this.model.get("title") + '</h1>' +
			'<div class="author">' +
				author_line +
			'</div>' +
			'<div class="date">' +
				this.model.get("publishedDate").split(" ").slice(0, -1).join(" ") +
			'</div>'
		);
		return this;
	}
});