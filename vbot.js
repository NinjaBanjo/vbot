var util = require("util");
var path = require("path");

var Bot = require("./lib/irc");
var Commands = require("./commands");

var FactoidServer = require("./lib/factoidserv");


var JSBot = function(profile) {
	this.factoids = new FactoidServer(path.join(__dirname, "vbot-old-factoids.json"));
	Bot.call(this, profile);
	this.set_log_level(this.LOG_ALL);
	this.set_trigger(".");
};


util.inherits(JSBot, Bot);


JSBot.prototype.init = function() {
	Bot.prototype.init.call(this);

	this.register_command("google", Commands.google);
	this.register_command("factoid", Commands.factoid);

	this.register_command("validate", Commands.validate);

	this.register_command("shorten", Commands.shorten);

	this.register_command("mdn", Commands.mdn);

	this.register_command("wpd", Commands.wpd);
	
	this.register_command("ciu", Commands.caniuse);
	this.register_command("tell", Commands.tell);
	this.register_command("msg", Commands.msg);

	this.register_command("ping", Commands.ping);
	this.register_command("bot", Commands.iambot);

	this.register_command("learn", Commands.learn);
	this.register_command("forget", Commands.forget);
	this.register_command("commands", Commands.commands);

	this.register_command("op", Commands.op);
	this.register_command("deop", Commands.deop);
	this.register_command("voice", Commands.voice);
	this.register_command("devoice", Commands.devoice);
	this.register_command("quiet", Commands.quiet);
	this.register_command("unquiet", Commands.unquiet);
	this.register_command("kick", Commands.kick);
	this.register_command("kickban", Commands.kickban);
	this.register_command("whois", Commands.whois);
};

var profile = require("./vbot-profile.js");
(new JSBot(profile)).init();
