var vm = require("vm");
var exec = require('child_process').exec;

var Eval = module.exports = function(bot) {
    bot.register_command('js', this.runJS);
    bot.register_command('node', this.runNode);
    bot.register_command('bf', this.runBF);
    bot.register_command('php', this.runPHP);
    bot.register_command('perl', this.runPerl);
    bot.register_command('rb', this.runRuby);
    bot.register_command('py', this.runPython);
    bot.register_command('py3', this.runPythonThree);
};

Eval.prototype.runJS = function(context, text) {
    var output;
    try {
        output = vm.runInThisContext(text, {timeout: 5000});
    }
    catch (e) {
        output = e.toString().slice(0, e.toString().indexOf("\n"));
    }
    context.bot.send_message(context.channel, output, context.intent);
};

Eval.prototype.runBF = function(context, text) {
    exec('echo "' + text + '" | hsbrainfuck', {timeout: 5000}, function(error, stdout, stderr) {
        if (error !== null) {
            context.bot.send_message(context.channel, stderr.replace(/\r?\n/g, " "), context.sender);
        }

        else {
            context.bot.send_message(context.channel, stdout.replace(/\r?\n/g, " "), context.intent);
        }
    });
};

Eval.prototype.runPHP = function(context, text) {
    exec('php5 -r "' + text.replace(/\"/g, '\\"') + '"', {timeout: 5000}, function(error, stdout, stderr) {
        if (error !== null) {
            context.bot.send_message(context.channel, stderr.replace(/\r?\n/g, " "), context.sender);
        }

        else {
            context.bot.send_message(context.channel, stdout.replace(/\r?\n/g, " "), context.intent);
        }
    });
};

Eval.prototype.runPerl = function(context, text) {
    exec('perl -e "' + text.replace(/\"/g, '\\"') + '"', {timeout: 5000}, function(error, stdout, stderr) {
        if (error !== null) {
            context.bot.send_message(context.channel, stderr.replace(/\r?\n/g, " "), context.sender);
        }

        else {
            context.bot.send_message(context.channel, stdout.replace(/\r?\n/g, " "), context.intent);
        }
    });
};

Eval.prototype.runRuby = function(context, text) {
    exec('ruby -e "' + text.replace(/\"/g, '\\"') + '"', {timeout: 5000}, function(error, stdout, stderr) {
        if (error !== null) {
            context.bot.send_message(context.channel, stderr.replace(/\r?\n/g, " "), context.sender);
        }

        else {
            context.bot.send_message(context.channel, stdout.replace(/\r?\n/g, " "), context.intent);
        }
    });
};

Eval.prototype.runPython = function(context, text) {
    exec('python -c "' + text.replace(/\"/g, '\\"') + '"', {timeout: 5000}, function(error, stdout, stderr) {
        if (error !== null) {
            context.bot.send_message(context.channel, stderr.replace(/\r?\n/g, " "), context.sender);
        }

        else {
            context.bot.send_message(context.channel, stdout.replace(/\r?\n/g, " "), context.intent);
        }
    });
};

Eval.prototype.runPythonThree = function(context, text) {
    exec('python3 -c "' + text.replace(/\"/g, '\\"') + '"', {timeout: 5000}, function(error, stdout, stderr) {
        if (error !== null) {
            context.bot.send_message(context.channel, stderr.replace(/\r?\n/g, " "), context.sender);
        }

        else {
            context.bot.send_message(context.channel, stdout.replace(/\r?\n/g, " "), context.intent);
        }
    });
};

Eval.prototype.runNode = function(context, text) {
    exec('node -e "console.log(' + text.replace(/\"/g, '\\"') + ')"', {timeout: 5000}, function(error, stdout, stderr) {
        if (error !== null) {
            context.bot.send_message(context.channel, stderr.replace(/\r?\n/g, " "), context.sender);
        }

        else {
            context.bot.send_message(context.channel, stdout.replace(/\r?\n/g, " "), context.intent);
        }
    });
};
