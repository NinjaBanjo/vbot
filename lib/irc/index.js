var util = require("util");
var events = require("events");

var Client = require("./client");


var utilities = {
	escape_regex: (function() {
		var cache = {};
		return function(string) {
			if (typeof cache[string] !== "undefined") return cache[string];
			cache[string] = string.replace(/[.*+?|()\\[\\]{}\\\\]/g, "\\$&");
			return cache[string];
		}
	})(),
	merge: function(defaults, options) {
		if (typeof options === "undefined") return defaults;
		var o = {};
		for (var i in defaults) {
			if (defaults.hasOwnProperty(i)) {
				o[i] = typeof options[i] === "undefined" ? defaults[i] : options[i];
			}
		}
		return o;
	}
};


/**
 * events:
 *   'command_not_found': function (channel, user, command);
 **/
var Bot = module.exports = function(profile) {

	// Confirm profile object is in correct form
	if (!Array.isArray (profile))
		profile = [profile];
	for (var i = 0, len = profile.length; i < len; i++) {
		if (!profile[i] || typeof profile[i] !== "object") {
			throw new Error("Bot constructor: profile[" + i + "] is not an object.");
		}
	}

	this.__profile = profile;
	this.__listening = [];

	// Used to identify message as command for bot
	this.__trigger = '.';

	this.__log_level = this.LOG_NONE;
	
	this.__commands = {};
	this.__commands_regex = null;
	this.__trigger_changed = true;
	
	process.on('uncaughtException', function(err) {
		process.stderr.write("\n"+err.stack+"\n\n");
	});
};

util.inherits(Bot, events.EventEmitter);

Bot.prototype.init = function() {
	// Connect to each IRC server
	for (var i = 0, len = this.__profile.length; i < len; i++) {
		var client = new Client(this.__profile[i]);
		client.on("welcome", this.listeners.welcome.bind(this));
		client.on("disconnect", this.listeners.disconnect.bind(this));
		client.on("join", this.listeners.join.bind(this));
		client.on("message", this.listeners.message.bind(this));
		client.on("pm", this.listeners.pm.bind(this));
		client.on("error", this.listeners.error.bind(this));
		client.on("invite", this.listeners.invite.bind(this));
		client.on("webhook", this.listeners.webhook.bind(this));
		
		Bot.prototype.log.call(this, this.LOG_CONNECT, client.name, "Connecting...");
		client.connect();
		if (this.__profile[0].travis_auth) {
			var travis = new Client.Webhook(client, 3001);
		}
	}
};

Bot.prototype.LOG_NONE = 0; // No logging
Bot.prototype.LOG_CONNECT = 1; // Log server connections
Bot.prototype.LOG_JOIN = 2; // Log channel joins/parts
Bot.prototype.LOG_COMMANDS = 4; // Log messages triggering commands
Bot.prototype.LOG_LISTENS = 8; // Log messages matching listeners
Bot.prototype.LOG_OUTGOING = 16; // Log anything the bot sends
Bot.prototype.LOG_INCOMING = 32; // Log anything the bot receives
Bot.prototype.LOG_UNKNOWN = 64; // Log unknown commands received from the server

Bot.prototype.LOG_ALL = -1; // Log everything

function pad2(n){ return ('0' + n).slice(-2); }

Bot.prototype.log = function(level, message) {
	var datetime = (new Date).toISOString();

	if (arguments.length > 2)
		message = Array.prototype.slice.call(arguments, 1).join(" ");
	if (this.__log_level == this.LOG_ALL || (level & this.__log_level))
		util.puts(datetime + " - " + message);
};

Bot.prototype.set_log_level = function(level) {
	this.__log_level = level;
};

/**
 * Listens for message matching the specified regex and calls the callback
 * function with:
 *
 * callback(context, text, 1st subpattern, 2nd subpattern, ...);
 **/
Bot.prototype.register_listener = function(regex, callback, options) {
	this.__listening.push({
		regex: regex,
		callback: callback,
		options: utilities.merge({
			allow_intentions: true // Parse `@ nick` after message
		}, options)
	});
};

