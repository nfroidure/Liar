# Install required libs
mkdir www/javascript/libs

# RequireJS
mkdir www/javascript/libs/requirejs
wget -O http://requirejs.org/docs/release/2.1.6/comments/require.js > www/javascript/libs/requirejs/require.js

# Commandor
mkdir www/javascript/libs/commandor
wget -O https://raw.github.com/nfroidure/Commandor/master/Commandor.js > www/javascript/libs/commandor/Commandor.js
wget -O https://raw.github.com/nfroidure/Commandor/master/CommandPromise.js > www/javascript/libs/commandor/CommandPromise.js

# Promise
mkdir www/javascript/libs/promise
wget -O https://raw.github.com/nfroidure/Promise/master/Promise.js > www/javascript/libs/promise/Promise.js
mkdir www/javascript/libs/promise/dom
wget -O https://raw.github.com/nfroidure/Promise/master/dom/XHRPromise.js > www/javascript/libs/promise/dom/XHRPromise.js
wget -O https://raw.github.com/nfroidure/Promise/master/dom/WebSocketPromise.js > www/javascript/libs/promise/dom/WebSocketPromise.js

# Sounds
mkdir www/javascript/libs/sounds
wget -O https://raw.github.com/nfroidure/Sounds/master/Sounds.js > www/javascript/libs/sounds/Sounds.js
