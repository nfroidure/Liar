Liar : A Multiplayer game full of lies :)
==============

Play
-------------
You can try the game here : http://liar.insertafter.com/index.html

Synopsis
-------------
You've got 10 points for 5 questions. The computer show a general culture question, players invent an answer.

Then the computer show all the answers, including the right answer. You choose the answer that seems right to you and bet 1 to 3 points.

If you selected the right answer, you keep your point, otherwise, the answer author win your points.

The winner is the one who saved the most points.

Requirements
-------------
* Modern web browser (Chrome, Firefox ...)
* NodeJS + npm install websocket
* Libs : RequireJS, Promis, Commandor, Sounds.

Building
-------------
```bash
npm install -g requirejs
cd www
# Debug
r.js -o baseUrl=./javascript/ name=Application out=javascript/production.js optimize=none
# Production
r.js -o baseUrl=./javascript/ name=Application out=javascript/production.js
```

Testing
-------------
```bash
npm install -g request mocha; mocha tests/*.mocha.js
```

Launching
-------------
```bash
node server.js
```

Sounds
-------------
* Iwan Gabovitch - http://qubodup.net/
* Devin Watson - http://opengameart.org/users/dklon

License
-------
Copyright Nicolas Froidure 2013.
