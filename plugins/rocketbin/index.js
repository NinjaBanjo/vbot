var RocketBin = module.exports = function (bot) {
  bot.on(bot.EVENTS.receive_message, this.onMessage)
}

RocketBin.prototype.onMessage = function (context, text) {
  if (/http:\/\/pastebin.com\/[a-zA-Z0-9]+/.test(text) === true) {
    context.bot.send_message(context.channel, 'You should check out http://rocketb.in (it doesn\'t have ads)', context.intent);
  }
}