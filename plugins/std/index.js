var Std = module.exports = function(bot) {
    bot.register_command('ping', this.pong);
    bot.register_command('html', this.whatwg);
    bot.register_command('lmgtfy', this.lmgtfy);
    bot.register_command('bot', this.iambot);
};

Std.prototype.pong = function(context, text) {
    context.bot.send_message(context.channel, 'pong', context.intent);
};

Std.prototype.whatwg = function(context, text) {
    var url = "http://www.whatwg.org/specs/web-apps/current-work/multipage/semantics.html#the-" + text + "-element";
    context.bot.send_message(context.channel, url, context.intent);
};

Std.prototype.lmgtfy = function(context, text) {
    context.bot.send_message(context.channel, "http://lmgtfy.com/?q=" + text, context.intent);
};

Std.prototype.iambot = function(context, text) {
    context.bot.send_message(context.channel, "I am a bot :)", context.intent);
};
