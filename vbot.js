var net = require("net");
var fs = require("fs");

var Bot = module.exports = function(profile) {
    this.port = profile.port;
    this.host = profile.host;
    this.buffer = '';

    this.nick = profile.nick;
    this.user = profile.user;
    this.real = profile.real;

    this.channels = profile.channels;

    this.logfile = profile.logfile;
    this.nicklog = {};

    process.on('uncaughtException', function(err) {
        process.stderr.write("\n"+err.stack+"\n\n");
    });

    fs.readFile(this.logfile, function (err, data) {
		try {
			if (err) throw err;
			console.log("Loaded file");
			this.object = JSON.parse(data);
		} 
        catch (e) {console.log(e);} 
	}.bind(this));
    
    setTimeout(this.save_log().bind(this), 60*60*1000);

    console.log("connecting...");
    this.connection = net.createConnection(this.port, this.host);
    this.connection.setKeepAlive(true);
    this.connection.setEncoding("utf-8");
    this.connection.on('data', this.receive_data.bind(this));
    this.connection.on('connect', this.connect.bind(this));
};

Bot.prototype.disconnect = function(client, why) {
    console.log("disconnected: "+why);
    setTimeout(this.connect(), 15000);
};

Bot.prototype.connect = function() {
    this.connection.write("NICK "+this.nick + "\r\n" + "USER "+this.user+" 0 * :"+this.real + "\r\n", "utf-8");
};

Bot.prototype.receive_data = function(chunk) {
    this.buffer += chunk;
    while (this.buffer) {
        var offset = this.buffer.indexOf("\r\n");
        if (offset < 0) return;
        var incoming = this.buffer.substr(0, offset);
        this.buffer = this.buffer.substr(offset + 2);
        console.log(incoming);
        incoming = String(incoming);
        incoming = incoming.replace(/\x03\d{0,2},?\d{1,2}|[\x02\x06\x07\x0f\x16\x17\x1b\x1d\x1f]/g, "");
        incoming = incoming.replace(/[\x00\x01\x04\x05\x08-\x0e\x10-\x15\x18-\x1a\x1c\x1e]/g, "");
        if (incoming.match(/PRIVMSG/)) {
            var msg = incoming.match(/^\:(\S+)\!\S+\sPRIVMSG\s(\S+)\s.*$/);
            console.log(msg);
            this.log_nick(msg[2], msg[1]);
        }
        else if (incoming.match(/INVITE/)) {
            var channel = incoming.match(/(\#\w+)/);
            this.connection.write("JOIN " + channel+ "\r\n", "utf-8");
        }
        else if (incoming.match(/PING/)) {
            var message = incoming.match(/^PING\s(\:.+)$/);
            this.connection.write("PONG " + message + "\r\n", "utf-8");
        }
        else if (incoming.match(/376/)) {
            for (var i=0; i<this.channels.length; i++) {
           	    this.connection.write("JOIN "+ this.channels[i] + "\r\n", "utf-8");
            }
            console.log("connected");
        }
    }
};

Bot.prototype.log_nick = function(channel, nick) {
    console.log(nick, channel);
    if (this.nicklog[channel]) {
        if (this.nicklog[channel][nick]) this.nicklog[channel][nick]++;
        else this.nicklog[channel][nick] = 1;
    }
    else {
        this.nicklog[channel] = {};
        this.nicklog[channel][nick] = 1;
    }
};

Bot.prototype.save_log = function() {
	try {
		var write = JSON.stringify(this.nicklog, null, "\t");
		fs.writeFile(this.logfile, write, function (err) {
			if (err) this.connection.write("PRIVMSG emerson :help me pls");
			console.log("Wrote file");
		}).bind(this);
	} 
    catch (e) {this.connection.write("PRIVMSG emerson :help me pls");}   
};

var profile = require('./profile.js');
(new Bot(profile));
