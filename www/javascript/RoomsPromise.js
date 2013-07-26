// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./libs/promise/Promise',
		'./libs/promise/dom/XHRPromise', './libs/commandor/CommandPromise',
		'./ProfilePromise','./ViewPromise','./FutureViewPromise', './RoomPromise'],
	function (Promise, XHRPromise, CommandPromise, ProfilePromise,
		ViewPromise, FutureViewPromise, RoomPromise) {
// START: Module logic start

	function RoomsPromise(app, name) {
		// Calling parent constructor
		ViewPromise.call(this, app, name);
		// Registering UI elements
		this.tbody=document.querySelector('tbody'),
		this.trTpl=this.tbody.firstChild;
		this.tbody.removeChild(this.trTpl);
	}

	RoomsPromise.prototype=Object.create(ViewPromise.prototype);

	RoomsPromise.prototype.reset=function () {
		while(this.tbody.firstChild)
			this.tbody.removeChild(this.tbody.firstChild);
	};

	RoomsPromise.prototype.hide=function () {
		this.reset();
		this.tbody.appendChild(this.trTpl);
	};

	RoomsPromise.prototype.loop=function (timeout) {
		var that=this;
		// roooms update
		function getRoomsUpdatePromise() {
			return new XHRPromise('GET','/rooms.json',true).then(function(xhr){
				that.reset();
				var rooms=JSON.parse(xhr.responseText);
				rooms.forEach(function(room) {
					var tr = that.trTpl.cloneNode(true);
					tr.firstChild.firstChild.setAttribute('href',
						that.trTpl.firstChild.firstChild.getAttribute('href')+room.id);
					if(room.state)
						tr.firstChild.firstChild.setAttribute('disabled','disabled');
					tr.firstChild.firstChild.firstChild.textContent=room.name;
					tr.childNodes[1].firstChild.textContent=room.players+'/6';
					tr.childNodes[2].firstChild.textContent=room.mode;
					that.tbody.appendChild(tr);
				});
			});
		}
		return Promise.all(
					(that.app.user&&that.app.user.name?
						Promise.sure():
						new ProfilePromise(that.app,'Profile',true)),
					getRoomsUpdatePromise()
				).then(function() {
					that.display();
					return Promise.any(
						// Handling channel join
						new CommandPromise(that.app.cmdMgr,'join',that.name).then(function(data) {
							return new RoomPromise(that.app,'Room',data.params.room);
						}),
						// Handling channel list refresh
						new CommandPromise(that.app.cmdMgr,'refresh',that.name),
						// Handling the back button
						new CommandPromise(that.app.cmdMgr,'back',that.name).then(function() {
							that.end=true;
						}),
						// Handling menu
						new CommandPromise(that.app.cmdMgr,'menu',that.name).then(function(data) {
							// Loading the selected view
							return new FutureViewPromise(data.params.view)
								.then(function(ViewPromise){
									return new ViewPromise(app,data.params.view);
								});
						})
					)
				});
	};

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
