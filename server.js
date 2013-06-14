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
	},
// Room statuses
	WAIT_ANSWER=1,
	CLOSING_ANSWERS=2,
	WAIT_BET=4,
	CLOSING_BETS=8
;

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
					'status':(room.game?1:0),
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

console.log('Server started on http://'+domain+':'+port+'/, '
	+'serving directory :'+rootDirectory);

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
						hash.update(message.utf8Data+Date.now(),'utf8');
						sessid=hash.digest('hex');
						connections[sessid]=
							{'connection':connection,'player':player,'sessid':sessid};
						player.id=++playersIds;
					}
					connection.sessid=sessid;
					// stocking player infos
					player.name=(''+msgContent.name).replace('&','&amp;')
						.replace('<','&lt').replace('>','&gt')
						.replace('"','&quot;').trim();
					player.gender=0;
					if(msgContent.gender&&msgContent.gender==1)
						player.gender=1;
					else if(msgContent.gender&&msgContent.gender==-1)
						player.gender=-1;
					console.log((new Date()) + ' ['+connection.remoteAddress+'-'
						+(player?player.name+'('+player.id+')':'')+']: '
						+'connection ('+sessid+').');
					// sending connection sessid + player id
					connection.sendUTF(JSON.stringify({'type':'connect',
						'sessid':sessid,'id':player.id}));
					break;
				// room join
				case 'room':
					// room connection
					if(!(msgContent.room&&rooms.some(function(room) {
						// ignore if full
						if(room.id!=msgContent.room||room.players.length>6)
							return false
						// ignore if game started
						if(room.game)
							return false
						// user already in the room
						if(-1!==roomsConnects[room.id].indexOf(sessid)) {
							console.log((new Date()) + ' ['+connection.remoteAddress+'-'
								+(player?player.name+'('+player.id+')':'')+']: '
								+'User already in the room.');
							return true;
						}
						room.players.push(player);
						// confirm user he enters the room
						connection.sendUTF(JSON.stringify({'type':'room',
							'room':room}));
						// notify room players they must update
						roomsConnects[room.id].forEach(function(destId) {
							connections[destId].connection.sendUTF(JSON.stringify(
								{'type':'join','player':player})
							);
						});
						roomsConnects[room.id].push(sessid);
						connections[sessid].room=room;
						return true;
						}))) {
						connection.sendUTF(JSON.stringify({'type':'room','room':null}));
						// removing the player
						leaveRoom(connections[sessid]);
					}
					console.log((new Date()) + ' ['+connection.remoteAddress+'-'
						+(player?player.name+'('+player.id+')':'')+']: '
						+'room: ' + message.utf8Data);
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
						+(player?player.name+'('+player.id+')':'')+']: '
						+'Chat ('+msgContent.message+').');
					break;
				// start the game
				case 'start':
					if(!(connections[sessid]&&connections[sessid].room))
						return;
					// checking if start is possible
					if(connections[sessid].room.players.length<3
						||connections[sessid].room.game)
						return;
					// setting the game
					connections[sessid].room.game={'round':0};
					// giving points to players
					connections[sessid].room.players.forEach(function(player) {
						player.points=10;
						player.score=0;
					});
					// sending the start signal to each player in the room
					roomsConnects[connections[sessid].room.id].forEach(function(destId) {
						connections[destId].connection.sendUTF(
							JSON.stringify({'type':'start'})
						);
					});
					// new round
					newRound(connections[sessid].room);
					console.log((new Date()) + ' ['+connection.remoteAddress+'-'
						+(player?player.name+'('+player.id+')':'')+']: '
						+'Start ('+connections[sessid].room.name+').');
					break;
				// catch answers
				case 'answer':
					if(!(connections[sessid]&&connections[sessid].room))
						return;
					var room = connections[sessid].room;
					if(!(room.game&&room.game.state&(WAIT_ANSWER|CLOSING_ANSWERS)))
						return;
					// saving user answer
					room.game.answers.push({'answer':msgContent.answer.replace('&','&amp;')
							.replace('<','&lt').replace('>','&gt').replace('"','&quot;'),
						'player':player.id,'points':0});
					// if enought answers, start the timeout
					if(room.game.answers.length>2&&!(room.game.state&CLOSING_ANSWERS)) {
						room.game.state=CLOSING_ANSWERS;
						// sending the answer countdown
						roomsConnects[connections[sessid].room.id].forEach(function(destId) {
							connections[destId].connection.sendUTF(
								JSON.stringify({'type':'answer','timeLeft':10})
							);
						});
						// setting the timeout
						setTimeout(function() {
							// ordering the answers
							var answers=[], answer, answerIds=0;
							while(room.game.answers.length) {
								answer=room.game.answers.splice(Math.floor(room.game.answers.length*Math.random()),1)[0];
								answer.id=++answerIds;
								answers.push(answer);
							}
							room.game.answers=answers;
							// sending answers to players
							roomsConnects[connections[sessid].room.id].forEach(function(destId) {
								connections[destId].connection.sendUTF(
									JSON.stringify({'type':'answers',
										'answers':room.game.answers.map(function(answer){
										return {'id':answer.id,'answer':answer.answer};
										})})
								);
							});
						room.game.state=WAIT_BET;
						room.game.bets=0;
						},11000) // 1 sec latency (10+1)
					}
					console.log((new Date()) + ' ['+connection.remoteAddress+'-'
						+(player?player.name+'('+player.id+')':'')+']: '
						+'Answer ('+msgContent.answer+').');
					break;
				case 'bet':
					if(!(connections[sessid]&&connections[sessid].room))
						return;
					var room = connections[sessid].room;
					if(!(room.game&&room.game.state&(WAIT_BET|CLOSING_BETS)))
						return;
					if(player.bet)
						return;
					// checking bet validity
					var bet=parseInt(msgContent.bet,10);
					if(bet<=player.points)
						player.points-=bet;
					else {
						bet=player.points;
						player.points=0;
					}
					// saving user bet
					room.game.bets++;
					player.bet={
						'answer':parseInt(msgContent.answer,10),
						'bet':bet,
						'player':player.id
					};
					// if enought bets, start the timeout
					if(room.game.bets>2&&!(room.game.state&CLOSING_BETS)) {
						room.game.state=CLOSING_BETS;
						// sending the bet countdown
						roomsConnects[connections[sessid].room.id].forEach(function(destId) {
							connections[destId].connection.sendUTF(
								JSON.stringify({'type':'bet','timeLeft':5})
							);
						});
						// setting the timeout
						setTimeout(function(){
							var scores=[];
							// computing scores
							room.players.forEach(function(player) {
								for(var i=room.game.answers.length-1; i>=0; i--){
									if(room.game.answers[i].id===player.bet.answer) {
										// the player chosen the right answer
										// he win its bet points
										room.game.answers[i].points+=player.bet.bet;
										if(room.game.answers[i].player===0)
											player.score+=player.bet.bet;
										// the player loose its bet giving points to the liar
										else
											room.players.some(function(liar){
												if(liar.id==room.game.answers[i].player) {
													liar.score+=player.bet.bet;
													return true;
												}
											});
									break;
									}
								}
								player.bet=null;
							});
							// sending scores to players
							roomsConnects[connections[sessid].room.id].forEach(function(destId) {
								connections[destId].connection.sendUTF(
									JSON.stringify({'type':'scores','answers':room.game.answers})
								);
							});
console.log(room.game.answers);
							// next round
							if(room.game.round<5) {
								setTimeout(function(){
									newRound(room);
								},7000);
							// ending the game
							} else {
								setTimeout(function() {
									var scores={'type':'end','scores':room.players.map(function(player){
												return {'player':player.id,'score':player.score};
											})};
									console.log(scores);
									// sending scores to players
									roomsConnects[connections[sessid].room.id].forEach(function(destId) {
										connections[destId].connection.sendUTF(JSON.stringify(scores))
									});
									room.game=null;
								},10000);
							}
						},4000) // 1 sec latency (3+1)
					}
					console.log((new Date()) + ' ['+connection.remoteAddress+'-'
						+(player?player.name+'('+player.id+')':'')+']: '
						+'Answer ('+msgContent.answer+').');
					break;
				default:
					console.log((new Date()) + ' ['+connection.remoteAddress+'-'
						+(player?player.name+'('+player.id+')':'')+']: '
						+'Unexpected message: ' + message.utf8Data);
					break;
			}
		}
	});
	// listening for connections close
	connection.on('close', function(reasonCode, description) {
		// if the user was conected
		if(connections[sessid]) {
			// deleting the connection if no reco after 30s
			connections[sessid].timeout=setTimeout(function() {
				console.log((new Date()) + ' ['+connection.remoteAddress+'-'
					+(player?player.name+'('+player.id+')':'')+']: '
					+'Cleanup ('+sessid+').');
				// on supprime la connection
				delete connections[sessid];
			},1000);
			if(connections[sessid].room) {
				leaveRoom(connections[sessid]);
			}
		}
	  console.log((new Date()) + ' ['+connection.remoteAddress+'-'
			+(player?player.name+'('+player.id+')':'')+']: '
			+'Disconnected ('+reasonCode+':'+description+' - '+sessid+').');
	});
});

