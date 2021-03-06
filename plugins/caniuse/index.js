// caniuse.com functionality for oftn-bot
// by ImBcmDth - jon.carlos.rivera@gmail.com
//
// Thanks to FireFly, sorella, gkatsev, Morthchek,
// and eboy for your testing and suggestions.
//
// All data provided by the good folks at <http://caniuse.com/>

var Utils = require("util");
var File = require("fs");
var Path = require('path');
var HTTPS = require('https');

// Used for console logging
var MODULE_SHORT_NAME = 'CanIUse';

// Max search matches to return for a fuzzy match
var MAX_SEARCH_MATCHES = 8;

// Which browsers to display in results
var AGENTS_TO_SHOW = {
	'ie': 'IE',
	'firefox': 'FF',
	'chrome': 'Chrome',
	'opera': 'Opera',
	'safari': 'Safari',
	'ios_saf': 'iOS',
	'android': 'Android'
};

// attempt reload the data every 24 hours
var DATA_RELOAD_INTERVAL = 24 * 60 * 60 * 1000;

// number of times to retry data retrieval until we give up and
// wait for the next DATA_RELOAD_INTERVAL
var MAX_RETRY_ATTEMPTS = 5;

var DATA_SOURCE = {
	hostname: 'raw.githubusercontent.com',
	port: 443,
	path: '/Fyrd/caniuse/master/data.json',
	method: 'GET'
};

var CanIUseServer = module.exports = function(bot) {
	this.loaded = false;
	this.attemptsRemaining = MAX_RETRY_ATTEMPTS;
    this.db = {};
	this.fetchJSON();

    bot.register_command('caniuse', this.find.bind(this));
    bot.register_command('ciu', 'caniuse');
    bot.register_command('searchciu', this.search.bind(this));
};

CanIUseServer.prototype.readJSON = function() {
	File.readFile(this.filename, function (err, data) {
		if (err) {
			throw new Error("CanIUse: Error reading file - " + this.filename);
		}
		try {
			this.parseJSON(data, this.filename);
			setTimeout(this.readJSON.bind(this), DATA_RELOAD_INTERVAL);
		} catch (e) {
			if (this.attemptsRemaining--) {
				consolePuts("Will attempt to read the file again... (" + (MAX_RETRY_ATTEMPTS - this.attemptsRemaining) + "/" + MAX_RETRY_ATTEMPTS + ")");
				setTimeout(this.readJSON.bind(this), 1000);
			} else {
				consolePuts("Out of read retry attempts!");
				setTimeout(this.readJSON.bind(this), DATA_RELOAD_INTERVAL);
			}
		}
	}.bind(this));
};

CanIUseServer.prototype.fetchJSON = function() {
	var json = '';

	var req = HTTPS.request(DATA_SOURCE, function(res) {
		res.on('data', function(data) {
			json += data;
		}.bind(this));

		res.on('end', function() {
			try {
				this.parseJSON(json, DATA_SOURCE.hostname + DATA_SOURCE.path);
				setTimeout(this.fetchJSON.bind(this), DATA_RELOAD_INTERVAL);
			} catch (e) {
				if (this.attemptsRemaining--) {
					consolePuts("Will attempt to fetch the file again in 10 seconds... (" + (5 - this.attemptsRemaining) + "/" + MAX_RETRY_ATTEMPTS + ")");
					setTimeout(this.fetchJSON.bind(this), 10000);
				} else {
					consolePuts("Out of fetch retry attempts!");
					setTimeout(this.fetchJSON.bind(this), DATA_RELOAD_INTERVAL);
				}
			}
		}.bind(this));
	}.bind(this));

	req.end();
};

CanIUseServer.prototype.parseJSON = function(json, source) {
	try {
		var data = JSON.parse(json);
		consolePuts("Loaded JSON - " + source);
		this.loaded = true;
		this.attemptsRemaining = MAX_RETRY_ATTEMPTS;
		this.db = data;
		this.buildIndex();
	} catch (e) {
		consolePuts("JSON Parse Error - " + e);
		throw e;
	}
};

CanIUseServer.prototype.buildIndex = function() {
	var db = this.db.data;
	this.index = [];

	this.index = Object.keys(db).map(makeIndexObjects);
	this.index.forEach(concatTitleKeywords);

	function concatTitleKeywords(indexObject) {
		indexObject.index = db[indexObject.key].title.toLowerCase() + ','
		    + db[indexObject.key].keywords.toLowerCase() + ','
		    + db[indexObject.key].description.toLowerCase();
	}

	function makeIndexObjects(key) {
		return { 'key': key };
	}
};

