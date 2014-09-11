var https = require("https");

var Travis = module.exports = function(repo_owner, repo_name, auth_token) {
    this.repo_owner = repo_owner;
    this.repo_name = repo_name;
    this.auth_token = auth_token;
};

function http_request(path, method, auth_token, callback) {
    var headers;
    console.log(auth_token);
    if (auth_token) {
        headers = {
            "Accept": "application/vnd.travis-ci.2+json",
            "User-Agent": "vbot/0.1.0",
            "Authorization": "token " + auth_token
        }
    }
    else {
        headers = {
            "Accept": "application/vnd.travis-ci.2+json",
            "User-Agent": "vbot/0.1.0"
        }
    }
    var options = {
        hostname: 'api.travis-ci.org',
        port: 443,
        path: path,
        method: method,
        headers: headers
    };
    var body;
    var req = https.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            body = JSON.parse(chunk.toString());
            if (callback) callback.call(this, body);
        });
    });

    req.on('error', function(e) {
        console.log(e);
    });

    req.end();
    
}

Travis.prototype.get_build_status = function(build_id, callback) {
    var requested_data = {};
    var path = '/repos/' + this.repo_owner + '/' + this.repo_name + '/builds/' + build_id;
    var url = 'http://travis-ci.org/' + this.repo_owner + '/' + this.repo_name + '/builds/' + build_id;
    http_request(path, 'GET', false, function(json_output) {
        requested_data.number = json_output.build['number'];
        requested_data.state = json_output.build['state'];
        requested_data.url = url;
        callback.call(this, requested_data);
    });
}

Travis.prototype.restart_build = function(build_id) {
    var path = '/builds/' + build_id + '/restart';
    http_request(path, "POST", this.auth_token);
}