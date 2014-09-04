var crypto = require('crypto');
var child_process = require('child_process');

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
		var run_phantom = child_process.spawn('phantomjs', ['normal_screenshot.js', url, location], {cwd: '/root/vbot/lib/phantomjs'});
		run_phantom.on('close', function(code) {
			if (code === 0) {
				callback.call(this, {
					location: remote_location
				});
			}
		});
	}
}
