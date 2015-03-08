// caniuse.com functionality for oftn-bot
// by ImBcmDth - jon.carlos.rivera@gmail.com
//
// Thanks to FireFly, sorella, gkatsev, Morthchek,
// and eboy for your testing and suggestions.
//
// All data provided by the good folks at <http://caniuse.com/>

var File = require("fs");
var HTTPS = require('https');

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

var DATA_SOURCE = {
	hostname: 'raw.githubusercontent.com',
	port: 443,
	path: '/Fyrd/caniuse/master/data.json',
	method: 'GET'
};

var CanIUseServer = module.exports = function(bot) {
	this.loaded = false;
    this.db = {};
	this.fetchJSON();

    bot.register_command('caniuse', this.find.bind(this));
    bot.register_command('ciu', 'caniuse');
    bot.register_command('searchciu', this.search.bind(this));
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
			}
            catch (e) {
                console.log(e);
            }
		}.bind(this));
	}.bind(this));

	req.end();
};

CanIUseServer.prototype.parseJSON = function(json, source) {
	try {
		var data = JSON.parse(json);
		console.log("Loaded JSON - " + source);
		this.loaded = true;
		this.db = data;
		this.buildIndex();
	} catch (e) {
		console.log("JSON Parse Error - " + e);
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
