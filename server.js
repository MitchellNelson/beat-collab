var path = require('path');
var url = require('url');
var http = require('http');
var express = require('express');
var WebSocket = require('ws');
var timesyncServer = require('timesync/server');
var app = express();
var server = http.createServer(app);
var port = 8098;

var public_dir = path.join(__dirname, 'public');

app.use(express.static(public_dir));
var messages = [];
var wss = new WebSocket.Server({server: server});
var clients = {};
var client_count = 0;
wss.on('connection', (ws) => {
    var client_id = ws._socket.remoteAddress + ":" + ws._socket.remotePort;
    console.log('New connection: ' + client_id);
    client_count++;
    clients[client_id] = ws;   
    //clients[client_id].send(JSON.stringify({msg:'client_count',data:clients[client_id].player_num}));
    BroadcastPlayerNum();
    ws.on('message', (message) => {
        console.log('Message from ' + client_id + ': ' + message);
        Broadcast(message);
    });
    ws.on('close', () => {
        console.log('Client disconnected: ' + client_id);
        delete clients[client_id];
        client_count--;
    });
});
function BroadcastPlayerNum(){
   	var id;
    var i = 1;
    for(id in clients){
		if(clients.hasOwnProperty(id)){
			clients[id].send(JSON.stringify({msg:'client_count',data:i}));
		    i++;
        }
	}
}

function Broadcast(message){
	var id;
	for(id in clients){
		if(clients.hasOwnProperty(id)){
			clients[id].send(message);
		}
	}
}

server.listen(port, '0.0.0.0');
console.log('Now listening on port ' + port);
app.use('/timesync', timesyncServer.requestHandler);
