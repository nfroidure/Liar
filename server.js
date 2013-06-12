// Modules
var http=require('http'),
	fs=require('fs'),
	url = require('url'),
	ws = require('websocket').server,
	crypto = require('crypto');

// Constants
const MIME_TYPES={
	'html':'text/html',
	'js':'text/javascript',
	'manifest':'text/cache-manifest',
	'css': 'text/css',
	'png': 'image/png',
	'jpg': 'image/jpeg',
	'ico': 'image/ico',
	'mp3': 'audio/mp3',
	'ogg': 'audio/ogg',
	'mid': 'audio/x-midi',
	'json': 'application/json',
	'webapp':'application/x-web-app-manifest+json'
	};

// Global vars
var rootDirectory=__dirname+'/www', // on ajoute la rootDirectory par défaut
	domain='127.0.0.1',
	port=8080;

// Real-time game vars
// player objects
var players=[];
var playersIds=0;
// connections
var connections={};
// rooms vars
var rooms=[{'id':1,'name':'Hello world !','players':[],'mode':'normal'},
	{'id':2,'name':'Lie to me !','players':[],'mode':'normal'}];
var roomsConnects=[];
roomsConnects[1]=[];
roomsConnects[2]=[];
var roomsIds=2;

// HTTP Server

// looking for th RootDirectory on CLI args
if(process.argv[2])
	rootDirectory=process.argv[2];
if(!fs.statSync(rootDirectory).isDirectory())
	throw Error('Cannot stat the given rootDirectory ('+rootDirectory+').');

var httpServer=http.createServer(function (request, response) {
	// Parsing URI
	var parsedUrl=url.parse(request.url);
	// reserving /ws for the WebSocket server
	if(parsedUrl.pathname==='/ws')
		return;
	// Dynamic contents
	var result;
	// Getting room details
	if(result=/^\/rooms\/([0-9]+)\.json$/.exec(parsedUrl.pathname)) {
		if(!rooms.some(function(room) {
			if(room.id==result[1]) {
				// Sending the room
				response.writeHead(200);
				response.end(JSON.stringify(room));
			}
			return false;
		})) {
			response.writeHead(410);
			response.end();
		}
	return;
	// Listing Rooms
	} else if(parsedUrl.pathname==='/rooms.json') {
		if(('HEAD'===request.method||'GET'===request.method)) {
			response.writeHead(200);
			// Sending the list
			response.end(JSON.stringify(rooms.map(function(room) {
				return {
					'id':room.id,
					'name':room.name,
					'players':room.players.length,
					'mode':room.mode
				};
			})));
			return;
		} else if('POST'===request.method) {
			var body = '';
			request.on('data', function (data) {
				body += data;
			});
			request.on('end', function () {
				var data;
				try {
					data=JSON.parse(body);
					if(!data.name&&!data.mode)
						response.writeHead(400);
					else {
						response.writeHead(201);
						rooms.push({
							'id':++roomsIds,
							'name':data.name,
							'players':[],
							'mode':data.mode
						});
					}
					response.end();
				} catch(e) {
					response.writeHead(400);
				}
				response.end();
			});
			return;
		}
	}

	/*/ génération du manifeste
	if(parsedUrl.pathname==='/application.manifest'&&
		(request.method=='HEAD'||request.method=='GET'))
		{
		// Parallélisation des listing du msgContent de dossiers
		var dossiers=['javascript','images','sounds','css'];
		var listings=[];
		var dossiersRestants=dossiers.length;
		dossiers.forEach(function(nom)
			{
			fs.readdir(rootDirectory+'/'+nom,function(error,fichiers)
				{
				// en cas d'error, on stoppe tout
				if(error)
					{
					response.writeHead(500);
					response.end();
					throw Error('Impossible de lire le dossier "'+nom+'".');
					}
				// on garde une référence sur la liste de fichiers
				listings[nom]=fichiers;
				// si tous les dossiers ont été lus
				if(0==--dossiersRestants)
					{
					// sinon, on envoie un code de succès
					response.writeHead(200,{'Content-Type':MIME_TYPES['manifest']});
					// puis on génère le manifeste
					response.write('CACHE MANIFEST\n# v 1.0:'+process.pid+'\n\nCACHE:\n/index.html\n');
					// on itère sur chaque listing
					dossiers.forEach(function(nom)
						{
						// puis sur chaque fichier du listing
						for(var i=listings[nom].length-1; i>=0; i--)
							{
							// enfin on écrit la ligne du manifeste (sauf pour liste.json)
							// qui est dans la section fallback
							if('liste.json'!==listings[nom][i])
								response.write('/'+nom+'/'+listings[nom][i]+'\n');
							}
						});
					// on finalise le manifeste
					response.end('\nFALLBACK:\n/univers/liste.json /univers/liste.json\n\nNETWORK:\n*\n');
					}
				});
			});
		// on schinte le serveur statique
		return;
		}*/

	// Static contents : read-only access
	if('HEAD'!==request.method&&'GET'!==request.method) {
		response.writeHead(401);
		response.end();
		return;
	}
	// No query params
	if('search' in parsedUrl) {
		response.writeHead(401);
		response.end();
	}
	// redirecting the rootDirectory to index.html
	if('/'===parsedUrl.pathname||!parsedUrl.pathname) {
		response.writeHead(301,{'Location':'/index.html'});
		response.end();
		return;
	}
	// Checking the file corresponding to the path
	fs.stat(rootDirectory+parsedUrl.pathname,
		function(error,result) {
			var headers={}, code=0, start=0, end;
			// Sending 404 errors
			if(error||!result.isFile()) {
				response.writeHead(404);
				response.end();
				return;
			}
			// Reading file ext
			var ext=parsedUrl.pathname
				.replace(/^(?:.*)\.([a-z0-9]+)$/,'$1');
			if(!MIME_TYPES[ext]) {
				response.writeHead(500);
				response.end();
				throw Error('Unsupported MIME type ('+ext+')');
			}
			headers['Content-Type']=MIME_TYPES[ext];
			headers['Content-Length']=result.size;
			// Looking for ranged requests
			if(request.headers.range) {
				var chunks = request.headers.range.replace(/bytes=/, "").split("-");
				start = parseInt(chunks[0],10);
				end =  chunks[1] ? parseInt(chunks[1], 10) :
					headers['Content-Length']-1; 
				headers['Content-Range'] = 'bytes ' + start + '-' + end + '/'
					+ (headers['Content-Length']);
				headers['Accept-Ranges'] = 'bytes';
				headers['Content-Length']= (end-start)+1;
				headers['Transfer-Encoding'] = 'chunked';
				headers['Connection'] = 'close';
				code=206;
			} else {
				code=200;
			}
			// on envoi le code et les entêtes
			response.writeHead(code, headers);
			// si la méthode est GET alors on envoi
			// aussi le msgContent du fichier
			if('GET'===request.method) {
				// on transvase le flux de lecture
				// en prenant soin d'indiquer la
				// plage d'octets concernés 
				fs.createReadStream(rootDirectory
				+parsedUrl.pathname,{start: start, end: end})
				.pipe(response);
			} else {
				response.end();
			}
		}
	); 
}).listen(port);

