var ws;
var app;
var signal_button;

function init()
{
	app = new Vue({
		el: "#app",
		data: {
            plays:"null"
        }
	});
    //Get player_button from html
    player_button = document.getElementById("audioPlayer"); 

    //Get signal_button
    signal_button = document.getElementById("signal_button");
    signal_button.addEventListener("click",sendPlaySignal);

    //Websocket setup
    var port = window.location.port || "80";
    ws = new WebSocket("ws://" + window.location.hostname + ":" + port);

    //Websocket message handler
    ws.onopen = (event) => {
        console.log("Connection successful!");
    };
    ws.onmessage = (event) => {
    	var message = JSON.parse(event.data);
        console.log(message);
		if(message.msg === "client_count"){
            console.log("got a client_count msg")
        }
        else if(message.msg ==="play"){
            console.log("Got a play message!")
            plays="play message recieved"
            player_button.play();

        }
    };
}
function sendPlaySignal(){

    ws.send(JSON.stringify({"msg": "play","yes":"no"}));
}