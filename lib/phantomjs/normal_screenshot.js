var webPage = require('webpage');
var page = webPage.create();
var args = require('system').args;

page.viewportSize = { width: 1080, height: 720 };
page.open(args[1], function start(status) {
  page.render(args[2], {format: 'jpeg', quality: '70'});
  phantom.exit();
});

