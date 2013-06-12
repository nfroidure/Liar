// AMD stuff : Browser + RequireJS
(function (root, moduleName, deps, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register
		define(deps, factory);
	} else {
		// Browser globals
		root[moduleName] = factory.apply(root,deps.map(function(dep) {
			return root[dep];
		}));
	}
})(this,'RoomPromise',
	['./libs/promise/Promise','./libs/promise/XHRPromise','./libs/promise/WebSocketPromise',
		'./CommandPromise','./ProfilePromise','./GamePromise','./ViewPromise','./FutureViewPromise'],
	function (Promise, XHRPromise, WebSocketPromise, CommandPromise, ProfilePromise, GameProfile,
		ViewPromise, FutureViewPromise) {

	// RoomPomise constructor
	function RoomPromise(app, name, id) {
		//  Getting view
		var view=document.getElementById(name);
		Promise.call(this,function(success,error,progress) {
			function show() {
				// Hidding other views
				Array.prototype.forEach.call(document.querySelectorAll('.view.selected'), function(element) {
					if(element!==view)
						element.classList.remove('selected');
				});
				// Showing current view
				if(!view.classList.contains('selected'))
					view.classList.add('selected');
			}
			function updatePlayers() {
						var h1=view.querySelector('h1');
						h1.firstChild.textContent=room.name+' ';
						h1.lastChild.firstChild.textContent=room.players.length+'/6';
						if(room.players.length>3)
								{
								button.setAttribute('disabled','');
								// on tente d'afficher une notification
								if('webkitNotifications' in window
									&&window.webkitNotifications.checkPermission()===0) {
									var notification = window.webkitNotifications.createNotification('',
										'Ready to play',
										'Minimum amount of players reached !');
									notification.show();
									}
								}
							else
								button.setAttribute('disabled','disabled');
			}
			// UI interactions
			var pool, end=false, ws, room,
				chat=view.querySelector('.chat'),
				field=view.querySelector('input[type="text"]'),
				button=view.querySelectorAll('p.menu a')[1],
				notifButton=view.querySelectorAll('p.menu a')[2];
			// main function
			function main() {
				show();
				// WebSockets ok or network error displayed and exit
				pool=Promise.all(
					(ws?
						new Promise.sure():
						Promise.any(
							new WebSocketPromise(null,null,8080).then(function(data) {
								ws=data;
								var p=WebSocketPromise.getMessagePromise(ws.ws,'connect').then(function(msg){
									app.user.sessid=msg.sessid;
									app.user.id=msg.id;
									var p=WebSocketPromise.getMessagePromise(ws.ws,'room').then(function(msg){
									console.log('here');
										if(msg.room.id!=id) { console.log('test');
											end=true;
										} else {
											ws.ws.addEventListener('message',function(e) { console.log(e.data)
												if(!e.data)
													return;
												var msgCnt=JSON.parse(e.data);
												if('chat'===msgCnt.type) {
													(chat.childNodes.length?chat.appendChild(document
														.createElement('br')):'');
													chat.appendChild(document.createTextNode(msgCnt.player
														+': '+msgCnt.message));
													chat.scrollTop=chat.scrollHeight;
												} else if('join'===msgCnt.type) {
													room.players.push(msgCnt.player);
													(chat.childNodes.length?chat.appendChild(document
														.createElement('br')):'');
													chat.appendChild(document.createTextNode(
														msgCnt.player.name+' join the room.'));
													chat.scrollTop=chat.scrollHeight;
													updatePlayers();
												} else if('leave'===msgCnt.type) {
													room.players.some(function(player,index) {
													if(player.id!=msgCnt.player) return false;
														(chat.childNodes.length?chat.appendChild(document
															.createElement('br')):'');
														chat.appendChild(document.createTextNode(player.name
															+' leaves the room.'));
														chat.scrollTop=chat.scrollHeight;													
														room.players.splice(index,1);
														updatePlayers();
													});
												}
											});
										}
									});
									ws.ws.send(JSON.stringify({
										'type':'room',
										'room':id
									}));
									return p;
								});
								ws.ws.send(JSON.stringify({
									'type':'connect',
									'name':app.user.name,
									'gender':app.user.gender
								}));
								return p;
							}),
						new ViewPromise(app,'Connecting',20000)
						)
					),
					// getting room infos
					(room?Promise.sure():new XHRPromise('GET','/rooms/'+id+'.json')
						.then(function(xhr) {
						room=JSON.parse(xhr.responseText);
						room.players.push(app.user);
						updatePlayers();
					}))
				).then(function() {
					if(!ws) {
						return new ViewPromise(app,'Network',5000).then(function() {
							end=true;
						});
					}
				}).then(function() {
					show();
					return Promise.any(
						// Handling channel join
						new CommandPromise(app.cmdMgr,'notify',name).then(function(data) {
						// asking notification perm
						window.webkitNotifications.requestPermission();
						// suppression du bouton
						notifButton.style.display='none';
						}),
						// Handling notifications
						new CommandPromise(app.cmdMgr,'play',name).then(function(data) {
							return Promise.sure();
						}),
						// Handling message send
						new CommandPromise(app.cmdMgr,'send',name).then(function(data) {
							ws.ws.send(JSON.stringify({
								'type':'chat',
								'sessid':app.user.sessid,
								'message':field.value
							}));
							field.value='';
						}),
						// Handling the back button
						new CommandPromise(app.cmdMgr,'back',name).then(function() {
							ws&&ws.ws.close();
							end=true;
						}),
						// Handling connection lost
						(ws?ws.closePromise.then(function() {
							ws=null;
							success();
						}):Promise.sure())
					);
				});
				pool.then(function() {
					if(end) {
						if(ws) {
							ws.ws.send(JSON.stringify({
								'type':'room',
								'sessid':app.user.sessid,
								'room':null
							}));
						}
						success();
					} else {
						main();
					}
				});
			}
			main();
			var dispose=function() {
				ws&&ws.ws.close();
				pool.dispose();
				while(chat.firstChild)
					chat.removeChild(chat.firstChild);
			};
			return dispose;
		});
	}

	RoomPromise.prototype=Object.create(Promise.prototype);

	return RoomPromise;

});
