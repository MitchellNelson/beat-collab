var ws;
var app;
var signal_button;
var delay_seconds = 3000;

function init(){
	app = new Vue({
		el: "#app",
		data: {
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

    //Open websocket
    ws.onopen = (event) => {
        console.log("Connection successful!");
    };
    
    //Websocket message handler
    ws.onmessage = (event) => {
    	var message = JSON.parse(event.data);
        console.log(message);
		if(message.msg === 'client_count'){
            console.log("got a client_count msg")
        }
        else if(message.msg ==='play'){
            //calculate how long until start
            var now = new Date();
            var millis_until_play = new Date(message.start_time).getMilliseconds(); - now.getMilliseconds();
            setTimeout(function(){
                player_button.play();
            }, millis_until_play);
        }
    };
}

function sendPlaySignal(){
    start_time = calculateStartTime();
    console.log(start_time);
    ws.send(JSON.stringify({'msg':'play', 'start_time': start_time}));
}

function calculateStartTime(){
    var curr_time = new Date()     
    var seconds = curr_time.getMilliseconds() + delay_seconds;
    var start_time = curr_time + seconds;
    return start_time;
}
