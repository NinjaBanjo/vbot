var vm = require("vm");

var Eval = module.exports = function(bot) {
    bot.register_command('js', this.runJS);
};

Eval.prototype.runJS = function(context, text) {
    var output = vm.runInThisContext(text);
    context.bot.send_message(context.channel, output, context.intent);
};
