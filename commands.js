var FeelingLucky = require("./lib/feelinglucky"),
	HTMLValidator = require("./lib/htmlvalidator"),
	URLShortener = require("./lib/urlshortener"),
	CanIUse = require("./lib/caniuse");

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
	google: function(context, text) {
		FeelingLucky(text + " -site:w3schools.com", function(data) {
			if (data) {
				context.channel.send_reply (context.intent, 
					data.title+" <"+data.url+">", {color: false});
			} else {
				context.channel.send_reply (context.sender, "No search results found.");
			}
		});
	},

	mdn: function(context, text) {
		FeelingLucky(text + " site:developer.mozilla.org", function(data) {
			if (data) {
				context.channel.send_reply (context.intent, 
					data.title+" <"+data.url+">", {color: false});
			} else {
				context.channel.send_reply (context.sender, "No search results found.");
			}
		});
	},

	wpd: function(context, text) {
		FeelingLucky(text + " site:docs.webplatform.org", function(data) {
			if (data) {
				context.channel.send_reply (context.intent, 
					data.title+" <"+data.url+">", {color: false});
			} else {
				context.channel.send_reply (context.sender, "No search results found.");
			}
		});
	},

	validate: function(context, text) {
		HTMLValidator(text, function(data) {
			if (data.status === 'Invalid') {
				context.channel.send(text + " is " + data.status + " - Errors: " + data.errors + " Warnings: " + data.warnings + " Link: " + data.shortUrl, {color: false});
			}
			else if (data.status === 'Valid') {
				context.channel.send(text + " is " + data.status, {color: false});
			}
		});
	},

	shorten: function(context, text) {
		URLShortener(text, function(data) {
			context.channel.send(text + " is now shortened to " + data.shortUrl, {color: false});
		});
	},

	caniuse: function(context, text) {
		CanIUse(text, function(data) {
			context.channel.send_reply(context.intent, "link for " + text + " is " + data);
		});
	},
	
	learn: function(context, text) {
		try {
			if (context.sender.name !== 'emerson') {
				context.channel.send_reply(context.sender, "Sorry, only certain people can change factoids. Contact emerson if you want to be able to change them.");
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
				context.channel.send_reply(context.sender,
					"Learned `"+factoid+"` => `"+key+"`.");
				return;
			}

			/* Setting the text of a factoid */ 
			if (operation === "=") {
				this.factoids.learn(factoid, value, context.sender.name);
				context.channel.send_reply(context.sender, "Learned `"+factoid+"`.");
				return;

			/* Replacing the text of a factoid based on regular expression */
			}

		} catch (e) {
			context.channel.send_reply(context.sender, e);
		}
	},
	
	forget: function(context, text) {
		try {
			if (context.sender.host !== 'unaffiliated/emerson') {
				context.channel.send_reply(context.sender, "Sorry, only certain people can change factoids. Contact emerson if you want to be able to change them.");
				return;
			}
			this.factoids.forget(text, context.sender.name);
			context.channel.send_reply(context.sender, "I don't know anything about '"+text+"' anymore.");
		} catch(e) {
			context.channel.send_reply(context.sender, e);
		}
	},


	commands: function(context, text) {
		if(context.priv) {
			var commands = this.get_commands();
			var trigger = this.__trigger;
			context.channel.send_reply (context.intent,
				"Valid commands are: " + trigger + commands.join(", " + trigger));
		}
		else context.channel.send_reply (context.intent,
				"Output too noisy. PM me for this one.");
	},

	find: function(context, text) {
		factoidFindHelper(this, context, text);
	},

	findPlus: function(context, text, suppressSearch) {
		factoidFindHelper(this, context, text, suppressSearch);
	},

	ping: function(context, text) {
		context.channel.send_reply(context.sender, "Pong!");
	},

	iambot: function(context, text) {
		if (!context.intent) context.intent = context.sender;
		context.channel.send_reply(context.intent, "I am a bot :)");
	},

	op: function (context, text) {
		if(context.sender.host === 'unaffiliated/emerson') {
			context.client.get_user("ChanServ").send("OP " + context.channel.name + " " + text);
		}
		else {
			context.channel.send_reply(context.sender, "lol nice try :)");
		}
	},

	deop: function (context, text) {
		if (context.sender.host === 'unaffiliated/emerson') {
			context.client.get_user("ChanServ").send("DEOP " + context.channel.name + " " + text);
		}
		else {
			context.channel.send_reply(context.sender, "lol nice try :)");
		}
	},

	voice: function (context, text) {
		if (context.sender.host === 'unaffiliated/emerson') {
			context.client.get_user("ChanServ").send("VOICE "+ context.channel.name + " " + text);
		}
		else {
			context.channel.send_reply(context.sender, "lol nice try :)");
		}
	},

	devoice: function (context, text) {
		if (context.sender.host === 'unaffiliated/emerson') {
			context.client.get_user("ChanServ").send("DEVOICE " + context.channel.name + " " + text);
		}
		else {
			context.channel.send_reply(context.sender, "lol nice try :)");
		}
	},

	quiet: function (context, text) {
		if (context.sender.host === 'unaffiliated/emerson') {
			context.client.get_user("ChanServ").send("QUIET " + context.channel.name + " "+ text);
		}
		else {
			context.channel.send_reply(context.sender, "lol nice try :)");
		}
	},

	unquiet: function (context, text) {
		if (context.sender.host === 'unaffiliated/emerson') {
			context.client.get_user("ChanServ").send("UNQUIET "+ context.channel.name + " " + text);
		}
		else {
			context.channel.send_reply(context.sender, "lol nice try :)");
		}
	},

	kick: function (context, text) {
		if (context.sender.host === 'unaffiliated/emerson') {
			context.client.get_user("ChanServ").send("op " + context.channel.name);
			context.channel.kick(text);
			context.client.get_user("ChanServ").send("deop " + context.channel.name);
		}
		else {
			context.channel.send_reply(context.sender, "lol nice try :)");
		}
	},

	kickban: function (context, text) {
		if (context.sender.host === 'unaffiliated/emerson') {
			var mask = text+"!*@*";
			context.client.get_user("ChanServ").send("op " + context.channel.name);
			context.channel.kickban(text, mask);
			context.client.get_user("ChanServ").send("deop " + context.channel.name);
		}
		else {
			context.channel.send_reply(context.sender, "lol nice try :)");
		}
	},
};