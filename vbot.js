var file = require('fs');
var path = require('path');
var util = require("util");
var http = require("http");

var FactoidServer = require("./lib/factoidserv");
var FeelingLucky = require("./lib/feelinglucky");
var CanIUseServer = require("./lib/caniuse");

var Bot = require("./lib/irc");
var Shared = require("./shared");


var JSBot = function(profile) {
	this.factoids = new FactoidServer(path.join(__dirname, "vbot-old-factoids.json"));
	this.caniuse_server = new CanIUseServer;
	this.executeRegex = /^((?:sm|v8|js|>>?|\|)>)([^>].*)+/;

	Bot.call(this, profile);
	this.set_log_level(this.LOG_ALL);
	this.set_trigger("emersonbot");
};


util.inherits(JSBot, Bot);


JSBot.prototype.init = function() {
	Bot.prototype.init.call(this);

	this.register_listener(this.executeRegex, Shared.execute_js);

	this.register_command("google", Shared.google);
	this.register_command("g", "google");

	this.register_command("validate", Shared.validate);

	this.register_command("shorten", Shared.shorten);

	this.register_command("mdn", this.mdn);
	
	this.register_command("caniuse", this.caniuse);
	this.register_command("ciu", "caniuse");

	this.register_command("ping", Shared.ping);

	this.register_command("are you a bot?", Shared.amibot);
	this.register_command("what are you?", 'are you a bot?');
	this.register_command("who are you?", 'are you a bot?');
	this.register_command("bot", 'are you a bot?');

	this.register_command("learn", Shared.learn);

	this.register_command("forget", Shared.forget);

	this.register_command("commands", Shared.commands);

	this.register_command("op", Shared.opbot);
	this.register_command("deop", Shared.deopbot);
	this.register_command("voice", Shared.voicebot);
	this.register_command("devoice", Shared.devoicebot);
	this.register_command("quiet", Shared.quiet);
	this.register_command("unquiet", Shared.unquiet);
	this.register_command("kick", Shared.kick);
	this.register_command("kickban", Shared.kickban);
	
	this.register_command("aboutme", this.aboutme);

	this.on('command_not_found', this.command_not_found);

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

JSBot.prototype.aboutme = function(context, text) {
	console.log(context);
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
