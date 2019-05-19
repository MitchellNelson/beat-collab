var ws;
var app;
var num_counts = 4;
function Init()
{
	app = new Vue({
		el: "#app",
		data: {
            all_rows: []
        }
	});
   
    CreateDrum("Kick", "../audio/Brooklyn_Kick.mp3");
    CreateDrum("Snare", "../audio/Brooklyn_Snare.mp3");
    CreateDrum("Hihat", "../audio/Brooklyn_Hat.mp3");
    CreateDrum("Open Hihat", "../audio/Brooklyn_OpenHat.mp3");

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
    };
    Play();
}

function interval(duration, fn){
  this.baseline = undefined
  
  this.run = function(){
    if(this.baseline === undefined){
      this.baseline = new Date().getTime()
    }
    fn()
    var end = new Date().getTime()
    this.baseline += duration
 
    var nextTick = duration - (end - this.baseline)
    if(nextTick<0){
      nextTick = 0
    }
    (function(i){
        i.timer = setTimeout(function(){
        i.run(end)
      }, nextTick)
    }(this))
  }

this.stop = function(){
   clearTimeout(this.timer)
 }
}

function Play(){
    var i =0;
    var timer = new interval(200, function(){
        for(var j = 0; j<app.all_rows.length; j++){
            if(app.all_rows[j].elements[i] == true ){
                app.all_rows[j].audio_elements[i].play();
            }
        }
        i = (i + 1) % 16;
    })
    timer.run()
}

function drum_row(name, audio_path){
    this.inst = null;
    this.elements = [];
    this.audio_elements = [];

    var audio_element = AddAudioElement(name,audio_path);

    //initialize elements to all false 
    //initialize all 16 cloned audio players
    for(var i = 0; i<num_counts * 4; i++){
        this.elements.push(false);
        this.audio_elements.push(audio_element.cloneNode());
    }
}

function CreateDrum(name, audio_path){
    new_drum_row = new drum_row(name, audio_path);
    new_drum_row.inst = name;
    app.all_rows.push(new_drum_row);
}

function AddAudioElement(name, audio_path){
    var audio_bay = document.getElementById('audio_bay');
    var new_player = document.createElement('audio');
    new_player.id = name+'_audio-player';
    new_player.src = audio_path;
    new_player.type = 'audio/mpeg';
    return audio_bay.appendChild(new_player);
}

