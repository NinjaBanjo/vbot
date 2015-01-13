var http = require('http');

var FeelingLucky = module.exports = function(bot) {
    bot.register_command('l', this.lucky);
    bot.register_command('g', 'lucky');
    bot.register_command('mdn', this.mdn);
    bot.register_command('wpd', this.wpd);
};

FeelingLucky.prototype.lucky = function(context, text) {
    search(context, text + ' -site:w3schools.com');
};

function search(context, text) {
	var options = {
	  	hostname: 'ajax.googleapis.com',
	  	port: 80,
	  	path: '/ajax/services/search/web?v=1.0&q=' + encodeURIComponent(text),
	  	method: 'GET'
	};
	var req = http.request(options, function(res) {
	  	res.setEncoding('utf8');
	  	var body = '';
		res.on('data', function(chunk) { body += chunk; });
		res.on('end', function() {
			var searchResults = JSON.parse(body);
			var results = searchResults.responseData.results;

			if (results && results[0]) {
				var url = decodeURIComponent(results[0].url);
				var title = results[0].titleNoFormatting.replace(/&#(\d+);/g,
							function(a, b){return String.fromCharCode(b);});
                context.bot.send_message(context.channel, title + ' ' + url, context.intent);
            }
		});
	});

	req.on('error', function(e) {
	  	console.log(e);
	});
	req.end();
}

FeelingLucky.prototype.mdn = function(context, text) {
    search(context, text + ' site:developer.mozilla.org');
};

FeelingLucky.prototype.wpd = function(context, text) {
    search(context, text + ' site:docs.webplatform.org');
};
