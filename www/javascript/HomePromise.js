// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./libs/promise/Promise','./FutureViewPromise',
		'./ViewPromise','./libs/commandor/CommandPromise'],
	function (Promise, FutureViewPromise, ViewPromise, CommandPromise) {
// START: Module logic start

	// HomePromise constructor
	function HomePromise(app, name) {
		//  Getting view elements
		var view=document.getElementById(name),
			buttonInstallation=view.querySelector('ul.menu li:nth-child(2) a');
		buttonInstallation.style.display='none';
		// Checking installation on Firefox
		if(undefined !== navigator.mozApps) {
			var request = navigator.mozApps.getSelf();
			request.onsuccess = function() {
				if (request.result) {
				} else {
					buttonInstallation.style.display='inline-block';
				}
			};
			request.onerror = function() {
			};
		}
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
			var pool, end=false;
			function main() {
				show();
				pool=Promise.any(
					// Handling the install button
					new CommandPromise(app.cmdMgr,'install',name).then(function() {
						// Installing the application
						var manifestUrl = location.href.substring(0, location.href.lastIndexOf('/')) + '/manifest.webapp';
						var request = window.navigator.mozApps.install(manifestUrl);
						request.onsuccess = function() {
							buttonInstallation.style.display='none';
						};
						request.onerror = function() {
						};
					}),
					// Handling menu
					new CommandPromise(app.cmdMgr,'menu',name).then(function(data) {
						// Loading the selected view
						return new FutureViewPromise(data.params.view)
							.then(function(ViewPromise){
								return new ViewPromise(app,data.params.view);
							});
					})
				);
				pool.then(function() {
					if(end)
						success();
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

	HomePromise.prototype=Object.create(Promise.prototype);

// END: Module logic end

	return HomePromise;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='HomePromise';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));
