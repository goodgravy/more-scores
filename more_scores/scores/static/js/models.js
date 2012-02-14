MoreScores.Models.PointsChange = Backbone.Model.extend({
	_isoStringToDate: function(string) {
		var isoDate = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/;
		var match = isoDate.exec(string);
		if (!match) {
			throw {type: 'TypeError', message: string+' is not an ISO-formatted string'}
		}
		return new Date(match[1], match[2] - 1, match[3], match[4], match[5], match[6]);
	},

	initialize: function(options) {
		if (typeof(this.get("played")) === "string") {
			this.set("played", this._isoStringToDate(this.get("played")));
		}
	}
});

MoreScores.Collections.CumulativePoints = Backbone.Collection.extend({
	model: MoreScores.Models.PointsChange,

	initialize: function() {
		_.bindAll(this, "cumulatePoints", "_cumulate", "toDataTableJSON");
		this._colNames = [{id: "played", label: "played"}];
	},

	cumulatePoints: function(pointsChanges) {
		for (var idx=0; idx<pointsChanges.length; idx+=1) {
			this._cumulate(pointsChanges.at(idx));
		}
	},

	_cumulate: function(pointsChange) {
		if (this.length === 0) {
			// first points change
			var previous = new MoreScores.Models.PointsChange();
		} else {
			var previous = this.at(this.length-1);
		}
		var previousPoints = previous.get(pointsChange.get("username"));
		if (typeof(previousPoints) === "undefined") {
			// not seen this user before: new column!
			this._colNames.push({id: pointsChange.get("username"), label: pointsChange.get("name")});
			previousPoints = 0;
		}

		var newRow = previous.clone();
		newRow.set(pointsChange.get("username"), previousPoints + pointsChange.get("points"));
		newRow.set("played", pointsChange.get("played"));
		this.add(newRow);
	},

	toDataTableJSON: function() {
		var cols = [{id: "played", label: "played", type: "date"}];
		for (var colIdx=1; colIdx < this._colNames.length; colIdx+=1) {
			cols.push({
				id: this._colNames[colIdx].id,
				label: this._colNames[colIdx].label,
				type: "number"
			});
		}
		var rows = [];
		for (var rowIdx=0; rowIdx < this.length; rowIdx+=1) {
			var row = {c:[]};
			for (var colIdx=0; colIdx < this._colNames.length; colIdx+=1) {
				row.c.push({
					v: this.at(rowIdx).get(this._colNames[colIdx].id),
					f: this.at(rowIdx).get(this._colNames[colIdx].label)
				});
			}
			rows.push(row);
		}
		return {cols: cols, rows: rows}
	}
});

MoreScores.Collections.PointsChanges = Backbone.Collection.extend({
	model: MoreScores.Models.PointsChange
});