CanIUseServer.prototype.search = function(context, key) {
	key = key.toLowerCase();

	if (key === 'caniuse') {
		context.bot.send_message(context.channel, 'Yes.', context.intent);
        return;
	}

	var matches = this.index.filter(matchSubstring(key));
	var matchCount = matches.length;

	matches = matches.slice(0, MAX_SEARCH_MATCHES).map(pullOutProperty('key'))
	matchCount -= matches.length;

	var response = 'Found: ' + matches.join(', ');

	if(matchCount > 0) {
		response += ' (' + matchCount + ' more...)';
	}

	context.bot.send_message(context.channel, response, context.intent);

	function matchSubstring(substring) {
		return function(indexObject) {
			return(indexObject.index.indexOf(key) > -1);
		}
	}

	function pullOutProperty(property) {
		return function(indexObject) {
			return indexObject[property];
		}
	}
};

CanIUseServer.prototype.find = function(context, key) {
	var db = this.db.data;

	if (typeof db[key] === "undefined") {
		context.bot.send_message(context.channel, "Can I Use `"+key+"` was not found.", context.intent);
        return;
	}

	var feature = db[key];
	var agentSupportInfo = this.getAgentSupportArray(feature);
	var agentSupportStrings = this.formatAgentSupportArray(agentSupportInfo.supported);
	var supportedString = agentSupportStrings.join(' | ');
	var unsupportedString = agentSupportInfo.unsupported.join(', ');
	var overallPercent = (feature.usage_perc_y + feature.usage_perc_a);

	var message = formatResponse(feature.title, supportedString, unsupportedString, overallPercent, key);
    context.bot.send_message(context.channel, message, context.intent);
};

CanIUseServer.prototype.getAgentSupportArray = function(feature) {
	var data = this.db;
	var agents = data.agents;

	var agentSupportObject = {supported:[], unsupported:[]};

	Object.keys(AGENTS_TO_SHOW).forEach(getMinimalAgentSupport);

	return agentSupportObject;

	function getMinimalAgentSupport(agent) {
		var agentName = AGENTS_TO_SHOW[agent];
		var agentSupport;

		var supportedVersions = agents[agent].versions.filter(onlyTotallySupported);

		if (supportedVersions.length === 0) {
			supportedVersions = agents[agent].versions.filter(onlySomewhatSupported);
		}

		if (supportedVersions.length !== 0) {
			agentSupport = feature.stats[agent][supportedVersions[0]];

			agentSupportObject.supported.push({
				name: agentName,
				version: supportedVersions[0] + '+',
				support: agentSupport
			});
		} else {
			agentSupportObject.unsupported.push(agentName);
		}

		function onlyTotallySupported(version) {
			return (version != null && !/[n|u|p|a|x]/g.test(feature.stats[agent][version]));
		}

		function onlySomewhatSupported(version) {
			return (version != null && !/[n|u]/g.test(feature.stats[agent][version]));
		}
	}
};

CanIUseServer.prototype.formatAgentSupportArray = function(agentSupport) {
	return agentSupport.map(makeAgentSupportStrings, this.db.agents)

	function makeAgentSupportStrings(agentInfo) {
		var concatedName = agentInfo.name + " " + agentInfo.version;
		var supportFlags = agentInfo.support.split(' ');

		if (supportFlags.indexOf('p') > -1) {
			agentInfo.version += ' (w/polyfill)';
		}
		else if (supportFlags.indexOf('x') > -1) {
			agentInfo.version += ' (w/prefix)';
		} else if (supportFlags.indexOf('a') > -1) {
			agentInfo.version += ' (partial)';
		}

		return agentInfo.name + ' ' + agentInfo.version;
	}
};

function formatResponse(title, supportedList, unsupportedList, overallPercent, keyword) {
	var response = "Can I Use " + title + "?";
	response += " [" + supportedList + "]";
	if (unsupportedList) {
		response += " (Unsupported: " + unsupportedList + ")";
	}
	response += " Overall: " + overallPercent.toFixed(1) + "%";
	response += ' <http://caniuse.com/' + keyword + '>';

	return response;
}

function consolePuts(output) {
	Utils.puts(MODULE_SHORT_NAME + ': ' + output);
}
