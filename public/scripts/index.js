var ws;
var app;
var num_counts = 4;
function Init()
{
	app = new Vue({
		el: "#app",
		data: {
            all_rows: [],
            curr_selected:null,
            curr_note_index:0,
            prev_note_index:15,
            bpm: 100,
            playing: true,
            timer: null
        },
        watch: {
            bpm: function(){
                Stop();
                Play();
            },
            playing: function(){
                if(this.playing){
                    Play();
                }
                else{
                    Stop();
                }
            }
        }

	});

    
   
    CreateDrum("Kick", "../audio/Kick.mp3");
    CreateDrum("Snare", "../audio/Snare.mp3");
    CreateDrum("Hihat", "../audio/Hat.mp3");
    CreateDrum("Open Hihat", "../audio/OpenHat.mp3");
    CreateDrum("Tom", "../audio/Tom.mp3");
    CreateDrum("Floor Tom", "../audio/Floor.mp3");

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

//interval.js - https://gist.github.com/manast/1185904 
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
    //var app.curr_note_index = 0;
    //var app.prev_note_index = 15;
    app.timer = new interval(60000/app.bpm/4, function(){
        for(var j = 0; j<app.all_rows.length; j++){
            app.all_rows[j].nodes[app.curr_note_index].curr_note = true;
            app.all_rows[j].nodes[app.prev_note_index].curr_note = false;
            if(app.all_rows[j].nodes[app.curr_note_index].play == true ){
                app.all_rows[j].nodes[app.curr_note_index].audio_element.play();
            }

        }
        app.prev_note_index=app.curr_note_index;
        app.curr_note_index = (app.curr_note_index + 1) % 16;
    })
    app.timer.run();
}

function Stop(){
    app.timer.stop();
}

function drum_row(name, audio_path){
    this.inst = name;
    this.nodes = [];
        var sound = new Howl({
            src: [audio_path]
        });
    //initialize elements to all false 
    //initialize all 16 cloned audio players
    for(var i = 0; i<num_counts * 4; i++){

        var node_entry = {curr_note: false, selected: false, play: false, audio_element: sound};
        this.nodes.push(node_entry);
    }
}

function CreateDrum(name, audio_path){
    new_drum_row = new drum_row(name, audio_path);
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

