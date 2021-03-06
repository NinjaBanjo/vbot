var fs = require("fs");

var FactoidServer = module.exports = function(bot) {
	this.changed = false;
    this.file = bot.profile.factoids;
    fs.readFile(this.file, function (err, data) {
		try {
			if (err) throw err;

			console.log("Loaded file: "+this.file);
			this.db = JSON.parse(data);
		}
        catch (e) {
			console.log("JSON Parse Error: "+e);
		}
	}.bind(this));

    bot.register_command('learn', this.learn.bind(this));
    bot.register_command('alias', this.alias.bind(this));
    bot.register_command('forget', this.forget.bind(this));
    bot.register_command('factoid', this.find.bind(this));
    //bot.register_command('searchfactoid', this.search);
};

FactoidServer.prototype.learn = function(context, text) {
    if (text === "") {
        context.bot.send_message(context.channel, "I think you need to learn how to properly use me.", context.sender);
        return;
    }
    if (context.channel.indexOf('#') === -1) {
        context.bot.send_message(context.channel, "Sorry, factoids can't be changed in pm. Go to ##vbot to change factoids.", context.sender);
        return;
    }
    var key_matches = text.match(/^([^=]+)\s=\s(.+)$/);
    var key = key_matches[1].toLowerCase();
    var value = key_matches[2];
	this.db[key] = {value: value};
    context.bot.send_message(context.channel, "Okay, I learned that", context.intent);
    console.log("I learned " + key + " is " + value + " from " + context.sender);
    this.save();
};

FactoidServer.prototype.alias = function(context, text) {
     if (text === "") {
        context.bot.send_message(context.channel, "I think you need to learn how to properly use me.", context.sender);
        return;
    }
    if (context.channel.indexOf('#') === -1) {
        context.bot.send_message(context.channel, "Sorry, factoids can't be changed in pm. Go to ##vbot to change factoids.", context.sender);
        return;
    }
	var key_matches = text.match(/^([^>]+)\s>\s(.+)$/);
    var alias = key_matches[1];
    var key = key_matches[2];
    key = key.toLowerCase();
	alias = alias.toLowerCase();

	if (typeof this.db[key] === "undefined") {
        context.bot.send_message(context.channel, "Factoid `"+key+"` doesn't exist.", context.sender);
        return;
    }

	if (alias === key) {
        context.bot.send_message(context.channel, "Cannot alias yourself.", context.sender);
        return;
    }

	this.db[alias] = {alias: key}
    context.bot.send_message(context.channel, "Done.", context.intent);
    console.log("I learned " + alias + " is an alias for " + key + " from " + context.sender);
    this.save();
};


FactoidServer.prototype.find = function(context, text) {
	key = text.toLowerCase();

	if (typeof this.db[key] === "undefined") {
		// This is noisy...
        //context.bot.send_message(context.channel, "Sorry, i don't know what that is :/", context.sender);
        return;
	}

	if (typeof this.db[key].alias !== "undefined") {
		return this.find(context, this.db[key].alias);
	}
    context.bot.send_message(context.channel, this.db[key].value, context.intent);
};


FactoidServer.prototype.search = function(context, text) {
	var num = 5;
	var found = [], cat, db = this.db.object.factoids;
	pattern = text.toLowerCase();

	for (var i in db) {
		if (db.hasOwnProperty(i)) {
			if (typeof db[i].value === "undefined") continue;

			cat = (i+" "+db[i].value).toLowerCase();
			if (~cat.indexOf(pattern)) {
				found.push(i);
			}
		}
	}

	found.sort(function(a, b) { return db[b].popularity - db[a].popularity; });
	return found.slice(0, num);
};


FactoidServer.prototype.forget = function(context, text) {
	 if (text === "") {
        context.bot.send_message(context.channel, "Did you forget how to use me?", context.sender);
        return;
    }
    key = text.toLowerCase();

	if (typeof this.db[key] === "undefined") {
		context.bot.send_message(context.channel, "`"+key+"` was not a factoid.", context.sender);
        return;
	}
    if (context.channel.indexOf('#') === -1) {
        context.bot.send_message(context.channel, "Sorry, factoids can't be changed in pm. Go to ##vbot to change factoids.", context.sender);
        return;
    }

	delete this.db[key];
    context.bot.send_message(context.channel, "I've forgotten what I knew about " + key, context.sender);
    console.log(context.sender + " told me to forget about " + key);
    this.save();
};

FactoidServer.prototype.save = function() {
	try {
		var write = JSON.stringify(this.db, null, "\t");
		fs.writeFile(this.file, write, function (err) {
			if (err) throw err;
		});
	}
    catch (e) {
		console.log("Cannot stringify data: "+e.name+": "+e.message);
	}
};
