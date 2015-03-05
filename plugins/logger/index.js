var fs = require('fs');

var Logger = module.exports = function (bot) {
    bot.on(bot.EVENTS.message, this.logMessage);
};

Logger.prototype.logMessage = function (context, text) {
    var logFile = context.bot.profile.logger.logFile;
    var loggedLine = context.channel + ' [' + context.sender + ']' + ' ' + text;
        fs.appendFile(logFile, '\n' + loggedLine, function () {
            console.log('Logged: ' + loggedLine);
        });
}