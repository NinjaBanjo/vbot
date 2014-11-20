vbot
========

This is vbot, a Node.js IRC bot for web developers. See wiki for list of commands and stuff.


Features
--------

* Manages bot commands with an easy API
* Support for "intents" which is when you append "@ user" after a bot command, so the bot can reply to that person (not currently working)
* Context object provides information about bot command invocations, including:
  * Who invoked the command
  * Who was it "intended" for
  * Was this invoked in the channel or in a private message?
* Can listen for regular expression matches
* Control logging amount to standard out
* Inherits from Node.js's built-in EventEmitter
* Manages user lists and recognizes mode changes
* Don't worry about flooding the channel with built-in support for truncation
* Default option is to strip control codes and colors
* Each channel and user is represented as a unique JavaScript object with extra information, e.g. channel topic, or user op status
* Includes extra optional libraries:
  * FactoidServ: Manages a list of factoids which are saved and loaded to disk automatically
  * FeelingLucky: Performs a quick Google "I'm Feeling Lucky" search

API
---

The underlying IRCBot library has methods which make it easy to add functionality.

### Bot(profile)
@profile: An array of objects representing each server to connect to.

This is the main constructor for the bot. It is suggested that you inherit from this object when creating your bot, but you don't have to.

A profile is an array of objects. Each object has the properties:

* host: The domain name or IP of an IRC server to connect to. Default: "localhost"
* port: A port number. Default: 6667.
* nick: A string nick name to try to connect as. Default: "guest"
* password: The password used to connect (This is not NickServ). Default: null
* user: Your IRC username
* real: Your 'real name' on IRC
* channels: An array of channel names to connect to. (e.g. ["#stuff", "##mychannel", "#yomama"])


### bot.init()
Goes through each server in the profile and begins connecting and registering event listeners.


### bot.register_command(command, callback, [pm])
Adds a command.

* command: A string value for the command
* callback: A function to call when the command is run
* pm: Optional boolean value for if the command is allowed in pm's with the bot. Default is true, false disallows use in pm's.

When the command is called, the callback is called with the arguments:

* context: A context object
* text: The command arguments


Additional Documentation
------------------------

This bot AND/OR bot library is still being developed, but those are some of the basic commands. 

Sample Profile
---

Copy this to vbot-profile.js:

```
module.exports = [{
	host: 'chat.freenode.net',
	port: 6667,
	user: 'yournick',
	nick: 'yournick',
	real: 'yournick',

	password: 'yourpass',

	channels: [
		'#whatever'
	]
}];
```
