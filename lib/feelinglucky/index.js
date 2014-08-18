var http = require("http");

var FeelingLucky = module.exports = function(query, callback) {
	var self = this;
	var options = {
	  	hostname: 'ajax.googleapis.com',
	  	port: 80,
	  	path: '/ajax/services/search/web?v=1.0&q=' + encodeURIComponent(query),
	  	method: 'GET'
	};

	var req = http.request(options, function(res) {
	  	res.setEncoding('utf8');
	  	var body = "";
		res.on('data', function(chunk) { body += chunk; });
		res.on('end', function() {
			var searchResults = JSON.parse(body);
			var results = searchResults.responseData.results;

			if (results && results[0]) {
				results[0].url = decodeURIComponent(results[0].url);
				callback.call(self,
					{
						title: results[0].titleNoFormatting.replace(/&#(\d+);/g,
							function(a, b){return String.fromCharCode(b);}),
						url: results[0].url
					});
			} else {
				callback.call(self, null);
			}
		});
	});

	req.on('error', function(e) {
	  	console.log('problem with request: ' + e.message);
	});
	req.end();
};
