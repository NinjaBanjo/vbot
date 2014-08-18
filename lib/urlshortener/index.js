var https = require("https");

var URLShortener = module.exports = function(query, callback) {
	var self = this;
	var options = {
	  	hostname: 'www.googleapis.com',
	  	port: 443,
	  	path: '/urlshortener/v1/url',
	  	method: 'POST',
	  	headers: {
	  		"Content-Type": "application/json"
	  	}
	};

	var body;

	var req = https.request(options, function(res) {
	  	res.setEncoding('utf8');
	  	res.on('data', function (chunk) {
		    body = JSON.parse(chunk);
		    callback.call(self, {
				shortUrl: body.id
			});
		});
	});

	var payload = '{"longUrl": "'+query + '"}';

	req.write(payload);

	req.on('error', function(e) {
	  	console.log('problem with request: ' + e.message);
	});
	req.end();
};
