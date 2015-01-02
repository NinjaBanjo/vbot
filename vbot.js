var net = require("net");
var plugins = require("./plugins.js");

var Bot = module.exports = function(profile) {
    this.profile = profile;
    this.port = profile.port;
    this.host = profile.host;
    this.ssl = profile.ssl || false;

    this.buffer = '';

    this.nick = profile.nick;
    this.user = profile.user;
    this.real = profile.real;
    this.password = profile.password;

    this.channels = profile.channels;

    this.commands = {};

    process.on('uncaughtException', function(err) {
        process.stderr.write("\n"+err.stack+"\n\n");
    });
    this.init();
};

Bot.prototype.init = function() {
    console.log("connecting...");
    this.connection = net.createConnection(this.profile.port, this.profile.host);
    this.connection.setKeepAlive(true);
    this.connection.setEncoding("utf-8");
    this.connection.on('data', this.receive_data.bind(this));
    this.connection.on('connect', this.connect.bind(this));
    for (var plugin in plugins) {
        if (plugins.hasOwnProperty(plugin)) {
            this[plugin] = new plugins[plugin](this);
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
    setTimeout(this.connect(), 15000);
};

Bot.prototype.parse_message = function(channel, sender, text) {
    //no pms
    if (channel.indexOf('#') === -1) return;
    text = text.trim();

    var context = {
        bot: this,
        channel: channel,
        intent: sender,
        text: text
    };

    var command_matches = text.match(/^(\w+)\s?(.*)?$/);
    var factoid_matches = text.match(/^\.([^@]+)(?:\s@\s(.*))?$/);
    if (command_matches) {
        var command = command_matches[1].toLowerCase();
        var params = command_matches[2] || false;
        if (this.commands[command]) {
            if (params) {
                var split_intent = params.match(/^(\w+)\s@\s?(\w+\s*)+$/i);
                if (split_intent) {
                    params = split_intent[1];
                    if (split_intent[2]) context.intent = split_intent[2];
                }
            }
            this.commands[command].callback.call(this, context, params, command);
        }
    }
    else if (factoid_matches) {
        var factoid = factoid_matches[1];
        if (factoid_matches[2]) context.intent = factoid_matches[2];

        this.commands['factoid'].callback.call(this, context, factoid, 'factoid');
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

Bot.prototype.connect = function() {
    this.send_raw("NICK "+this.nick);
    this.send_raw("USER "+this.user+" 0 * :"+this.real);
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
                    for (var i=0; i<this.channels.length; i++) {
                        this.send_raw("JOIN " + this.channels[i]);
                    }
                    console.log("connected");
                    break;
                case 376:
                    this.send_message("NickServ", "identify "+this.password);
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
                    break;
                default:
                    break;
            }
        }
    }
};

Bot.prototype.send_message = function(channel, message, user) {
    if (user) message = user + ": " + message;
    this.send_raw("PRIVMSG " + channel + " :" + message);
};

var profile = require('./profile.js');
(new Bot(profile));
