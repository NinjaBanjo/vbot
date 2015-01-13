var https = require("https");

var URLShortener = module.exports = function(bot) {
    bot.register_command('s', this.shorten);
    bot.register_command('shorturl', 's');
};

URLShortener.prototype.shorten = function(context, text) {
	var options = {
	  	hostname: 'www.googleapis.com',
	  	port: 443,
	  	path: '/urlshortener/v1/url',
	  	method: 'POST',
	  	headers: {
	  		"Content-Type": "application/json"
	  	}
	};
    var bot= this.bot;
	var req = https.request(options, function(res) {
	  	res.setEncoding('utf8');
	  	res.on('data', function (chunk) {
		    body = JSON.parse(chunk);
            context.bot.send_message(context.channel, body.id, context.intent);
		});
	});

	var payload = '{"longUrl": "'+ text + '"}';

	req.write(payload);

	req.on('error', function(e) {
	  	console.log('problem with request: ' + e.message);
	});
	req.end();
};
