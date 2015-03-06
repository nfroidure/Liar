var Promise = require('ia-promise');
var XHRPromise = require('./XHRPromise');
var WebSocketPromise = require('./WebSocketPromise');
var CommandPromise = require('./CommandPromise');
var ProfilePromise = require('./ProfilePromise');
var GamePromise = require('./GamePromise');
var ViewPromise = require('./ViewPromise');
var FutureViewPromise = require('./FutureViewPromise');
var AnswerPromise = require('./AnswerPromise');
var ScorePromise = require('./ScorePromise');

// RoomPomise constructor
function RoomPromise(app, name, id) {
	this.id=id;
	// Calling parent constructor
	ViewPromise.call(this, app, name);
	// Registering UI elements
	this.chat=this.view.querySelector('.chat'),
	this.field=this.view.querySelector('input[type="text"]'),
	this.button=this.view.querySelectorAll('p.menu a')[1],
	this.notifButton=this.view.querySelectorAll('p.menu a')[2];
	// Managing the notification button display
	if('webkitNotifications' in window
		&&window.webkitNotifications.checkPermission()===0) {
		this.notifButton.style.display='none';
	} else {
		this.notifButton.style.display='inline-block';
	}
}

RoomPromise.prototype = Object.create(ViewPromise.prototype);

//RoomPromise.prototype.display=function () {
//};

RoomPromise.prototype.hide=function () {
	if(this.ws) {
		this.ws.send(JSON.stringify({
			'type':'room',
			'sessid':this.app.user.sessid,
			'room':null
		}));
		this.ws.close();
	}
	while(this.chat.firstChild)
		this.chat.removeChild(this.chat.firstChild);
};

RoomPromise.prototype.loop=function (timeout) {
	var _this=this;
	return Promise.all(
		(this.ws?
			new Promise.sure():
			Promise.any(
				new WebSocketPromise(null,null,8125).then(function(data) {
					_this.ws=data;
					var p=WebSocketPromise.getMessagePromise(_this.ws,'connect').then(function(msg){
						_this.app.user.sessid=msg.sessid;
						_this.app.user.id=msg.id;
						var p=WebSocketPromise.getMessagePromise(_this.ws,'room').then(function(msg){
							if((!msg.room)||msg.room.id!=_this.id) {
								_this.end=true;
							} else {
								_this.ws.addEventListener('message',function(e) { console.log(e.data)
									if(!e.data)
										return;
									var msgCnt=JSON.parse(e.data);
									if('chat'===msgCnt.type) {
										(_this.chat.childNodes.length?_this.chat.appendChild(document
											.createElement('br')):'');
										_this.chat.appendChild(document.createTextNode(msgCnt.player
											+': '+msgCnt.message));
										_this.chat.scrollTop=_this.chat.scrollHeight;
									} else if('join'===msgCnt.type) {
										_this.room.players.push(msgCnt.player);
										(_this.chat.childNodes.length?_this.chat.appendChild(document
											.createElement('br')):'');
										_this.chat.appendChild(document.createTextNode(
											msgCnt.player.name+' join the room.'));
										_this.chat.scrollTop=_this.chat.scrollHeight;
										_this.updatePlayers();
									} else if('leave'===msgCnt.type) {
										_this.room.players.some(function(player,index) {
										if(player.id!=msgCnt.player) return false;
											(_this.chat.childNodes.length?_this.chat.appendChild(document
												.createElement('br')):'');
											_this.chat.appendChild(document.createTextNode(player.name
												+' leaves the room.'));
											_this.chat.scrollTop=_this.chat.scrollHeight;
											_this.room.players.splice(index,1);
											_this.updatePlayers();
										});
									}
								});
							}
						});
						_this.ws.send(JSON.stringify({
							'type':'room',
							'room':_this.id
						}));
						return p;
					});
					_this.ws.send(JSON.stringify({
						'type':'connect',
						'name':_this.app.user.name,
						'gender':_this.app.user.gender
					}));
					return p;
				}),
			new ViewPromise(_this.app,'Connecting',20000)
			)
		),
		// getting room infos
		(_this.room?Promise.sure():new XHRPromise('GET','/rooms/'+_this.id+'.json')
			.then(function(xhr) {
			_this.room=JSON.parse(xhr.responseText);
			_this.room.players.push(_this.app.user);
			_this.updatePlayers();
		}))
	).then(function() {
		if(!(_this.ws&&_this.room)) {
			return new ViewPromise(_this.app,'Network',3000).then(function() {
				_this.end=true;
			});
		}
	}).then(function() {
		_this.display();
		return Promise.any(
			// Handling channel join
			new CommandPromise(_this.app.cmdMgr,'notify',_this.name).then(function() {
				// asking notification perm
				window.webkitNotifications.requestPermission();
				// hidding the button
				_this.notifButton.style.display='none';
			}),
			// Handling start button
			new CommandPromise(_this.app.cmdMgr,'play',_this.name).then(function() {
				_this.ws.send(JSON.stringify({
					'type':'start',
					'sessid':_this.app.user.sessid
				}));
				// wait for the start message
				return Promise.dumb();
			}),
			// Handling game start message
			WebSocketPromise.getMessagePromise(_this.ws,'start').then(function() {
				return new GamePromise(_this.app,'Game',_this.ws,_this.room);
			}),
			// Handling message send
			new CommandPromise(_this.app.cmdMgr,'send',_this.name).then(function() {
				_this.ws.send(JSON.stringify({
					'type':'chat',
					'sessid':_this.app.user.sessid,
					'message':_this.field.value
				}));
				_this.field.value='';
			}),
			// Handling the back button
			new CommandPromise(_this.app.cmdMgr,'back',_this.name).then(function() {
				_this.ws&&_this.ws.close();
				_this.end=true;
			}),
			// Handling connection lost
			(_this.ws?WebSocketPromise.getClosePromise(_this.ws).then(function() {
				_this.ws=null;
				_this.end=true;
			}):Promise.sure())
		);
	});
};

RoomPromise.prototype.updatePlayers = function () {
	var h1=this.view.querySelector('h1');
	h1.firstChild.textContent=this.room.name+' ';
	h1.lastChild.firstChild.textContent=this.room.players.length+'/6';
	if(this.room.players.length>1) {
		this.button.setAttribute('disabled','');
		// on tente d'afficher une notification
		if('webkitNotifications' in window
			&&window.webkitNotifications.checkPermission()===0) {
			var notification = window.webkitNotifications.createNotification('',
				'Ready to play',
				'Minimum amount of players reached !');
			notification.show();
		}
	} else {
		this.button.setAttribute('disabled','disabled');
	}
}

module.exports = RoomPromise;