// Utility functions
// removing the player from his room
function leaveRoom(connection) {
	if(connection&&connection.room) {
		var index=connection.room.players.indexOf(connection.player);
		if(-1!==index) {
			connection.room.players.splice(index,1);
			roomsConnects[connection.room.id].splice(
				roomsConnects[connection.room.id].indexOf(connection.sessid),1);
			// notifying players
			roomsConnects[connection.room.id].forEach(function(destId) {
				connections[destId].connection.sendUTF(JSON.stringify(
					{'type':'leave','player':connection.player.id})
				);
			});
			connection.room=null;
		}
	}
}
// new round
function newRound(room) {
	// reset game object
	room.game.state=WAIT_ANSWER;
	room.game.round++;
	room.game.bets=[];
	room.game.answers=[];
	// asking a new question
	var req = http.request({
		host: 'numbersapi.com',
		port: 80,
		path: '/random',
		method: 'GET'
	}, function(res) {
		var body='';
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			body+=chunk;
		});
		res.on('end', function (chunk) {
			console.log(body);
			var result=/^((?:[0-9]+)(?:\.[0-9]+|)(?:e(?:\+|\-)[0-9]+|)) (.*)$/.exec(body);
			// store the right answer
			room.game.answers.push({'value':body.replace('&','&amp;')
					.replace('<','&lt').replace('>','&gt').replace('"','&quot;'),
				'player':0, 'points':0});
			// sending the question to each player in the room
			roomsConnects[room.id].forEach(function(destId) {
				connections[destId].connection.sendUTF(
					JSON.stringify({'type':'round',
						'question':'Which fact hides behind the number '+result[1]+'?',
						'round':room.game.round
					})
				);
			});
		});
	});
	req.on('error', function(e) {
		console.log('Couldn\'t retrieve the question ! Error: ' + e.message +'.');
	});
	req.write('');
	req.end();
}

console.log('WebSocket Server started.');
