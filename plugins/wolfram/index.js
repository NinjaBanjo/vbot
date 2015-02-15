var http = require('http');
var xml = require('libxmljs');

var WolframAlpha = module.exports = function(bot) {
    bot.register_command('w', this.queryWolfram);
    bot.register_command('wolfram', 'w');
};

WolframAlpha.prototype.queryWolfram = function(context, text) {
    if (text == "") {
        context.bot.send_message(context.channel, "I need something to send...", context.sender);
        return;
    }

    var url = 'https://www.wolframalpha.com/input/?i=' + encodeURIComponent(text);

    var options = {
        hostname: 'api.wolframalpha.com',
        port: 80,
        path: '/v2/query?input=' + encodeURIComponent(text) + '&primary=true&appid=' + context.bot.profile.wolframKey,
        method: 'GET',
        headers: {
            "User-Agent": "Mozilla/5.0 vbot/0.1.0"
        }
    };
    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        var body = '';
        res.on('data', function(chunk) {body += chunk;});
        res.on('end', function() {
            var doc = xml.parseXml(body), root = doc.root();

            if(root.attr('error').value() != 'false') {
                var message = root.get('//error/msg').text()
                context.bot.send_message(context.channel, "Sorry, an error occured :/", context.sender);
                console.log(message);
                return;
            }
            else {
                root.find('pod').map(function(pod) {
                    var title = pod.attr('title').value();
                    if (title === "Result") {
                        var value = pod.find('subpod').map(function(node) {return node.get('plaintext').text();});
                        context.bot.send_message(context.channel, value, context.intent);
                    }
                });
            }
        });
    });

    req.on('error', function(e) {
        console.log(e);
    });

    req.end();
};
