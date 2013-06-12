# Install required libs
mkdir www/javascript/libs

# RequireJS
mkdir www/javascript/libs/requirejs
wget -O http://requirejs.org/docs/release/2.1.6/comments/require.js > www/javascript/libs/requirejs/require.js

# Commandor
mkdir www/javascript/libs/commandor
wget -O https://raw.github.com/nfroidure/Commandor/master/Sounds.js > www/javascript/libs/commandor/Commandor.js

# Promise
mkdir www/javascript/libs/promise
wget -O https://raw.github.com/nfroidure/Promise/master/Promise.js > www/javascript/libs/promise/Promise.js
wget -O https://raw.github.com/nfroidure/Promise/master/XHRPromise.js > www/javascript/libs/promise/XHRPromise.js
wget -O https://raw.github.com/nfroidure/Promise/master/WebSocketPromise.js > www/javascript/libs/promise/WebSocketPromise.js

# Sounds
mkdir www/javascript/libs/sounds
wget -O https://raw.github.com/nfroidure/Sounds/master/Sounds.js > www/javascript/libs/sounds/Sounds.js
