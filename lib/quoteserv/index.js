var JSONSaver = require("../jsonsaver");

var QuoteServer = module.exports = function(filename) {
    this.filename = filename;
    this.changed = false;
    this.loaded = false;
    this.db = new JSONSaver(filename);
};

QuoteServer.prototype.save = function(nick, quote) {
    nick = nick.toLowerCase();
    if (this.db.object.quotes[nick]) {
        this.db.object.quotes[nick].push(quote);
    }
    else {
        this.db.object.quotes[nick] = [quote];
    }
    this.db.activity();
};

QuoteServer.prototype.random = function(nick) {
    nick = nick.toLowerCase();
    var nick_quotes = this.db.object.quotes[nick];
    var random_number = Math.floor(Math.random() * nick_quotes.length);
    return nick_quotes[random_number];
};