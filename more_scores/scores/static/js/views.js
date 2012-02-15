MoreScores.Views.Page = Backbone.View.extend({
	className: "page",

	initialize: function () {
		this.render();
	},
	show: function () {
		var el = this.el;
		if ($('.page, .loading').length) {
			$('.page, .loading').not(el).remove();
		}
		$(el).appendTo('#shell').hide();
		$(el).show();
		this.postAdd();
	},
	
	postAdd: function() {
		/* override this with any code which needs to 
		happen after the element is in the DOM */
	}
});

MoreScores.Views.ScoresView = MoreScores.Views.Page.extend({
	initialize: function(options) {
		this.render(options);

		this._chart = new MoreScores.Views.PointsChart({
			collection: options.cumulativePoints
		});
		this._list = new MoreScores.Views.PointsList({
			collection: options.rawPoints
		});
		this.$el.append(this._chart.el);
		this.$el.append(this._list.el);
	},
	render: function(options) {
		var html = Mustache.to_html(Mustache.TEMPLATES.scores_view, options);
		this.$el.html(html);
	},
	postAdd: function() {
		this._chart.postAdd();
	}
});

MoreScores.Views.PointsChart = Backbone.View.extend({
	className: 'chart-div',

	initialize: function() {
		this.$el.attr("style", "width: 880px; height: 400px;");
		this.render();
	},

	render: function() {
		var that = this;
		this._data = new google.visualization.DataTable(this.collection.toDataTableJSON());

		this._chart = new google.visualization.AnnotatedTimeLine(that.el);
		return this;
	},

	postAdd: function() {
		this._chart.draw(this._data);
	}
});

MoreScores.Views.PointsList = Backbone.View.extend({
	tagName: "table",
	className: "points",
	
	initialize: function() {
		this.render();
	},
	render: function() {
		var that = this;
		that.$el.html(Mustache.to_html(
			Mustache.TEMPLATES.points_list,
			{}
		));

		this.collection.each(function(pointsChange) {
			var item = new MoreScores.Views.PointsListItem({model: pointsChange});
			$('tbody', that.el).append(item.el);
		});
		return this;
	}
});

MoreScores.Views.PointsListItem = Backbone.View.extend({
	tagName: "tr",

	initialize: function() {
		this.render();
	},
	render: function() {
		var json = this.model.toJSON();
		var played = json.played;
		if (played.getHours() === 0) {
			// just a Date, not a Datetime
			var format = "d-MMM-yyyy";
		} else {
			// Datetime
			var format = "d-MMM-yyyy HH:mm:ss";
		}
		json.played = played.toString(format);
		this.$el.html(Mustache.to_html(
			Mustache.TEMPLATES.points_list_item,
			json
		));
		return this;
	}
});