console.log('Server started on http://'+domain+':'+port+'/, serving directory :'+rootDirectory);

// WebSocket Server

var wsServer = new ws({
		httpServer: httpServer,
		autoAcceptConnections: false
	});

// On écoute les demandes de connection
wsServer.on('request', function(request) {
	// Si l'origine de la connection n'est pas notre site, on la rejette
	if(-1===request.origin.indexOf('http://127.0.0.1:'+port)
		&&-1===request.origin.indexOf('http://'+domain+':'+port)) {
		console.log(new Date()+': Connection origin rejected ('+request.origin+').');
		request.reject();
		return;
	}
	// on récupère l'objet connection
	var connection = request.accept(null, request.origin),
	// on crée les variables relatives au player
		player={}, sessid='';
	console.log((new Date()) + ': Nouvelle connection acceptée.');
	// on écoute les messages reçus depuis cette connection
	connection.on('message', function(message) {
		console.log(message.utf8Data);
		// on crée une variable pour contenir le message décodé
		var msgContent;
		// on ne traite que les message encodés en utf8
		if ('utf8' === message.type) {
			// on parse le JSON reçu
			try {
				msgContent=JSON.parse(message.utf8Data);
			} catch(e) {
				// si le le JSON est mal formé on ignore le message
				console.log(new Date()+': Bad JSON received ' + message.utf8Data);
				return;
			}
			// on vérifie si le JSON a bien un type
			if(!msgContent.type)
				return;
			// on choisi l'action à faire selon le type
			switch(msgContent.type) {
				// connection
				case 'connect':
					// must at least give its name
					if(!msgContent.name)
						return;
					// looking for existing user
					if(msgContent.sessid&&connections[msgContent.sessid]) {
						sessid=msgContent.sessid;
						player=connections[sessid].player;
						// on ferme éventuellement l'ancienne connection
						if(connections[sessid].connection)
							connections[sessid].connection.close();
						connections[sessid].connection=connection;
						// on arrête le timer
						if(connections[sessid].timeout) {
							clearTimeout(connections[sessid].timeout);
							connections[sessid].timeout=0;
						}
					}
					// creating otherwise
					else {
						var hash=crypto.createHash('sha1');
						hash.update(message.utf8Data,'utf8');
						sessid=hash.digest('hex');
						connections[sessid]=
							{'connection':connection,'player':player};
						player.id=++playersIds;
						}
					// stocking player infos
					player.name=(''+msgContent.name).replace('&','&amp;').replace('<','&lt')
						.replace('>','&gt').replace('"','&quot;');
					player.gender=(msgContent.gender?msgContent.gender:0);
					console.log((new Date()) + ' ['+connection.remoteAddress+'-'
						+(player?player.name+'('+player.id+')':'')+']: connection ('+sessid+').');
					// sending connection sessid + player id
					connection.sendUTF(JSON.stringify({'type':'connect','sessid':sessid,'id':player.id}));
					break;
				// room join
				case 'room':
					// room connection
					if(!(msgContent.room&&rooms.some(function(room) {
						// ignore if full
						if(room.id!=msgContent.room||room.players.length>6)
							return false
						// user already in the room
						if(-1!==roomsConnects[room.id].indexOf(sessid)) {
							console.log((new Date()) + ' ['+connection.remoteAddress+'-'
								+(player?player.name+'('+player.id+')':'')+']: User already in the room.');
							return true;
							}
						room.players.push(player);
						// confirm user he enters the room
						connection.sendUTF(JSON.stringify({'type':'room',
							'room':room}));
						// notify room players they must update
						roomsConnects[room.id].forEach(function(destId) {
							connections[destId].connection.sendUTF(JSON.stringify({'type':'join','player':player}));
							});
						roomsConnects[room.id].push(sessid);
						connections[sessid].room=room;
						return true;
						})))
						{
						connection.sendUTF(JSON.stringify({'type':'room','room':null}));
						// removing the player
						if(connections[sessid].room)
							{
							var index=connections[sessid].room.players.indexOf(player);
							if(-1!==index)
								connections[sessid].room.players.splice(index,1)
							roomsConnects[connections[sessid].room.id].splice(
								roomsConnects[connections[sessid].room.id].indexOf(sessid),1);
							// notifying players
							roomsConnects[connections[sessid].room.id].forEach(function(destId) {
								connections[destId].connection.sendUTF(JSON.stringify({'type':'leave','player':player.id}));
								});
							connections[sessid].room=null;
							}
						}
					console.log((new Date()) + ' ['+connection.remoteAddress+'-'
						+(player?player.name+'('+player.id+')':'')+']: room: ' + message.utf8Data);
					break;
				// mini chat
				case 'chat':
					if(!(connections[sessid]&&connections[sessid].room&&msgContent.message))
						return;
					// fitering html
					msgContent.message=msgContent.message.replace('&','&amp;')
						.replace('<','&lt').replace('>','&gt').replace('"','&quot;');
					// sending to each players in the room
					roomsConnects[connections[sessid].room.id].forEach(function(destId) {
						connections[destId].connection.sendUTF(JSON.stringify({
							'type':'chat','player':player.name,
							'message':msgContent.message}));
						});
					console.log((new Date()) + ' ['+connection.remoteAddress+'-'
						+(player?player.name+'('+player.id+')':'')+']: Chat ('+msgContent.message+').');
					break;
				default:
					console.log((new Date()) + ' ['+connection.remoteAddress+'-'
						+(player?player.name+'('+player.id+')':'')+']: Unexpected message: ' + message.utf8Data);
					break;
				}
			}
		});
	// on écoute la fermeture des connections
    connection.on('close', function(reasonCode, description) {
		// si le client était connecté
		if(connections[sessid])
			{
			// on supprime la connection au bout de 30 secondes
			connections[sessid].timeout=setTimeout(function() {
				console.log((new Date()) + ' ['+connection.remoteAddress+'-'
					+(player?player.name+'('+player.id+')':'')+']: Cleanup ('+sessid+').');
				// on le retire du room dans lequel il était
				if(connections[sessid].room)
					{
					connections[sessid].room.players.splice(
						connections[sessid].room.players.indexOf(player),1);
					roomsConnects[connections[sessid].room.id].splice(
						roomsConnects[connections[sessid].room.id].indexOf(sessid),1);
					// notification des players du room
					roomsConnects[connections[sessid].room.id].forEach(function(destId) {
						connections[destId].connection.sendUTF(JSON.stringify({'type':'leave','player':player.id}));
						});
					}
				// on supprime la connection
				delete connections[sessid];
				},1000);
			}
		        console.log((new Date()) + ' ['+connection.remoteAddress+'-'
				+(player?player.name+'('+player.id+')':'')+']: Disconnected ('+reasonCode+':'+description+' - '+sessid+').');
		});
	});

console.log('Serveur websocket démarré.');
