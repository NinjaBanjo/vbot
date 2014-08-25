var FeelingLucky = require("./lib/feelinglucky"),
	HTMLValidator = require("./lib/htmlvalidator"),
	PhantomJS = require('./lib/phantomjs'),
	URLShortener = require("./lib/urlshortener");

function factoidFindHelper(bot, context, text, suppressSearch) {
	try {
		var results,
		    factoid = bot.factoids.find(text, true);

		if (results = factoid.match(bot.executeRegex)) {
			context.channel.send_reply(context.channel, results[0] + " @" + context.intent.name, {color: true});
			Shared.execute_js.apply(bot, [context, factoid].concat(results.slice(1)));
		} else {
			context.channel.send_reply(context.intent, factoid, {color: true});
		}
	} catch(e) {
		if (!suppressSearch) {
			var reply = ["Could not find `"+text+"`."],
			    found = bot.factoids.search(text);

			found = found.map(function(item) {
				return item;
			});

			if (found.length) {
				reply = ["Found:"];
				if (found.length > 1) {
					found[found.length-1] = "and "+found[found.length-1];
				}
				reply.push(found.join(found.length-2 ? ", " : " "));
			}

			context.channel.send_reply(context.intent, reply.join(" "), {color: true});
		}
	}
}

var Commands = module.exports = {
	factoid: function(context, text) {
		context.channel.send_reply(context.sender.name, text);
	},
	google: function(context, text) {
		FeelingLucky(text + " -site:w3schools.com", function(data) {
			if (data) {
				context.channel.send_reply (context.intent, 
					data.title+" <"+data.url+">", {color: false});
			} else {
				context.channel.send_reply (context.sender.name, "No search results found.");
			}
		});
	},

	mdn: function(context, text) {
		FeelingLucky(text + " site:developer.mozilla.org", function(data) {
			if (data) {
				context.channel.send_reply (context.intent, 
					data.title+" <"+data.url+">", {color: false});
			} else {
				context.channel.send_reply (context.sender.name, "No search results found.");
			}
		});
	},

	wpd: function(context, text) {
		FeelingLucky(text + " site:docs.webplatform.org", function(data) {
			if (data) {
				context.channel.send_reply (context.intent, 
					data.title+" <"+data.url+">", {color: false});
			} else {
				context.channel.send_reply(context.sender.name, "No search results found.");
			}
		});
	},

	validate: function(context, text) {
		HTMLValidator(text, function(data) {
			if (data.status === 'Invalid') {
				context.channel.send_reply(context.intent, text + " is " + data.status + " - Errors: " + data.errors + " Warnings: " + data.warnings + " Link: " + data.shortUrl);
			}
			else if (data.status === 'Valid') {
				context.channel.send_reply(context.intent, text + " is " + data.status);
			}
		});
	},

	shorten: function(context, text) {
		URLShortener(text, function(data) {
			context.channel.send_reply(context.intent, text + " is now shortened to " + data.shortUrl, {color: false});
		});
	},

	caniuse: function(context, text) {
		var ciudata = this.caniuse_server.search(text);
		context.channel.send_reply(context.intent, ciudata);
	},

	whatwg: function(context, text) {
		var url = "http://www.whatwg.org/specs/web-apps/current-work/multipage/semantics.html#the-" + text + "-element";
		context.channel.send_reply(context.intent, url);
	},
	
	learn: function(context, text) {
		try {
			if (context.sender.host !== 'unaffiliated/emerson') {
				context.channel.send_reply(context.sender.name, "Sorry, only certain people can change factoids. Contact emerson if you want to be able to change them.");
				return;
			}
			var parsed = text.match(/^(alias)?\s*("[^"]*"|.+?)\s*(=~?)\s*(.+)$/i);
			if (!parsed) {
				throw new SyntaxError(
					"Syntax is `learn ( [alias] foo = bar | foo =~ s/expression/replace/gi )`.");
			}

			var alias = !!parsed[1];
			var factoid = parsed[2];
			var operation = parsed[3];
			var value = parsed[4];

			if (factoid.charAt(0) === '"') {
				factoid = JSON.parse(factoid);
			}

			if (alias) {
				var key = this.factoids.alias(factoid, value, context.sender.name);
				context.channel.send_reply(context.sender.name,
					"Learned `"+factoid+"` => `"+key+"`.");
				return;
			}

			/* Setting the text of a factoid */ 
			if (operation === "=") {
				this.factoids.learn(factoid, value, context.sender.name);
				context.channel.send_reply(context.sender.name, "Learned `"+factoid+"`.");
				return;
			}

		} 
		catch (e) {
			console.log(e);
		}
	},
	
	forget: function(context, text) {
		try {
			if (context.sender.host !== 'unaffiliated/emerson') {
				context.channel.send_reply(context.sender.name, "Sorry, only certain people can change factoids. Contact emerson if you want to be able to change them.");
				return;
			}
			this.factoids.forget(text, context.sender.name);
			context.channel.send_reply(context.sender.name, "I don't know anything about '"+text+"' anymore.");
		} 
		catch(e) {
			console.log(e);
		}
	},

	factoid: function(context, text) {
		context.channel.send_reply(context.intent, text);
	},

	tell: function(context, text) {
		var factoid_value = this.factoids.find(text);
		if (factoid_value) {
			context.channel.send_reply(context.intent, factoid_value);
		}
		else {
			context.channel.send_reply(context.sender.name, "Hmm, I don't know what " + text + " is :/");
		}
	},

	msg: function(context, text) {
		var factoid_value = this.factoids.find(text);
		if (factoid_value) {
			context.client.get_user(context.intent).send(text);
		}
		else {
			context.channel.send_reply(context.sender.name, "Hmm, I don't know what " + text + " is :/");
		}
	},
	
	commands: function(context, text) {
		if(context.priv) {
			var commands = this.get_commands();
			var trigger = this.__trigger;
			context.channel.send_reply(context.intent,
				"Valid commands are: " + trigger + commands.join(", " + trigger));
		}
		else context.channel.send_reply(context.intent,
				"Output too noisy. PM me for this one.");
	},

	find: function(context, text) {
		factoidFindHelper(this, context, text);
	},

	findPlus: function(context, text, suppressSearch) {
		factoidFindHelper(this, context, text, suppressSearch);
	},

	ping: function(context, text) {
		context.channel.send_reply(context.intent, "Pong!");
	},

	iambot: function(context, text) {
		context.channel.send_reply(context.intent, "I am a bot :)");
	},

	op: function (context, text) {
		if (context.sender.host === 'unaffiliated/emerson') {
			context.client.get_user("ChanServ").send("OP " + context.channel.name + " " + text);
		}
	},

	deop: function (context, text) {
		if (context.sender.host === 'unaffiliated/emerson') {
			context.client.get_user("ChanServ").send("DEOP " + context.channel.name + " " + text);
		}
	},

	voice: function (context, text) {
		if (context.sender.host === 'unaffiliated/emerson') {
			context.client.get_user("ChanServ").send("VOICE "+ context.channel.name + " " + text);
		}
	},

	devoice: function (context, text) {
		if (context.sender.host === 'unaffiliated/emerson') {
			context.client.get_user("ChanServ").send("DEVOICE " + context.channel.name + " " + text);
		}
	},

	quiet: function (context, text) {
		if (context.sender.host === 'unaffiliated/emerson') {
			context.client.get_user("ChanServ").send("QUIET " + context.channel.name + " "+ text);
		}
	},

	unquiet: function (context, text) {
		if (context.sender.host === 'unaffiliated/emerson') {
			context.client.get_user("ChanServ").send("UNQUIET "+ context.channel.name + " " + text);
		}
	},

	kick: function (context, text) {
		if (context.sender.host === 'unaffiliated/emerson') {
			context.client.get_user("ChanServ").send("op " + context.channel.name);
			context.channel.kick(text);
			context.client.get_user("ChanServ").send("deop " + context.channel.name);
		}
	},

	kickban: function (context, text) {
		if (context.sender.host === 'unaffiliated/emerson') {
			var mask = text+"!*@*";
			context.client.get_user("ChanServ").send("op " + context.channel.name);
			context.channel.kickban(text, mask);
			context.client.get_user("ChanServ").send("deop " + context.channel.name);
		}
	},

	join: function (context, text) {
		if (context.sender.host === 'unaffiliated/emerson') {
			context.channel.join_on_invite(text);
		}
	},

	whois: function (context, text) {
		if (context.sender.host === 'unaffiliated/emerson') {
			context.channel.whois(text);
		}
	},

	screenshot: function(context, text) {
		PhantomJS.screenshot(text, function(data) {
			context.channel.send_reply(context.intent, "Screenshot at " + data.location);
		});
	}
};