var http = require("http");

var HTMLValidator = module.exports = function(bot) {
    bot.register_command('v', this.validate);
    bot.register_command('validate', 'v');
};

HTMLValidator.prototype.validate = function(context, text) {
    if (text === "") {
        context.bot.send_message(context.channel, "It would be nice if you gave me a site to validate...", context.sender);
        return;
    }
	var url = 'http://validator.w3.org/check?uri=' + encodeURIComponent(text);

	var options = {
	  	hostname: 'validator.w3.org',
	  	port: 80,
	  	path: '/check?uri=' + encodeURIComponent(text),
	  	method: 'GET',
	  	headers: {
	  		"Accept": "text/html;q=0.9,*/*;q=0.8",
	  		"User-Agent": "Mozilla/5.0 vbot/0.1.0"
        }
	};

	var req = http.request(options, function(res) {
	  	res.setEncoding('utf8');
        var message = text + ' is ';
	  	var numOfErrors = res.headers['x-w3c-validator-errors'];
	  	var numOfWarnings = res.headers['x-w3c-validator-warnings'];
	    var status = res.headers['x-w3c-validator-status'];
        message += status.toLowerCase();
        if (status === 'Invalid') message += ' with ' + numOfErrors + ' errors and ' + numOfWarnings + ' warnings. See full validation here: ' + url;
        else message += '.';
        context.bot.send_message(context.channel, message, context.intent);
	});

	req.on('error', function(e) {
	  	console.log('problem with request: ' + e.message);
	});
	req.end();
};
