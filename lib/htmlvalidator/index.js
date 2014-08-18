var http = require("http");
var URLShortener = require("../urlshortener");

var HTMLValidator = module.exports = function(query, callback) {
	
	var shortUrl;
	var longUrl = 'http://validator.w3.org/check?uri=' + encodeURIComponent(query);
	URLShortener(longUrl, function(data) {
			shortUrl = data.shortUrl;
	});

	var self = this;
	var options = {
	  	hostname: 'validator.w3.org',
	  	port: 80,
	  	path: '/check?uri=' + encodeURIComponent(query),
	  	method: 'GET',
	  	headers: {
	  		"Accept": "text/html;q=0.9,*/*;q=0.8", 
	  		"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2126.2 Safari/537.36\nAccept-Language: en-US,en;q=0.8"
	  	}
	};

	var req = http.request(options, function(res) {
	  	res.setEncoding('utf8');
	  	callback.call(self, {
	  		errors: res.headers['x-w3c-validator-errors'], 
	  		warnings: res.headers['x-w3c-validator-warnings'], 
	  		status: res.headers['x-w3c-validator-status'],
	  		shortUrl: shortUrl
	  	});
	});

	req.on('error', function(e) {
	  	console.log('problem with request: ' + e.message);
	});
	req.end();
};
