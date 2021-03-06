var memos = {};
var Memo = module.exports = function(bot) {
    bot.register_command('tell', this.save);
    bot.register_command('memo', 'tell');
    bot.register_command('msg', 'tell');
    bot.register_command('getallmemos', this.get_memos);
    bot.register_command('join', this.tell);
};

Memo.prototype.save = function(context, text) {
    var split_command = text.match(/^(\w+)\s(.*)$/);
    if (split_command) {
        var nick = split_command[1];
        var memo = split_command[2];

        if (typeof memos[nick] === 'undefined') memos[nick] = [];
        if (typeof memos[nick][context.channel] === 'undefined') memos[nick][context.channel] = [];

        memos[nick][context.channel].push(context.intent + ' said '+memo);
        context.bot.send_message(context.channel, 'I will tell '+nick, context.intent);
    }
};

Memo.prototype.tell = function(context, text) {
    if (context.intent.indexOf('_') === context.intent.length - 1) {
        context.intent = context.intent.slice(0, -1);
    }
    if (memos[context.intent] && memos[context.intent][context.channel]) {
        if (memos[context.intent][context.channel].length < 3) {
            for (var i=0; i<memos[context.intent][context.channel].length; i++) {
                context.bot.send_message(context.channel, memos[context.intent][context.channel].pop(), context.intent);
            }
        }
        else {
            for (var i=0; i<memos[context.intent][context.channel].length; i++) {
                context.bot.send_message(context.intent, memos[context.intent][context.channel].pop(), context.intent);
            }
        }
    }
};

Memo.prototype.get_memos = function() {
    console.log(memos);
};
