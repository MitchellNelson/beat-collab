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
            playing: false,
            user_num:null,
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
            app.user_num=message.data;
        }
        else if(message.msg === "play"){
            app.playing = !app.playing;
            //Play();
        }
        else if(message.msg === "stop"){
            app.playing = !app.playing;
            //Stop();
        }
    };
}

function ClickPlayButton(){ 
    ws.send(JSON.stringify({'msg': 'play'}));
}

function ClickStopButton(){
    ws.send(JSON.stringify({'msg': 'stop'}));
}

function Play(){
    app.timer = new interval(60000/app.bpm/4, function(){
        for(var j = 0; j<app.all_rows.length; j++){
            if(app.all_rows[j].nodes[app.curr_note_index].play == true ){
                app.all_rows[j].nodes[app.curr_note_index].audio_element.play();
            }
            app.all_rows[j].nodes[app.curr_note_index].curr_note = true;
            app.all_rows[j].nodes[app.prev_note_index].curr_note = false;
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

