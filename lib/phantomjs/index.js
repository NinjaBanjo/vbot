var phantom = require('phantom');
var crypto = require('crypto');

var large_desktop_size = [1920, 1080];
var regular_desktop_size = [1080, 720];
var large_tablet_size = [1024, 768];
var regular_tablet_size = [768, 1024];
var large_mobile_size = [520, 700];
var regular_mobile_size = [320, 568];

var PhantomJS = module.exports = {
	screenshot: function(url, callback) {
		var filename = crypto.createHash('md5').update(url).digest('hex').slice(-8) + '.jpg';

		var location = '/root/vbot-sites/screenshots/' + filename;
		var remote_location = 'http://vbot.testing.emersonveenstra.net/screenshots/' + filename;

		phantom.create(function(ph) {
			ph.createPage(function(page) {
				page.open(url, function(status) {
					page.clipRect = { top: 0, left: 0, width: 1080, height: 720 };
					page.evaluate(function() {
						document.body.style.width = '1080px';
						document.body.style.height = '720px';
					});
					page.render(location, {format: 'jpeg', quality: '100'});
					ph.exit();
					callback.call(this, {
						location: remote_location
					});
				});
			});
		});
	}
};