var util = require("util");
var fs = require("fs");
var path = require('path');

var CanIUse = module.exports = function(query, callback) {
	query = query.toLowerCase();
	var ciudata;
	var link;
	var self = this;
	fs.readFile('./data.json', function(err, data) {
		if (err) {
			throw err;
		}
		ciudata = data;
	});
	if (typeof ciudata.data[query] === "undefined") {
		link = 'not found';
	}
	else {
		link = 'https://caniuse.com/#feat='+query;
	}
	callback.call(self, {
		ciulink: link
	});
};