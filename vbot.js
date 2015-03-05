var net = require("net");
var tls = require("tls");
var https = require("https");
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Bot = module.exports = function(profile) {
    this.profile = profile;
    this.buffer = '';
    this.commands = {};
    process.on('uncaughtException', function(err) {
        process.stderr.write("\n"+err.stack+"\n\n");
    });
    this.init();
};

// Inherit the EventEmitter so we can use events
util.inherits(Bot, EventEmitter);

Bot.prototype.init = function() {
    console.log("connecting...");
    this.connection = tls.connect(this.profile.port, this.profile.host, {});
    this.connection.setKeepAlive(true);
    this.connection.setEncoding("utf-8");
    this.connection.on('data', this.receive_data.bind(this));
    this.connection.on('secureConnect', this.secureConnect.bind(this));
    for (var plugin in this.profile.plugins) {
        if (this.profile.plugins.hasOwnProperty(plugin)) {
            this[plugin] = new this.profile.plugins[plugin](this);
        }
    }
    console.log('plugins loaded');
};

Bot.prototype.register_command = function(command, callback) {
    command = command.toLowerCase();
    switch (typeof callback) {
        case "function":
            this.commands[command] = {callback: callback};
            break;
        case "string":
            callback = callback.toLowerCase();
            this.commands[command] = this.commands[callback];
            break;
        default:
            throw new Error("Must take a function or string as second argument to register_command");
    }
};

Bot.prototype.disconnect = function(client, why) {
    console.log("disconnected: "+why);
};

Bot.prototype.parse_message = function(channel, sender, text) {
    text = text.trim();

    var context = {
        bot: this,
        channel: channel,
        intent: sender,
        sender: sender,
        text: text
    };

    this.emit(this.EVENTS.message, context, text);

    if (context.channel === this.profile.nick) context.channel = context.sender;
    var message_matches = text.match(/^[\.\`\!]([^@]+)(?:\s@\s(.*))?$/);
    if (message_matches) {
        if (message_matches[2]) context.intent = message_matches[2];
        var possible_command = message_matches[1].match(/^(\w+)\s?(.*)?$/);
        if (possible_command && this.commands[possible_command[1]]) {
            var command = possible_command[1];
            var params = possible_command[2] || '';
            this.commands[command].callback.call(this, context, params, command);
        }
        else {
            var factoid = message_matches[1];
            this.commands['factoid'].callback.call(this, context, factoid, 'factoid');
        }
    }
};

Bot.prototype.parse_raw = function(incoming) {
    incoming = String(incoming);
    incoming = incoming.replace(/\x03\d{0,2},?\d{1,2}|[\x02\x06\x07\x0f\x16\x17\x1b\x1d\x1f]/g, "");
    incoming = incoming.replace(/[\x00\x01\x04\x05\x08-\x0e\x10-\x15\x18-\x1a\x1c\x1e]/g, "");
    var match = incoming.match(/(?:(:[^\s]+) )?([^\s]+) (.+)/);

    var msg, params = match[3].match(/(.*?) ?:(.*)/);
    if (params) {
        // Message segment
        msg = params[2];
        // Params before message
        params = params[1].split(" ");
    }

    else {
        params = match[3].split(" ");
    }

    var prefix = match[1];
    var command = match[2];

    var charcode = command.charCodeAt(0);
    if (charcode >= 48 && charcode <= 57 && command.length == 3) {
        command = parseInt(command, 10);
    }

    return {prefix: prefix, command: command, params: params, message: msg};
};

Bot.prototype.send_raw = function(message) {
    this.connection.write(message + "\r\n", this.encoding);
};

Bot.prototype.secureConnect = function() {
    this.send_raw("NICK "+this.profile.nick);
    this.send_raw("USER "+this.profile.user+" 0 * :"+this.profile.real);
};

Bot.prototype.receive_data = function(chunk) {
    this.buffer += chunk;

    while (this.buffer) {
        var offset = this.buffer.indexOf("\r\n");
        if (offset < 0) {
            return;
        }
        var message = this.buffer.substr(0, offset);
        this.buffer = this.buffer.substr(offset + 2);

        message = this.parse_raw(message);

        if (message !== false) {
            switch (message.command) {
                case 1: // RPL_WELCOME
                    for (var i=0; i<this.profile.channels.length; i++) {
                        this.send_raw("JOIN " + this.profile.channels[i]);
                    }
                    console.log("connected");
                    break;
                case 376:
                    this.send_message("NickServ", "identify "+this.profile.password);
                    break;
                case "PING":
                    this.send_raw("PONG :"+message.message);
                    break;
                case "PRIVMSG":
                    var mask = message.prefix.match(/^:(.*)!(\S+)@(\S+)/);
                    var text = message.message;
                    var channel = message.params[0];
                    this.parse_message(channel, mask[1], text);
                    break;
                case "JOIN":
                    var channel = message.message || message.params[0];
                    var mask = message.prefix.match(/^:(.*)!(\S+)@(\S+)/);
                    this.parse_message(channel, mask[1], 'join');
                    break;
                case "INVITE":
                    this.send_raw("JOIN "+message.message);
                    console.log(message);
                    break;
                default:
                    var type = this.profile.noLog.indexOf(message.command);
                    if (type === -1) console.log(message);
                    break;
            }
        }
    }
};

Bot.prototype.send_message = function(channel, message, user) {
    if (user) message = user + ": " + message;
    this.send_raw("PRIVMSG " + channel + " :" + message);
};

Bot.prototype.shorten_url = function(url, cb) {
    var options = {
	  	hostname: 'www.googleapis.com',
	  	port: 443,
	  	path: '/urlshortener/v1/url',
	  	method: 'POST',
	  	headers: {
	  		"Content-Type": "application/json"
	  	}
	};
    var self= this;
	var req = https.request(options, function(res) {
	  	res.setEncoding('utf8');
	  	res.on('data', function (chunk) {
		    body = JSON.parse(chunk);
            cb.call(self, body.id);
		});
	});

	var payload = '{"longUrl": "'+ url + '"}';

	req.write(payload);

	req.on('error', function(e) {
	  	console.log('problem with request: ' + e.message);
	});
	req.end();
};

Bot.prototype.EVENTS = {
    message: 'message'
}

var profile = require('./profile.js');
(new Bot(profile));
