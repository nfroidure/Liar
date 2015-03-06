var Promise = require('ia-promise');
var FutureViewPromise = require('./FutureViewPromise');
var ViewPromise = require('./ViewPromise');
var CommandPromise = require('./CommandPromise');

// ScorePromise constructor
function ScorePromise(app, name, timeout, scores) {
	// Calling parent constructor
	ViewPromise.call(this, app, name, timeout);
	// Preparing UI elements
	this.displayZone = this.view.querySelector('p.text');
	this.itemsTpls = this.view.querySelectorAll('p.text>span');
	while(this.displayZone.firstChild) {
		this.displayZone.removeChild(this.displayZone.lastChild);
	}
	// filling the display zones
	var item;
	for(var i = 0, j = scores.length; i < j; i++) {
		// 1st and 2nd
		if(i < 2) {
			item = this.itemsTpls[i].cloneNode(true);
		// looser
		} else if(1 == j - i) {
			item = this.itemsTpls[4].cloneNode(true);
		// 3rd
		} else if(i < 3) {
			item = this.itemsTpls[2].cloneNode(true);
		// others
		} else {
			item = this.itemsTpls[3].cloneNode(true);
		}
		item.childNodes[1].firstChild.textContent = scores[i].player +
			' (' + scores[i].score + 'pts)';
		this.displayZone.appendChild(item);
	}
}

ScorePromise.prototype = Object.create(ViewPromise.prototype);

ScorePromise.prototype.hide = function () {
	while(this.displayZone.firstChild) {
		this.displayZone.removeChild(this.displayZone.lastChild);
	}
	for(var i = 0, j = this.itemsTpls.length; i < j; i++) {
		this.displayZone.appendChild(this.itemsTpls[i]);
	}
};

ScorePromise.prototype.loop = function (timeout) {
	var _this = this;
	return Promise.elapsed(timeout).then(function() {
			_this.end = true;
		});
};

module.exports = ScorePromise;
