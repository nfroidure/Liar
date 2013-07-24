// for static analysis with r.js
function staticAnalysis() {
	require(['AnswerPromise','GamePromise','RoomsPromise',
		'ProfilePromise','ScorePromise','FutureViewPromise','NewRoomPromise',
		'RoomPromise']);
}

// AMD stuff
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register
		define('Application', ['./libs/commandor/Commandor','./libs/sounds/Sounds','./ViewPromise','./HomePromise'], factory);
	} else {
		// Browser globals
		root.Application = factory(root.Commandor, root.Sounds, root.ViewPromise, root.HomePromise);
	}
})(this, function (Commandor, Sounds, ViewPromise, HomePromise) {

	function Application() {
		this.root=document.querySelector('.app');
		this.cmdMgr=new Commandor(this.root);
		this.sndMgr=new Sounds('sounds');
		// menu
		new HomePromise(this,'Home').then(function() {
			throw Error('Application unexpectly ended !');
		},function(error) {
			throw error;
		});
	}
	window.app=new Application();
	return Application;
});