/**
 * Add a new command to listen for: callback is called with (context, result)
 *  - result: the text that comes after the command
 **/
Bot.prototype.register_command = function(command, callback, pm) {
	
	command = command.toLowerCase();

	if (!pm) pm = true;
	
	switch (typeof callback) {
	case "function":
		this.__commands[command] = {	
			callback: callback,
			pm: pm,
		}
		break;
	case "string":
		callback = callback.toLowerCase();
		
		if (this.__commands.hasOwnProperty(callback)) {
			// The command is going to be an alias to `callback`
			this.__commands[command] = this.__commands[callback];
		} else {
			throw new Error(
				"Cannot alias `"+command+"` to non-existant command `"+callback+"`");
		}
		break;
	default:
		throw new Error(
			"Must take a function or string as second argument to register_command");
	}
};

Bot.prototype.get_commands = function() {
	var array = [];
	for (var i in this.__commands) {
		if (this.__commands.hasOwnProperty(i)) {
			array.push(i);
		}
	}
	return array.sort();
};

// Set the character that you use to signal a command to the bot
Bot.prototype.set_trigger = function(c) {
	this.__trigger = c;
	this.__trigger_changed = true;
};


Bot.prototype.quit = function() {
	process.exit();
};

Bot.prototype.listeners = {
	disconnect: function(client, why) {

		Bot.prototype.log.call(this, this.LOG_CONNECT, client.name,
			"Disconnected ("+why+"), reconnecting in 15s");
		
		var bot = this;

		setTimeout(function() {
			Bot.prototype.log.call(bot, bot.LOG_CONNECT, client.name,
				"Connecting...");
			
			client.connect();
		}, 15000);
	},
	welcome: function(client) {
		if (client.timeout) {
			clearTimeout(client.timeout);
			client.timeout = null;
		}

		var channels = client.profile.channels;
		for (var i = 0, len = channels.length; i < len; i++) {
			Bot.prototype.log.call(this, this.LOG_JOIN, client.name, "Joining", channels[i]+"...");
			client.get_channel(channels[i]).join();
		}
		
		this.emit("connect", client);
	},
	join: function(channel) {
		this.emit("join", channel);
		
		Bot.prototype.log.call(this, this.LOG_JOIN, channel.client.name, "Joined", channel.name);
	},
	pm: function(user, text) {
		this.emit("pm", user, text);
	
		var context = {
			channel: user,
			client: user.client,
			sender: user,
			intent: user,
			priv: true
		};
		
		text = text.trim();
		
		var command_matches;
		if (command_matches = text.match(/^(([A-Za-z]+)\s+(.*))$/)) {
			var full = command_matches[1];
			var command = command_matches[2].toLowerCase();
			var parameters = command_matches[3];
			
			Bot.prototype.log.call(this, this.LOG_LISTENS, user.client.name,
				"PM "+user.name+":", text);
			
			if (this.__commands.hasOwnProperty(command)) {
				this.__commands[command].callback.call(this, context, parameters, command);
			}

			else if (this.__commands.hasOwnProperty(full)) {
				this.__commands[command].callback.call(this, context, '', full);
			}

			else {
				var factoid = this.factoids.find(full);
				if (factoid) {
					this.__commands['factoid'].callback.call(this, context, factoid, 'factoid');
				}
			}
			return;
		}
	},
	message: function(channel, user, text) {

		this.emit("message", channel, user, text);

		if (user === 'webhook-travis') {
			this.__commands['webhook-travis'].callback.call(this, user, text, 'webhook-travis');
			return;
		}
	
		var context = {
			channel: channel,
			client: channel.client,
			sender: user,
			intent: user.name,
			priv: false
		};
				
		//Because why not?
		text = text.trim();

		Bot.prototype.log.call(this, this.LOG_LISTENS, channel.client.name, channel.name + ": ",
					context.sender.name + ": ", text);

		var karma = text.match(/^([A-Za-z0-9_-])\+\+/);
		if (karma) {
			this.__commands['addkarma'].callback.call(this, context, karma[1], 'addkarma');
		}

		// Set the intent to the sender initally, could be overriden later on
		var command_matches = text.match(/^(?:\.|vbot\:\s?)?([A-Za-z0-9]+)\s?(.*)?$/);
		if (command_matches) {
			var command = command_matches[1].toLowerCase();
			var params = command_matches[2];	
			if (this.__commands.hasOwnProperty(command)) {

				// These two commands need to return a factoid value in the callback.
				if(command === 'tell' || command === 'msg') {
					var full = params.match(/^([A-Za-z0-9_-]+)\sabout\s(.*)$/);
					var intent = full[1];
					var factoid = full[2];
					context.intent = intent;
					this.__commands[command].callback.call(this, context, factoid, command);
				}

				// Else check for intents and how to deliever the message (channel or pm)
				else if (params) {
					var split_intent = params.match(/^(.*?)\s*(@|>)\s*([A-Za-z0-9_-]+)$/i);
					if (split_intent) {
						params = split_intent[1];
						var msg_type = split_intent[2];
						var intent = split_intent[3];
					}

					//If its '>', rewrite the context to return in a pm
					if (msg_type === '>') {
						context.channel = user;
						context.client = user.client;
						context.priv = true;
					}
					//Write updated intent if it exists
					if (intent) context.intent = intent;
					this.__commands[command].callback.call(this, context, params, command);
				}

				else {
					this.__commands[command].callback.call(this, context, '', command);
				}
			} 

			//Factoids have to have a . in front to avoid accidental triggers
			else if (text.match(/^\./)) {

				//Don't search, if it's not there just silently quit. It's quieter that way.
				var factoid = this.factoids.find(command, true);
				if (factoid) {
					this.__commands['factoid'].callback.call(this, context, factoid, 'factoid');
				}
			}
			return;
		}
	},
	error: function (client, command, message) {
		Bot.prototype.log.call(this, this.LOG_UNKNOWN, client.name, command, message);
	},
	invite: function (client, user, channel) {
		Bot.prototype.log.call(this, this.LOG_INVITE, client.name,
			"Received invitation from " + user.name + " to " + channel.name);
		this.emit("invite", user, channel);
	},
	webhook: function(client, headers, body) {
		if (headers['travis-repo-slug']) {
			body = JSON.parse(body.payload);
			var message = "Build #" + body.id + ' ';
			switch (body.status_message) {
				case "Passed":
					message += "has passed. ";
					break;
				case "Pending":
					message += "is pending. ";
					break;
				case "Fixed":
					message += "is fixed. ";
					break;
				case "Broken":
					message += "is broken. ";
					break;
				case "Still Failing":
					message += "is still failing. ";
					break;
			}
			if (body.pull_request_number) {
				message += body.repository.url + "/pull/" + body.pull_request_number + " ";
			}

			message += body.build_url;

			client.get_channel(this.__profile[0].channels[0]).send(message);
			return;
		}
		if (headers['x-github-event']) {
			var message = '';
			switch (headers['x-github-event']) {
				case "push":
					if (typeof body.commits[0] !== 'undefined') {
						message += body.commits[0].author.username + " just pushed " + body.commits[0].message + " " + body.commits[0].url;
					}
					break;
				case "pull_request":
					message += body.pull_request.sender.login + " just ";
					if (body.action === 'closed' && body.pull_request.merged_at !== null) message += "merged ";
					else message += body.action + " ";
					message += body.pull_request.html_url;
					break;
				case "commit_comment":
					message += body.comment.sender.login + " just commented on " + body.comment.html_url;
					break;
				case "issue_comment":
					message += body.issue.sender.login + " just commented on " + body.issue.html_url;
					break;
				case "pull_request_review_comment":
					message += body.comment.sender.login + " just commented on " + body.comment.html_url;
					break;
				case "issues":
					message += body.issue.sender.login + " just " + body.action + " " + body.issue.html_url;
					break;
			}
			client.get_channel(this.__profile[0].channels[0]).send(message);
			return;
		}
	}
};
