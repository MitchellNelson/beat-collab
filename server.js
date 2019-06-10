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
var rooms = {};
wss.on('connection', (ws) => {
    var client_id = ws._socket.remoteAddress + ":" + ws._socket.remotePort;
    console.log('New connection: ' + client_id);

    ws.on('message', (message) => {
        var parsed_message = JSON.parse(message);
        console.log('Message from ' + client_id + ': ' + message);
        
        if(parsed_message.msg == "set_room"){
            SetRoom(client_id, parsed_message.room_id, ws);
        }
        else{
            Broadcast(message, parsed_message.room_id);           
        }
    });
    ws.on('close', (message) => {
        var parsed_message = JSON.parse(message);
        console.log('Client disconnected: ' + client_id + message);
        var room;
        for(room in rooms.clients){
            delete room[client_id];
        }
    });
});

function SetRoom(client_id, room_id, ws){
    
    if(!rooms.hasOwnProperty(room_id)){
        console.log("setting new room")
        var new_room = new Room(room_id);
        new_room.clients[client_id] = ws;
        rooms[room_id] = new_room;

        console.log(rooms)
    }
    else{
        console.log("room already exists, add client info to room");

        rooms[room_id].clients[client_id] = ws;
        console.log(rooms)
    }
}

function Broadcast(message, room_id){
	var id;
    var curr_room = rooms[room_id];
    
	for(id in curr_room.clients){
		if(curr_room.clients.hasOwnProperty(id)){
			curr_room.clients[id].send(message);
        }
	}
}

function Room(id){
    this.clients = {};
    this.room_id = id;
}

server.listen(port, '0.0.0.0');
console.log('Now listening on port ' + port);
app.use('/timesync', timesyncServer.requestHandler);
