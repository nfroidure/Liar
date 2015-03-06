var Promise = require('ia-promise');
var ViewPromise = require('./ViewPromise');

var Views = {
	Answer: require('./AnswerPromise'),
	Game: require('./GamePromise'),
	Rooms: require('./RoomsPromise'),
	Profile: require('./ProfilePromise'),
	Score: require('./ScorePromise'),
	NewRoom: require('./NewRoomPromise'),
	Options: require('./OptionsPromise'),
	Home: require('./HomePromise')
};

// FutureViewPromise constructor
function FutureViewPromise(name) {

	if(!(this instanceof FutureViewPromise)) {
		throw Error('Use new to intantiate !');
	}

	Promise.call(this, function(success, error) {
		if(Views[name]) {
			return success(Views[name]);
		}
		success(ViewPromise);
	});
}

FutureViewPromise.prototype = Object.create(Promise.prototype);

module.exports = FutureViewPromise;
