var fs = require('fs');

var Logger = module.exports = function (bot) {
    var logFolder = bot.profile.logger.logFolder;
    // Ensure that the configured log folder exists, if not attempt to make it
    fs.mkdir(logFolder, 0770, function (err) {
        if (!err) {
            console.log('LOGGER: Log directory created');
        } else if(err.code.toUpperCase() === "EEXIST") {
            console.log('LOGGER: Log directory exists, nothing to do');
        } else {
            console.log('LOGGER: Error creating log directory');
            throw new Error(err.toString());
        }
    });

    // Register with the message event so we can log messages
    bot.on(bot.EVENTS.message, this.logMessage);
};

Logger.prototype.logMessage = function (context, text) {
    var logFolder = context.bot.profile.logger.logFolder,
        logFile = context.channel.toLowerCase(),
        loggedLine = '[' + context.sender + ']:' + ' ' + text;

    // Write out to log
    fs.appendFile(logFolder + '/' + logFile, '\n' + loggedLine, function () {
        console.log('LOGGER: Logged: ' + loggedLine);
    });
}