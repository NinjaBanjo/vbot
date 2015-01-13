vbot
========

This is vbot, a Node.js IRC bot for web developers. It aims to be an unobtrusive, fast bot that helps channels give information more efficently. 

vbot uses a modular architecture. The core does nothing more than connect, register commands, and send and recieve the messages. All functionality is done using plugins. Each plugin has its own folder inside `plugins/`. When a plugin is initialized, it registers commands that are added to a list of 'trigger words'. Once the bot sees a message starting with the trigger word, it executes a specified function, passing a context object, and the text of the message.

Sample Profile
---

Copy this to profile.js:

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
