var https = require("https");

var URLShortener = module.exports = function(bot) {
    bot.register_command('s', this.shorten);
    bot.register_command('shorturl', 's');
};

URLShortener.prototype.shorten = function(context, text) {
    context.bot.shorten_url(text, function(shortUrl) {
        context.bot.send_message(context.channel, shortUrl, context.intent);
    });
};
