var Promise = require('ia-promise');
var XHRPromise = require('./XHRPromise');
var CommandPromise = require('./CommandPromise');
var ProfilePromise = require('./ProfilePromise');
var ViewPromise = require('./ViewPromise');
var FutureViewPromise = require('./FutureViewPromise');
var RoomPromise = require('./RoomPromise');

function RoomsPromise(app, name) {
	// Calling parent constructor
	ViewPromise.call(this, app, name);
	// Registering UI elements
	this.tbody = document.querySelector('tbody'),
	this.trTpl = this.tbody.firstChild;
	this.tbody.removeChild(this.trTpl);
}

RoomsPromise.prototype = Object.create(ViewPromise.prototype);

RoomsPromise.prototype.reset = function () {
	while(this.tbody.firstChild) {
		this.tbody.removeChild(this.tbody.firstChild);
	}
};

RoomsPromise.prototype.hide = function () {
	this.reset();
	this.tbody.appendChild(this.trTpl);
};

RoomsPromise.prototype.loop = function (timeout) {
	var _this = this;
	// roooms update
	function getRoomsUpdatePromise() {
		return new XHRPromise('GET', '/rooms.json', true).then(function(xhr){
			_this.reset();
			var rooms = JSON.parse(xhr.responseText);
			rooms.forEach(function(room) {
				var tr = _this.trTpl.cloneNode(true);
				tr.firstChild.firstChild.setAttribute('href',
					_this.trTpl.firstChild.firstChild.getAttribute('href') + room.id);
				if(room.state)
					tr.firstChild.firstChild.setAttribute('disabled','disabled');
				tr.firstChild.firstChild.firstChild.textContent = room.name;
				tr.childNodes[1].firstChild.textContent = room.players + '/6';
				tr.childNodes[2].firstChild.textContent = room.mode;
				_this.tbody.appendChild(tr);
			});
		});
	}
	return Promise.all(
		_this.app.user && _this.app.user.name ?
			Promise.sure() :
			new ProfilePromise(_this.app, 'Profile', true),
		getRoomsUpdatePromise()
	).then(function() {
				_this.display();
				return Promise.any(
					// Handling channel join
					new CommandPromise(_this.app.cmdMgr, 'join', _this.name).then(function(data) {
						return new RoomPromise(_this.app, 'Room', data.params.room);
					}),
					// Handling channel list refresh
					new CommandPromise(_this.app.cmdMgr, 'refresh', _this.name),
					// Handling the back button
					new CommandPromise(_this.app.cmdMgr, 'back', _this.name).then(function() {
						_this.end=true;
					}),
					// Handling menu
					new CommandPromise(_this.app.cmdMgr, 'menu', _this.name).then(function(data) {
						// Loading the selected view
						return _this.app.loadView(data.params.view);
					})
				)
			});
};

module.exports = RoomsPromise;
