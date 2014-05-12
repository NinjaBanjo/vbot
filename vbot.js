var file = require('fs');
var path = require('path');
var util = require("util");
var http = require("http");

var Sandbox = require("./lib/sandbox");
var FactoidServer = require("./lib/factoidserv");
var FeelingLucky = require("./lib/feelinglucky");
var CanIUseServer = require("./lib/caniuse");

var Bot = require("./lib/irc");
var Shared = require("./shared");


var JSBot = function(profile) {
	this.sandbox = new Sandbox(path.join(__dirname, "vbot-utils.js"));
	this.factoids = new FactoidServer(path.join(__dirname, "vbot-old-factoids.json"));
	this.caniuse_server = new CanIUseServer;
	this.executeRegex = /^((?:sm|v8|js|>>?|\|)>)([^>].*)+/;

	Bot.call(this, profile);
	this.set_log_level(this.LOG_ALL);
	this.set_trigger("vbot: "); // Exclamation
};


util.inherits(JSBot, Bot);


JSBot.prototype.init = function() {
	Bot.prototype.init.call(this);

	this.register_listener(this.executeRegex, Shared.execute_js);

	this.register_command("google", Shared.google, {
		help: "Run this command with a search query to return the first Google result. Usage: google kitten images"});

	this.register_command("mdn", this.mdn, {
		help: "Search the Mozilla Developer Network. Usage: mdn bitwise operators"});

	this.register_command("ecma", this.ecma, {
		help: "Lookup a section from the ECMAScript spec. Usage: ecma null value"});

	this.register_command("caniuse", this.caniuse, {
		help: "Search the caniuse.com database. Usage: caniuse webgl"});
	this.register_command("ciu", "caniuse");

	this.register_command("ping", Shared.ping);

	this.register_command("auth", Shared.reauthenticate, {
		allow_intentions: false,
		help: "Attempt to re-authenticate with NickServ."});

	this.register_command("learn", Shared.learn, {
		allow_intentions: false,
		help: "Add factoid to bot. Usage: learn ( [alias] foo = bar | foo =~ s/expression/replace/gi )"});

	this.register_command("forget", Shared.forget, {
		allow_intentions: false,
		help: "Remove factoid from bot. Usage: forget foo"});

	this.register_command("commands", Shared.commands);

	this.on('command_not_found', this.command_not_found);

	this.load_ecma_ref();

};

JSBot.prototype.re = function(context, msg) {
	// Okay first we need to check for the regex literal at the end
	// The regular expression to match a real js regex literal
	// is too long, so we need to use a simpler one.
	var regexmatches, regexliteral = /\/((?:[^\\\/]|\\.)*)\/([gi]*)$/;

	if (regexmatches = msg.match(regexliteral)) {
		try {
			var regexpobj = new RegExp(regexmatches[1], regexmatches[2]);
		} catch (e) {
			/* We have an invalid regular expression */
			context.channel.send_reply(context.sender, e.message);
			return;
		}

		var texttomatch = msg.slice(0, -regexmatches[0].length).trim();
		var result = texttomatch.match(regexpobj);
		if (result === null) {
			context.channel.send_reply(context.intent, "No matches found.");
			return;
		}

		var reply = [];
		for (var i = 0, len = result.length; i < len; i++) {
			reply.push(typeof result[i] !== "undefined" ?
				"'"+result[i]+"'" :
				"[undefined]");
		}

		context.channel.send_reply(context.intent, "Matches: "+reply.join(", "), {truncate: true});
	} else {
		context.channel.send_reply(context.sender, this.get_command_help("re"));
	}
};

JSBot.prototype.mdn = function(context, text, command) {
	if (!text) {
		return Shared.findPlus.call(this, context, command);
	}

	Shared.google (context, "site:developer.mozilla.org "+text);
};


JSBot.prototype.command_not_found = function(context, text) {
	Shared.findPlus.call(this, context, text, !context.priv);
};

JSBot.prototype.ecma = function(context, text) {
	try {

	if (typeof this.ecma_ref === "undefined") {
		context.channel.send_reply(context.sender, "The ECMA-262 reference is not loaded.");
		return;
	}

	text = text.toLowerCase();
	var ref = this.ecma_ref, ch = text.charCodeAt(0);

	// If text begins with a number, the search must match at the beginning of the string
	var muststart = ch >= 48 && ch <= 57; 

	for (var i = 0, len = ref.length; i < len; i++) {
		var item = ref[i], title = item.title.toLowerCase();
		if (muststart ? title.substring(0, text.length) === text : ~title.indexOf(text)) {
			context.channel.send_reply(context.intent,
				"Found: " + item.title + " <http://es5.github.io/#" + item.id + ">");
			return;
		}
	}

	throw new Error("Could not find text '"+text+"' in the ECMAScript 5.1 Table of Contents.");

	} catch (e) { context.channel.send_reply(context.sender, e); }
};


JSBot.prototype.load_ecma_ref = function() {
	var filename = path.join(__dirname, "vbot-ecma-reference.json");
	util.puts("Loading ECMA-262 reference...");
	var bot = this;
	file.readFile(filename, function (err, data) {
		if (err) util.puts(util.inspect(err));
		try {
			bot.ecma_ref = JSON.parse(data);
		} catch (e) {
			util.puts("ECMA-262 Error: "+e.name+": "+e.message);
		}
	});
	if (typeof this.ecma_ref_watching === "undefined") {
		this.ecma_ref_watching = true;
		file.watchFile(filename, function (curr, prev) {
			util.puts("ECMA-262 reference file has changed.");
			bot.load_ecma_ref();
		});
	}
};

JSBot.prototype.caniuse = function(context, text) {
	try {
		var text = this.caniuse_server.search(text);
		context.channel.send_reply(context.intent, text, {color: true});
	} catch(e) {
		context.channel.send_reply(context.sender, e);
	}
};

var profile = require("./vbot-profile.js");
(new JSBot(profile)).init();