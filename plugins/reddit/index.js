var Reddit = module.exports = function(bot) {
    bot.on(bot.EVENTS.message, this.onMessage);
}

Reddit.prototype.onMessage = function(context, text) {
    var regex = new RegExp(/\/?r\/[A-Za-z0-9][A-Za-z0-9_]{2,20}/);
    var domain_check = new RegExp(/http:\/\/reddit.com/);
    var not_regex = new RegExp(domain_check.source + regex.source);
    if((regex).test(text) && !(not_regex).test(text)) {
        var subreddit = text.match(regex);
        if(subreddit.indexOf('/') === 0) subreddit = subreddit.substr(1);
        context.bot.send_message(context.channel, 'http://reddit.com/' + subreddit, context.intent);
    }
}