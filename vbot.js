var util = require("util");
var path = require("path");

var Bot = require("./lib/irc");
var Commands = require("./commands");

var FactoidServer = require("./lib/factoidserv");
var CanIUseServer = require("./lib/caniuse");


var JSBot = function(profile) {
	this.factoids = new FactoidServer(path.join(__dirname, "vbot-old-factoids.json"));
	this.caniuse_server = new CanIUseServer;
	Bot.call(this, profile);
	this.set_log_level(this.LOG_ALL);
	this.set_trigger(".");
};


util.inherits(JSBot, Bot);


JSBot.prototype.init = function() {
	Bot.prototype.init.call(this);

	//Technically it's more of a lucky search, only returns one result
	this.register_command("google", Commands.google);
	this.register_command("g", "google");

	// Never called directly, just an interface for factoids
	this.register_command("factoid", Commands.factoid);

	//Only HTML Validator right now, CSS (and maybe JS) coming soon
	this.register_command("validate", Commands.validate);
	this.register_command("v", "validate");

	//Goo.gl shortener
	this.register_command("shorten", Commands.shorten);
	this.register_command("s", "shorten");

	//Search MDN docs
	this.register_command("mdn", Commands.mdn);

	//Search WPD docs
	this.register_command("wpd", Commands.wpd);
	
	//Gives caniuse data and links
	this.register_command("caniuse", Commands.caniuse);
	this.register_command("ciu", "caniuse");

	// Info/giving factoids
	this.register_command("tell", Commands.tell, false);
	this.register_command("msg", Commands.msg, false);
	// this.register_command("notice", Commands.notice, false);

	this.register_command("ping", Commands.ping);
	this.register_command("bot", Commands.iambot);

	//factoid stuff
	this.register_command("learn", Commands.learn);
	this.register_command("forget", Commands.forget);
	this.register_command("commands", Commands.commands);

	//Power stuff
	this.register_command("op", Commands.op, false);
	this.register_command("deop", Commands.deop, false);
	this.register_command("voice", Commands.voice, false);
	this.register_command("devoice", Commands.devoice, false);
	this.register_command("quiet", Commands.quiet, false);
	this.register_command("unquiet", Commands.unquiet, false);
	this.register_command("kick", Commands.kick, false);
	this.register_command("kickban", Commands.kickban, false);
	this.register_command("whois", Commands.whois);
};

var profile = require("./vbot-profile.js");
(new JSBot(profile)).init();
