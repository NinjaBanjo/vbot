vbot
========

vbot is an IRC bot meant to be quick and modular. Basic functionality is handled with a group of core functions, and the rest of the functionality is implemented using plugins.

Better docs are coming soon (hopefully), but for now, here's an overview:

##Triggers

All commands and factoids must be prefixed with a trigger key. Currently the trigger key can be either `.`, \`, or `!`

---

##Plugins

All commands are documented below, along with requirements, notes and other things. `command/othercommand` means those are aliases, and typing either `.command` or `.othercommand` will give the same result.

#####caniuse

Commands:
* `ciu/caniuse <feature>` Returns info from caniuse about a feature
* `searchciu <text>` Searches for different features

#####eval

Commands:
* `js <code>` A JavaScript interpreter.
* `bf <code>` A brainfuck interpreter.
* `php <code>` A PHP interpreter.
* `perl <code>` Perl interpreter
* `rb <code>` Ruby interpreter
* `py <code>` Python 2 interpreter
* `py3 <code>` Python 3 interpreter

Requirements:
Needs the `hsbrainfuck`, `perl`, `php5-cli`, `ruby`, `python`, `python3` packages installed for the respective interpreters to work

Notes: This is meant to be used for simple one-line scripts and small outputs. All newlines will be replaced by a space to prevent flooding

#####factoidserv

Commands:
* `learn <key> = <value>` Stores the factoid in a json file, when someone types `.key` the bot will reply with `value`.
* `alias <newkey> > <key>` Aliases a key to a factoid.
* `forget <key>` Removes key from file

Requirements:
Needs a `factoids.json` file in the `factoidserv` directory

Note: For security, since there is no auth system, these commands are disabled in PM.

Also, factoids are called in the same way triggers are. The bot will look for a trigger first, then a factoid.

#####feelinglucky

Commands:
* `l/lucky/g/google <text>` Returns the first google result for a search term
* `mdn <text>` Returns the first MDN result
* `wpd <text>` Returns the first WebPlatform Docs result

#####htmlvalidator

Commands:
* `v/validate <url>` Returns HTML validation info from the W3 Validator.

#####memo

Commands:
* `tell/msg/memo <nick> <message>` Stores the message and will relay when the nick joins next
* `join` If someone accidentally memos you when you're online, this will force a relay of messages for you

Note: These are only stored in memory, so they will be lost if the bot terminates

#####std

Commands:
* `ping` Bot replies `pong`
* `lmgtfy` Gives an lmgtfy link
* `bot` Replies `I am a bot :)`

#####urlshortener

Commands:
`s/shorten <url>` Returns a goo.gl shortened url

#####wolfram

Commands:
`w/wolfram <query>` Returns the result from wolfram

Requirements:
Needs the node module `libxmljs` to be installed

Also needs a WolframAlpha API key in the profile as `wolframKey: 'AAAAA-AAAAAAAA'`

---

##Make your own plugins

All plugins follow the same format. They are Objects, and each plugin is constructed when the bot starts. The constructor is passed the main `bot` object, and each plugin registered a command keyword using `bot.register_command(listener, function)`, where `listener` is a string the bot listens for, and `function` is the function that is called when the listener is triggered.

When a function is called by a listener, it is given `context` and `text` parameters. `context` contains information about the command, and has these properties:

* `context.sender` The nick that triggered the command
* `context.intent` The nick the command is intended for. If the command had `@ nick` at the end, it will reply to that nick, otherwise it is the same as`context.sender`
* `context.channel` The channel the command came from. If its a PM, this will be a nick.
* `context.bot` The main bot object, for sending messages and other helper functions.

`text` is a string of the text after the command.

`context.bot.send_message(channel, message[, intent])` is the main way to send messages to the channel/PM. `channel` is the channel to send it to, normally `context.channel`. `message` is the text to send. The optional `sender` will prefix the message with `nick: `.


##Profile
---

All settings are stored in a profile.js file in the top level

```
module.exports = {
	host: 'chat.freenode.net',
	port: 6697, //vbot uses TLS only
	user: 'yournick',
	nick: 'yournick',
	real: 'yournick',

	password: 'yourpass', //This will be sent to NickServ, not the server

	channels: [
		'#whatever',
        '#somethingelse'
	]

    //Add and remove plugins here. Only the ones here will be loaded
    plugins: {
        caniuse: require('./plugins/caniuse/index.js'),
        eval: require('./plugins/eval/index.js'),
        factoidserv: require('./plugins/factoidserv/index.js'),
        feelinglucky: require('./plugins/feelinglucky/index.js'),
        htmlvalidator: require('./plugins/htmlvalidator/index.js'),
        memo: require('./plugins/memo/index.js'),
        std: require('./plugins/std/index.js'),
        urlshortener: require('./plugins/urlshortener/index.js'),
        wolfram: require('./plugins/wolfram/index.js')
    },

    //By default, vbot logs all other messages to stdout. Any commands matched here won't be logged.
    noLog: ["NICK", "PART", "QUIT", 372, 375],

    wolframKey: 'AAAAAA-AAAAAAA' //Only if you're using wolfram plugin
};
```
