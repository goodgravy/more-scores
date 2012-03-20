Backbone.View.prototype.close = function () {
	this.remove();
	this.off();
	if (this.onClose) {
		this.onClose();
	}
}

function AppView () {
	this.showView = function (view) {
		if (this.currentView) {
			this.currentView.close();
		}

		this.currentView = view;
		$("#shell").html(this.currentView.el);
	}
}

MoreScores.Views.Index = Backbone.View.extend({
	render: function() {
		this.$el.append('<a href="#result">#result</a>');
		this.$el.append('<a href="#result/add">#result/add</a>');
	}
});

MoreScores.Views.Login = Backbone.View.extend({
	events: {
		"submit form": "submit"
	},

	initialize: function () {
		this.render();
	},

	render: function () {
		this.$el.html( Mustache.to_html( Mustache.TEMPLATES.login, {}));
	},

	submit: function() {
		var options = {
			url: '/login',
			method: 'GET',
			data: $('form', this.el).serialize(),
			success: function(result) {
				console.log("Logged in");
				console.debug(JSON.stringify(result));
				MoreScores.session.set(result);
				MoreScores.router.navigate(MoreScores.session.get('next') || '', true);
			},
			statusCode: {
				404: function() {
					alert('Incorrect username/password');
				}
			},
			error: function(xhr, text) {
				console.error("Error logging in: "+text+" "+xhr.status);
			}
		}
		$.ajax(addParseOptions(options));
		return false;
	}
});

MoreScores.Views.Results = Backbone.View.extend({
	initialize: function(options) {
		this.globalFilterFn = options.filterFn || function() { return true; };
		this.collection.on('new-scores', this.render, this);
	},
	onClose: function() {
		this.collection.off('new-scores', this.render);
	},

	render: function(filterFn) {
		this.$el.html('');
		var filtered = this.collection.filter(this.globalFilterFn);
		if (filtered.length === 0) { return; }
		var graphView = new MoreScores.Views.ResultsGraph({ collection: filtered });
		var listView = new MoreScores.Views.ResultsList({ collection: filtered });
		
		this.$el.append(graphView.el);
		graphView.render();
		this.$el.append(listView.render().el);
		return this;
	}
});

MoreScores.Views.ResultsGraph = Backbone.View.extend({
	className: "graph-container",

	render: function() {
		var that = this;
		var data = new google.visualization.DataTable(toDataTableJSON(this.collection, MoreScores.Collections.users));
		var chart = new google.visualization.AnnotatedTimeLine(this.el);
		var rangeChange = function() {
			var startEnd = chart.getVisibleChartRange();
			var filterFn = function(result) {
				return result.get('played') >= startEnd.start &&
					result.get('played') <= startEnd.end;
			}
			MoreScores.dispatcher.trigger('results:time-filter', filterFn);
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
		MoreScores.dispatcher.on('results:time-filter', this.render, this);
	},
	onClose: function() {
		MoreScores.dispatcher.off('results:time-filter', this.render);
	},
	
	render: function(filterFn) {
		var realFilterFn = filterFn || function() { return true; };
		var table = new google.visualization.Table(this.el);
		var results = this.collection.filter(realFilterFn);
		var data = new google.visualization.DataTable(toDataTableJSON(results, MoreScores.Collections.users));
		table.draw(data, {sortAscending: false, sortColumn: 0, allowHtml: true});
		return this;
	}
});

MoreScores.Views.ResultAdd = Backbone.View.extend({
	events: {
		"click a.button.submit": "saveResult"
	},

	initialize: function() {
		MoreScores.Collections.users.on('change reset add', this.render, this);
		MoreScores.Collections.results.on('add', this.adding, this);
		MoreScores.Collections.results.on('sync', this.render, this);
	},
	onClose: function() {
		MoreScores.Collections.users.off('change reset add', this.render);
		MoreScores.Collections.results.off('add', this.adding);
		MoreScores.Collections.results.off('sync', this.render);
	},

	adding: function() {
		$('a.button.submit').text('saving...');
		this.events = {};
	},

	render: function() {
		this.$el.html('');
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
