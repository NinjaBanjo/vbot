var net = require("net");
var tls = require("tls");
var https = require("https");
var fs = require("fs");
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Bot = module.exports = function () {
    this.loadProfile(this.init);
    this.buffer = '';
    this.commands = {};
    this.loadedPlugins = [];
    this.EVENTS = {
        message: 'message',
        join: 'join',
        ident: 'ident',
        invite: 'invite'
    }
    process.on('uncaughtException', function (err) {
        process.stderr.write("\n" + err.stack + "\n\n");
    });
};

// Inherit the EventEmitter so we can use events
util.inherits(Bot, EventEmitter);

Bot.prototype.init = function () {
    console.log("connecting...");
    this.connection = tls.connect(this.profile.port, this.profile.host, {});
    this.connection.setKeepAlive(true);
    this.connection.setEncoding("utf-8");
    this.connection.on('data', this.receive_data.bind(this));
    this.connection.on('secureConnect', this.secureConnect.bind(this));
    this.loadPlugins();
};

Bot.prototype.loadPlugins = function () {
    for (var plugin in this.profile.plugins) {
        if (this.profile.plugins.hasOwnProperty(plugin)) {
            var plugin_object = require(this.profile.plugins[plugin]);
            this.loadedPlugins.push(new plugin_object(this));
        }
    }
    this.register_command('reload', function (context, text) {
        context.bot.reload.call(context.bot)
    });
    var loadedCount = Object.keys(this.profile.plugins).length;
    console.log('Loaded ' + loadedCount + ' plugins');
    this.send_message(this.profile.logchannel, 'Loaded ' + loadedCount + ' plugins');
}

Bot.prototype.reload = function () {
    // empty require() cache so plugins get loaded freshly
    for (var key in this.profile.plugins) {
        var pluginPath = require.resolve(this.profile.plugins[key]);
        delete require.cache[pluginPath];
    }
    this.loadProfile(function () {
        var self = this;
        this.commands = {};
        this.removeAllListeners();
        this.loadedPlugins.forEach(function (item) {
            if (typeof item.unload === "function") {
                item.unload(self);
            }
        });
        this.loadedPlugins = [];
        this.loadPlugins();
    });
}

Bot.prototype.register_command = function (command, callback) {
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

Bot.prototype.disconnect = function (client, why) {
    console.log("disconnected: " + why);
};

Bot.prototype.parse_message = function (context, message_type) {
    var text = context.text
    switch (message_type) {
        case 'message':
            this.emit(this.EVENTS.message, context, text);
            break;
        case 'join':
            this.emit(this.EVENTS.join, context, text);
            break;
        default:
            this.emit(this.EVENTS.raw, context, text);
            break;
    }

    if (context.channel === this.profile.nick) context.channel = context.sender;
    var message_matches = text.match(/^[\.\`\!]([^@]+)/);
    if (message_matches) {
        var possible_command = message_matches[1].match(/^(\w+)\s?(.*)?$/);
        if (possible_command && this.commands[possible_command[1]]) {
            var command = possible_command[1];
            var params = possible_command[2] || '';
            this.commands[command].callback.call(this, context, params, command);
        }
        else if (typeof this.commands.factoid !== "undefined") {
            var factoid = message_matches[1];
            this.commands['factoid'].callback.call(this, context, factoid, 'factoid');
        }
    }
};

Bot.prototype.parse_raw = function (incoming) {
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

Bot.prototype.send_raw = function (message) {
    this.connection.write(message + "\r\n", this.encoding);
};

Bot.prototype.secureConnect = function () {
    this.send_raw("NICK " + this.profile.nick);
    this.send_raw("USER " + this.profile.user + " 0 * :" + this.profile.real);
};

Bot.prototype.buildContext = function (message, overrides) {
    var sender = message.prefix.match(/^:(.*)!(\S+)@(\S+)/);
    var intent = message.message.match(/(?:\s@\s(.*))/);
    var context = {
        bot: this,
        channel: message.params[0],
        sender: sender[1],
        intent: (intent !== null ? intent[1] : sender[1]),
        text: message.message || ''
    };
    for(var key in overrides) {
        if(overrides.hasOwnProperty(key)) {
            context[key] = overrides[key];
        }
    }
    // trim the text
    context.text.trim();
    return context
}

Bot.prototype.receive_data = function (chunk) {
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
            if (typeof message.command === "string") message.command = message.command.toUpperCase();
            switch (message.command) {
                case 1: // RPL_WELCOME
                    for (var i = 0; i < this.profile.channels.length; i++) {
                        this.send_raw("JOIN " + this.profile.channels[i]);
                    }
                    console.log("connected");
                    break;
                case 376:
                    this.send_message("NickServ", "identify " + this.profile.password);
                    this.emit(this.EVENTS.ident, this.buildContext(message), null);
                    break;
                case "PING":
                    this.send_raw("PONG :" + message.message);
                    break;
                case "PRIVMSG":
                    this.parse_message(this.buildContext(message), 'message');
                    break;
                case "JOIN":
                    this.parse_message(this.buildContext(message), 'join');
                    break;
                case "INVITE":
                    var mask = message.prefix.match(/^:(.*)!(\S+)@(\S+)/);
                    this.send_raw("JOIN " + message.message);
                    this.send_message(this.profile.logchannel, mask[0] + " invited me to " + message.message);
                    this.emit(this.EVENTS.invite, this.buildContext(message))
                    break;
                default:
                    var type = this.profile.noLog.indexOf(message.command);
                    if (type === -1) console.log(message);
                    break;
            }
        }
    }
};

Bot.prototype.send_message = function (channel, message, user) {
    if (user) message = user + ": " + message;
    this.send_raw("PRIVMSG " + channel + " :" + message);
};

Bot.prototype.shorten_url = function (url, cb) {
    var options = {
        hostname: 'www.googleapis.com',
        port: 443,
        path: '/urlshortener/v1/url',
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        }
    };
    var self = this;
    var req = https.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            var body = JSON.parse(chunk);
            var shorturl = body.id || url;
            cb.call(self, body.id);
        });
    });

    var payload = '{"longUrl": "' + url + '"}';

    req.write(payload);

    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
    req.end();
};

Bot.prototype.loadProfile = function (cb) {
    this.profilePath = process.argv[2] || './profile.json';
    fs.readFile(this.profilePath, function (err, data) {
        try {
            if (err) throw err;
            console.log("Loaded profile");
            this.profile = JSON.parse(data);
            cb.call(this);
        }
        catch (e) {
            console.log("JSON Parse Error: " + e);
        }
    }.bind(this));
};

Bot.prototype.saveProfile = function () {
    try {
        var write = JSON.stringify(this.profile, null, "\t");
        fs.writeFile(this.profilePath, write, function (err) {
            if (err) throw err;
        });
    }
    catch (e) {
        console.log("Cannot stringify data: " + e.name + ": " + e.message);
    }
};

(new Bot());
