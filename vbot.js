var util = require("util");
var path = require("path");

var Bot = require("./lib/irc");
var Commands = require("./commands");

var FactoidServer = require("./lib/factoidserv");
var CanIUseServer = require("./lib/caniuse");
var TravisServer = require('./lib/travis');
var QuoteServer = require('./lib/quoteserv');


var JSBot = function(profile) {
	this.factoids = new FactoidServer(path.join(__dirname, "vbot-old-factoids.json"));
	this.quotes = new QuoteServer(path.join(__dirname, "quotes.json"));
	this.caniuse_server = new CanIUseServer;
	this.travis_bot = new TravisServer(profile[0].repo_owner, profile[0].repo_name, profile[0].travis_auth);
	Bot.call(this, profile);
	this.set_log_level(this.LOG_ALL);
};


util.inherits(JSBot, Bot);


JSBot.prototype.init = function() {
	Bot.prototype.init.call(this);

	//Technically it's more of a lucky search, only returns one result
	this.register_command("google", Commands.google);
	this.register_command("g", "google");

	// Never called directly, just an interface for factoids
	this.register_command("factoid", Commands.factoid);
	
	this.register_command("quote", Commands.quote);

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

	//Returns a link to the WHATWG HTML LS definition for an element
	this.register_command("whatwg", Commands.whatwg);

	this.register_command("lmgtfy", Commands.lmgtfy);
	this.register_command("l", "lmgtfy");

	// Info/giving factoids
	this.register_command("tell", Commands.tell, false);
	this.register_command("msg", Commands.msg, false);

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
	this.register_command("whois", Commands.whois);
	this.register_command("join", Commands.join);

	//PhantomJS stuff
	this.register_command('screenshot', Commands.screenshot);

	//Travis CI stuff
	this.register_command('build', Commands.build);
	this.register_command('restart', Commands.restart);
};

var profile = require("./vbot-profile.js");
(new JSBot(profile)).init();
