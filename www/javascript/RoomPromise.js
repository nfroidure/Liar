// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(
	['./libs/promise/Promise','./libs/promise/dom/XHRPromise','./libs/promise/dom/WebSocketPromise',
		'./libs/commandor/CommandPromise','./ProfilePromise','./GamePromise','./ViewPromise','./FutureViewPromise',
		'./AnswerPromise', './ScorePromise'],
	function (Promise, XHRPromise, WebSocketPromise, CommandPromise, ProfilePromise, GamePromise,
		ViewPromise, FutureViewPromise, AnswerPromise, ScorePromise) {
// START: Module logic start

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

	RoomPromise.prototype=Object.create(ViewPromise.prototype);

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
		var that=this;
		return Promise.all(
			(this.ws?
				new Promise.sure():
				Promise.any(
					new WebSocketPromise(null,null,8125).then(function(data) {
						that.ws=data;
						var p=WebSocketPromise.getMessagePromise(that.ws,'connect').then(function(msg){
							that.app.user.sessid=msg.sessid;
							that.app.user.id=msg.id;
							var p=WebSocketPromise.getMessagePromise(that.ws,'room').then(function(msg){
								if((!msg.room)||msg.room.id!=that.id) {
									that.end=true;
								} else {
									that.ws.addEventListener('message',function(e) { console.log(e.data)
										if(!e.data)
											return;
										var msgCnt=JSON.parse(e.data);
										if('chat'===msgCnt.type) {
											(that.chat.childNodes.length?that.chat.appendChild(document
												.createElement('br')):'');
											that.chat.appendChild(document.createTextNode(msgCnt.player
												+': '+msgCnt.message));
											that.chat.scrollTop=that.chat.scrollHeight;
										} else if('join'===msgCnt.type) {
											that.room.players.push(msgCnt.player);
											(that.chat.childNodes.length?that.chat.appendChild(document
												.createElement('br')):'');
											that.chat.appendChild(document.createTextNode(
												msgCnt.player.name+' join the room.'));
											that.chat.scrollTop=that.chat.scrollHeight;
											that.updatePlayers();
										} else if('leave'===msgCnt.type) {
											that.room.players.some(function(player,index) {
											if(player.id!=msgCnt.player) return false;
												(that.chat.childNodes.length?that.chat.appendChild(document
													.createElement('br')):'');
												that.chat.appendChild(document.createTextNode(player.name
													+' leaves the room.'));
												that.chat.scrollTop=that.chat.scrollHeight;													
												that.room.players.splice(index,1);
												that.updatePlayers();
											});
										}
									});
								}
							});
							that.ws.send(JSON.stringify({
								'type':'room',
								'room':that.id
							}));
							return p;
						});
						that.ws.send(JSON.stringify({
							'type':'connect',
							'name':that.app.user.name,
							'gender':that.app.user.gender
						}));
						return p;
					}),
				new ViewPromise(that.app,'Connecting',20000)
				)
			),
			// getting room infos
			(that.room?Promise.sure():new XHRPromise('GET','/rooms/'+that.id+'.json')
				.then(function(xhr) {
				that.room=JSON.parse(xhr.responseText);
				that.room.players.push(that.app.user);
				that.updatePlayers();
			}))
		).then(function() {
			if(!(that.ws&&that.room)) {
				return new ViewPromise(that.app,'Network',3000).then(function() {
					that.end=true;
				});
			}
		}).then(function() {
			that.display();
			return Promise.any(
				// Handling channel join
				new CommandPromise(that.app.cmdMgr,'notify',that.name).then(function() {
					// asking notification perm
					window.webkitNotifications.requestPermission();
					// hidding the button
					that.notifButton.style.display='none';
				}),
				// Handling start button
				new CommandPromise(that.app.cmdMgr,'play',that.name).then(function() {
					that.ws.send(JSON.stringify({
						'type':'start',
						'sessid':that.app.user.sessid
					}));
					// wait for the start message
					return Promise.dumb();
				}),
				// Handling game start message
				WebSocketPromise.getMessagePromise(that.ws,'start').then(function() {
					return new GamePromise(that.app,'Game',that.ws,that.room);
				}),
				// Handling message send
				new CommandPromise(that.app.cmdMgr,'send',that.name).then(function() {
					that.ws.send(JSON.stringify({
						'type':'chat',
						'sessid':that.app.user.sessid,
						'message':that.field.value
					}));
					that.field.value='';
				}),
				// Handling the back button
				new CommandPromise(that.app.cmdMgr,'back',that.name).then(function() {
					that.ws&&that.ws.close();
					that.end=true;
				}),
				// Handling connection lost
				(that.ws?WebSocketPromise.getClosePromise(that.ws).then(function() {
					that.ws=null;
					that.end=true;
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

// END: Module logic end

	return RoomPromise;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='RoomPromise';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));
