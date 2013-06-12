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
})(this,'RoomsPromise',
	['./libs/promise/Promise','./libs/promise/XHRPromise','./libs/promise/WebSocketPromise',
		'./CommandPromise','./ProfilePromise','./GamePromise','./ViewPromise','./FutureViewPromise',
		'./RoomPromise'],
	function (Promise, XHRPromise, WebSocketPromise, CommandPromise, ProfilePromise, GameProfile,
		ViewPromise, FutureViewPromise, RoomPromise) {

	// RoomsPomise constructor
	function RoomsPromise(app, name) {
		//  Getting view
		var view=document.getElementById(name);
		Promise.call(this,function(success,error,progress) {
			function show() {
				// Hidding other views
				Array.prototype.forEach.call(document.querySelectorAll('.view.selected'), function(element) {
					element.classList.remove('selected');
				});
				// Showing current view
				view.classList.add('selected');
			}
			// UI interactions
			var pool, end=false, rooms,
				tbody=document.querySelector('tbody'),
				trTpl=tbody.firstChild;
			tbody.removeChild(trTpl);
			// roooms update
			function getRoomsUpdatePromise() {
				return new XHRPromise('GET','/rooms.json',true).then(function(xhr){
					rooms=JSON.parse(xhr.responseText);
					rooms.forEach(function(room) {
						var tr = trTpl.cloneNode(true);
						tr.firstChild.firstChild.setAttribute('href',
							trTpl.firstChild.firstChild.getAttribute('href')+room.id);
						tr.firstChild.firstChild.firstChild.textContent=room.name;
						tr.childNodes[1].firstChild.textContent=room.players+'/6';
						tr.childNodes[2].firstChild.textContent=room.mode;
						tbody.appendChild(tr);
					});
				})
			}
			function empty() {
				while(tbody.firstChild)
					tbody.removeChild(tbody.firstChild);
				}
			// main function
			function main() {
				// Username ok or view profile displayed
				pool=Promise.all(
					(app.user&&app.user.name?
						Promise.sure():
						new ProfilePromise(app,'Profile',true)),
					getRoomsUpdatePromise()
				).then(function() {
					show();
					return Promise.any(
					// Handling channel join
					new CommandPromise(app.cmdMgr,'join',name).then(function(data) { console.log(data)
						return new RoomPromise(app,'Room',data.params.room);
					}),
					// Handling channel list refresh
					new CommandPromise(app.cmdMgr,'refresh',name).then(function() {
						return getRoomsUpdatePromise();
					}),
					// Handling the back button
					new CommandPromise(app.cmdMgr,'back',name).then(function() {
						end=true;
					}),
					// Handling menu
					new CommandPromise(app.cmdMgr,'menu',name).then(function(data) {
						// Loading the selected view
						return new FutureViewPromise(data.params.view)
							.then(function(ViewPromise){
								return new ViewPromise(app,data.params.view);
							});
					})
				)});
			pool.then(function() {
				empty();
				if(end) {
					tbody.appendChild(trTpl);
					success();
				}
				else
					main();
			});
			}
			main();
			var dispose=function() {
				pool.dispose();
			};
			return dispose;
		});
	}

	RoomsPromise.prototype=Object.create(Promise.prototype);

	return RoomsPromise;

});
