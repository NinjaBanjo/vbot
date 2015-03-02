var vm = require("vm");
var fs = require("fs");
var crypto = require('crypto');
var exec = require('child_process').exec;

var Eval = module.exports = function(bot) {
    bot.register_command('js', this.runJS.bind(this));
    bot.register_command('node', this.runNode.bind(this));
    bot.register_command('ba', this.runBabel.bind(this));
    bot.register_command('bf', this.runBF.bind(this));
    bot.register_command('php', this.runPHP.bind(this));
    bot.register_command('perl', this.runPerl.bind(this));
    bot.register_command('rb', this.runRuby.bind(this));
    bot.register_command('py', this.runPython.bind(this));
    bot.register_command('py3', this.runPythonThree.bind(this));
};

Eval.prototype.runCode = function(context, command) {
    exec(command, {timeout: 5000}, function(error, stdout, stderr) {
        if (error !== null) this.saveError(context, stderr);
        else {
            context.bot.send_message(context.channel, stdout.replace(/\r?\n/g, " "), context.intent);
        }
    }.bind(this));
};

Eval.prototype.saveError = function(context, e) {
    var dump = e.replace(/\r?\n/g, " ");
    var filename = crypto.createHash('sha1').update(new Date().toString()).digest('hex').slice(0,8);
    fs.writeFile('files/errors/' + filename + ".txt", dump, function (err) {
        if (err) throw err;
    });
    var output = e.name + ": http://vbot.emersonveenstra.net/errors/" + filename + '.txt';
    context.bot.send_message(context.channel, output, context.sender);
};


Eval.prototype.runJS = function(context, text) {
    var output;
    try {
        output = vm.runInThisContext(text, {timeout: 5000});
        context.bot.send_message(context.channel, output, context.intent);
    }
    catch (e) {
        this.runBabel(context, text);
    }
};

Eval.prototype.runBF = function(context, text) {
    this.runCode(context, 'echo "' + text + '" | hsbrainfuck ');
};

Eval.prototype.runPHP = function(context, text) {
  this.runCode(context, 'php5 -r "' + text.replace(/\"/g, '\\"') + '"');
};

Eval.prototype.runPerl = function(context, text) {
    this.runCode(context, 'perl -e "' + text.replace(/\"/g, '\\"') + '"');
};

Eval.prototype.runRuby = function(context, text) {
    this.runCode(context, 'ruby -e "' + text.replace(/\"/g, '\\"') + '"');
};

Eval.prototype.runPython = function(context, text) {
    this.runCode(context, 'python -c "' + text.replace(/\"/g, '\\"') + '"');
};

Eval.prototype.runPythonThree = function(context, text) {
    this.runCode(context, 'python3 -c "' + text.replace(/\"/g, '\\"') + '"');
};

Eval.prototype.runNode = function(context, text) {
   this.runCode(context,'node -e "console.log(' + text.replace(/\"/g, '\\"') + ')"');
};

Eval.prototype.runBabel = function(context, text) {
    this.runCode(context, "babel-node -e 'console.log(" + text.replace(/\'/g, "\\'") + ")'");
};
