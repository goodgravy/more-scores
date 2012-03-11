MoreScores.Views.Page = Backbone.View.extend({
	className: "page",

	initialize: function () {
		this.render();
	},
	show: function () { var el = this.el;
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

MoreScores.Views.Index = MoreScores.Views.Page.extend({
	render: function() {
		this.$el.append('<a href="#result">#result</a>');
		this.$el.append('<a href="#result/add">#result/add</a>');
	}
});

MoreScores.Views.Results = MoreScores.Views.Page.extend({
	initialize: function(options) {
		this.globalFilterFn = options.filterFn || function() { return true; };
		this.collection.on('new-scores', this.globalFilter, this);
		this.render();
	},

	globalFilter: function(results) {
		// stash original results for undoing filters later
		// apply global filters while we're at it (e.g. by user)
		this._origColl = results.filter(this.globalFilterFn);
		this.collection.reset(this._origColl, {silent:true});
		this.collection.trigger('global-filter', this.collection);
		this.collection.trigger('time-filter', this.collection);
	},

	filter: function(filterFn) {
		var filterFn = filterFn || function() { return true; }
		this.collection.reset(this._origColl, {silent:true});
		this.collection.reset(this.collection.filter(filterFn));
		this.collection.trigger('time-filter', this.collection);
	},

	render: function(filterFn) {
		var graphView = new MoreScores.Views.ResultsGraph({
			parent: this,
			collection: this.collection
		});
		this.listView = new MoreScores.Views.ResultsList({
			parent: this,
			filterFn: filterFn,
			collection: this.collection
		});
		
		this.$el.append(graphView.el);
		this.$el.append(this.listView.el);
		return this;
	}
});

MoreScores.Views.ResultsGraph = Backbone.View.extend({
	className: "graph-container",

	initialize: function(options) {
		this.collection.on("global-filter", this.render, this);
		this.parent = options.parent;
	},

	render: function(results) {
		var that = this;
		var data = new google.visualization.DataTable(results.toDataTableJSON());
		var chart = new google.visualization.AnnotatedTimeLine(this.$el.get(0));
		var rangeChange = function() {
			var startEnd = chart.getVisibleChartRange();
			var filterFn = function(result) {
				return result.get('played') >= startEnd.start &&
					result.get('played') <= startEnd.end;
			}
			that.parent.filter(filterFn);
		}
		google.visualization.events.addListener(chart, 'ready', function() {
			google.visualization.events.addListener(
				chart,
				'rangechange',
				rangeChange
			);
		});
		chart.draw(data, {displayZoomButtons: false});
	}
});

MoreScores.Views.ResultsList = Backbone.View.extend({
	className: "table-container",

	initialize: function(options) {
		this.filterFn = options.filterFn || function() { return true; };
		this.collection.bind('time-filter', this.render, this);
	},
	
	render: function() {
		var html = $(Mustache.to_html(Mustache.TEMPLATES.results, {}));
		var filteredListResults = this.collection.filter(this.filterFn);
		_.each(filteredListResults, function(result) {
			var resultView = new MoreScores.Views.Result({model: result});
			$('tbody', html).append(resultView.render().el);
		});
		this.$el.html(html);
		return this;
	}
});

MoreScores.Views.Result = Backbone.View.extend({
	tagName: 'tr',

	initialize: function() {
		this.model.bind('change', this.render, this);
	},

	render: function() {
		this.$el.html(Mustache.to_html(
			Mustache.TEMPLATES.result,
			this.model.toJSON()
		));
		return this;
	}
});

MoreScores.Views.ResultAdd = MoreScores.Views.Page.extend({
	events: {
		"click a.button.submit": "saveResult"
	},

	render: function() {
		this.leftUsers = new MoreScores.Collections.Users(MoreScores.Collections.users.toJSON());
		this.rightUsers = new MoreScores.Collections.Users(MoreScores.Collections.users.toJSON());

		var versus = new MoreScores.Views.Versus({left: this.leftUsers, right: this.rightUsers});
		this.$el.append(versus.render().el);

		var leftPicker = new MoreScores.Views.TeamPicker({
			className: 'team-picker left',
			collection: this.leftUsers,
			otherCollection: this.rightUsers
		});
		var rightPicker = new MoreScores.Views.TeamPicker({
			className: 'team-picker right',
			collection: this.rightUsers,
			otherCollection: this.leftUsers
		});
		this.$el.append(leftPicker.el);
		this.$el.append(rightPicker.el);

		this.$el.append('<div style="clear:both"></div>');
		this.$el.append('<a href="javascript:void(0);" class="button submit">save result</a>');
	},

	saveResult: function() {
		function checkTeamSize(team, teamName) {
			if (team.length < 1) {
				console.warn("Need to have at least one "+teamName);
				return false;
			} else if (team.length > 2) {
				var msg = 'Logic error: '+team.length+' people on one team, somehow...';
				throw {type: "AssertionError", message: msg};
			}
			return true;
		}

		var winners = this.leftUsers.filter(function(user) { return user.get('picked') });
		var losers = this.rightUsers.filter(function(user) { return user.get('picked') });

		if (! (checkTeamSize(winners, "winner") && checkTeamSize(losers, "loser")) ) {
			return;
		}

		var result = MoreScores.Collections.results.create({
			played: new Date(),
			winners: winners,
			losers: losers
		});
		MoreScores.router.navigate('result', {trigger: true});
	}
});

MoreScores.Views.Versus = Backbone.View.extend({
	className: "versus",

	initialize: function(options) {
		this.left = options.left;
		this.right = options.right;
		this.left.on('reset add remove change', this.render, this);
		this.right.on('reset add remove change', this.render, this);
	},

	render: function() {
		function appendPickedUsers(collection, el, className) {
			var pickedUsers = collection.filter(function(user) { return user.get('picked') });
			var namedUsers = _.map(pickedUsers, function(user) { return user.get('first_name') });
			el.append(
				'<span class="team-name '+className+'">' +
				'&nbsp;' +
				namedUsers.join(" and ") +
				'</span>'
			);
		}

		this.$el.empty();
		appendPickedUsers(this.left, this.$el, 'left');
		this.$el.append('<div class="divider">beat</div>');
		appendPickedUsers(this.right, this.$el, 'right');
		return this;
	}
});

MoreScores.Views.TeamPicker = Backbone.View.extend({
	initialize: function(options) {
		this.otherCollection = options.otherCollection;
		this.render();
	},

	render: function() {
		var that = this;
		this.collection.each(function(user) {
			that.$el.append(new MoreScores.Views.PlayerPicker({
				parent: that,
				player: user
			}).el);
		});
	},

	pickChanged: function(pPicker) {
		if (pPicker.player.get('picked')) {
			console.debug("De-selecting "+pPicker.player.get('username'));
			pPicker.player.set('picked', false);
		} else {
			if (this.collection.filter(function(user) { return user.get('picked'); }).length >= 2) {
				console.warn("Teams can only have up to two players in them");
			} else if (this.otherCollection.get(pPicker.player.id).get('picked')) {
				console.warn("Can't have players playing against themselves!");
			} else {
				console.debug("Selecting "+pPicker.player.get('username'));
				pPicker.player.set('picked', true);
			}
		}
	}
});
	
MoreScores.Views.PlayerPicker = Backbone.View.extend({
	tagName: 'a',
	className: 'player-picker button',
	events: {
		click: 'clicked'
	},

	initialize: function(options) {
		_.bindAll(this);
		this.parent = options.parent;
		this.player = options.player;
		this.$el.attr({href: 'javascript:void(0);'});
		this.render();

		this.player.on('change', this.render, this);
	},
	render: function() {
		this.$el.text(this.player.get('first_name'));
		this.$el.toggleClass('picked', this.player.get('picked')? true: false);
	},

	clicked: function() {
		this.parent.pickChanged(this);
	}
});
