// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./libs/promise/Promise',
		'./libs/promise/dom/XHRPromise', './libs/commandor/CommandPromise',
		'./ProfilePromise','./ViewPromise','./FutureViewPromise', './RoomPromise'],
	function (Promise, XHRPromise, CommandPromise, ProfilePromise,
		ViewPromise, FutureViewPromise, RoomPromise) {
// START: Module logic start

	// RoomsPomise constructor
	function RoomsPromise(app, name) {
		//  Getting view
		var view=document.getElementById(name);
		Promise.call(this,function(success,error,progress) {
			function show() {
				// Hidding other views
				Array.prototype.forEach.call(document.querySelectorAll('.view.selected'),
					function(element) {
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
						if(room.state)
							tr.firstChild.firstChild.setAttribute('disabled','disabled');
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
						new CommandPromise(app.cmdMgr,'join',name).then(function(data) {
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
					)
				});
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


// END: Module logic end

	return RoomsPromise;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='RoomsPromise';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));
