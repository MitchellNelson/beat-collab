var ws;
var app;
var num_counts = 4;
//
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
            timer: null,
            avail_drums: [],
            add_drum_drop: false,
            room_id: Math.random().toString(36).substring(2,4) + Math.random().toString(36).substring(2,4)
        },
        watch: {
            bpm: function(){
                Stop();
                this.playing=false;
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
    //CreateDrum("Open Hihat", "../audio/OpenHat.mp3");
    //CreateDrum("Tom", "../audio/Tom.mp3");
    //CreateDrum("Floor Tom", "../audio/Floor.mp3");

    app.avail_drums.push({"name": "Open Hihat", "file_path": "../audio/OpenHat.mp3"})
    app.avail_drums.push({"name": "Tom", "file_path": "../audio/Tom.mp3"})
    app.avail_drums.push({"name": "Floor Tom", "file_path": "../audio/Floor.mp3"})


    //Websocket setup
    var port = window.location.port || "80";
    ws = new WebSocket("ws://" + window.location.hostname + ":" + port);

    //Websocket message handler
    ws.onopen = (event) => {
        console.log("Connection successful!");
        ws.send(JSON.stringify({'msg': 'set_room', 'new_room_id': app.room_id}));
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
        else if(message.msg === "selected_pad"){
            app.all_rows[message.row_index].nodes[message.node_index].play =! app.all_rows[message.row_index].nodes[message.node_index].play;
        }
        else if(message.msg === "create"){
            CreateDrum(message.name, message.file_path, message.drum_index);
        }
        else if(message.msg === "remove"){
            RemoveDrum(message.name, message.file_path, message.drum_index);
        }

    };
}

function JoinRoom(){
    ws.send(JSON.stringify({'msg': 'set_room', 'new_room_id': app.room_id}))

}

function SendPlayMessage(){ 
    ws.send(JSON.stringify({'msg': 'play', 'room_id': app.room_id}));
}

function SendStopMessage(){
    ws.send(JSON.stringify({'msg': 'stop', 'room_id': app.room_id}));
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
    ResetCurNote();
}

function ClickNode(row_index, node_index){
    ws.send(JSON.stringify({'msg': 'selected_pad', 'room_id': app.room_id, 'row_index': row_index, 'node_index': node_index}));
}
function SendCreateDrumMessage(name, file_path, index){ 
    ws.send(JSON.stringify({'msg': 'create', 'room_id': app.room_id,'name': name, 'file_path': file_path, 'drum_index': index}));
}
function SendRemoveDrumMessage(name, file_path, index){
    ws.send(JSON.stringify({'msg': 'remove', 'room_id': app.room_id, 'name': name, 'file_path': file_path, 'drum_index': index}));
}

function drum_row(name, file_path){
    this.inst = name;
    this.nodes = [];
    this.file_path = file_path;
    var sound = new Howl({
        src: [file_path]
    });
    //initialize elements to all false 
    //initialize all 16 cloned audio players
    var i;
    for(i = 0; i<num_counts * 4; i++){
        var node_entry = {curr_note: false, selected: false, play: false, audio_element: sound};
        this.nodes.push(node_entry);
    }
}

function ResetCurNote(){
    clearTimeout();
    app.curr_note_index = 0;
    app.prev_note_index = 15;
    var i;
    for(i = 0; i<app.all_rows.length; i++){
        var j;
        for(j = 0; j<num_counts * 4; j++){
            app.all_rows[i].nodes[j].curr_note = false;
        }
    }
}

function CreateDrum(name, file_path, index){
    //remove the element from avail_drums
    app.avail_drums.splice(index,1);

    new_drum_row = new drum_row(name, file_path);
    app.all_rows.push(new_drum_row);
}
function RemoveDrum(name, file_path, row_index){
    app.all_rows.splice(row_index,1);
    app.avail_drums.push({"name": name, "file_path": file_path});
}

function AddAudioElement(name, file_path){
    var audio_bay = document.getElementById('audio_bay');
    var new_player = document.createElement('audio');
    new_player.id = name+'_audio-player';
    new_player.src = audio_path;
    new_player.type = 'audio/mpeg';
    return audio_bay.appendChild(new_player);
}

function SendState(){
    ws.send(JSON.stringify({'all_rows': app.all_rows}));//, 'curr_note_index': app.curr_note_index, 'prev_note_index': app.prev_note_index,'bpm': app.bpm,'playing': app.playing,'avail_drums': app.avail_drums}));
}
