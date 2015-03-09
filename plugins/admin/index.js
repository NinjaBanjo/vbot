var Admin = module.exports = function(bot) {
    bot.register_command("admin", this.parseCommand);
};

Admin.prototype.parseCommand = function(context, text) {
    if (context.bot.profile.admins.indexOf(context.sender) === -1) {
        context.bot.send_message(context.channel,
                                "You are not authorized to use this module.", context.sender);
        return;
    }
    var params = text.split(" ");
    switch(params[0].toLowerCase()) {
        case "reload":
            context.bot.reload();
            break;
        case "auth":
            context.bot.profile.admins.push(params[1]);
            context.bot.saveProfile();
            context.bot.send_message(context.channel, "Added " + params[1], context.sender);
            break;
        case "join":
            context.bot.profile.channels.push(params[1]);
            context.bot.saveProfile();
            context.bot.send_raw("JOIN " + params[1]);
            context.bot.send_message(context.channel, "Joined " + params[1], context.sender);
            break;
    }
};
