// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./libs/promise/Promise',
		'./libs/commandor/CommandPromise'],
	function (Promise, CommandPromise) {
// START: Module logic start

	// ProfilePromise constructor
	function ProfilePromise(app, name, block) {
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
			// if profile form MUST be filled, hiddin cancel button
			if(block)
				view.querySelector('input[formaction]').setAttribute('style','display:none');
			// UI interactions
			var pool, end=false;
			function main() {
				show();
				pool=Promise.any(
					// Handling the form
					new CommandPromise(app.cmdMgr,'send',name).then(function(data) {
						app.user={'name':data.element['username'].value,'gender':-1};
						end=true;
					}),
					// Handling the back button
					new CommandPromise(app.cmdMgr,'back',name).then(function() {
						end=true;
					})
				);
				pool.then(function() {
					if(end) {
						view.querySelector('input[formaction]').removeAttribute('style');
						success();
					}
					else
						main();
				});
			}
			main();
			var dispose=function() {
				view.querySelector('input[formaction]').removeAttribute('style');
				pool.dispose();
			};
			return dispose;
		});
	}

	ProfilePromise.prototype=Object.create(Promise.prototype);

// END: Module logic end

	return ProfilePromise;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='ProfilePromise';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));
