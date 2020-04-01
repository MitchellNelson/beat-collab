var ws;
var app;
var num_counts = 4;

    Vue.component("modal", {
        template: "#modal-template"
    });

function Init()
{

	app = new Vue({
		el: "#app",
		data: {
            username:           "", 
            room_users:         [],
            messages:           [],
            new_message:        "",
            all_rows:           [],
            curr_selected:      null,
            curr_note_index:    0,
            prev_note_index:    15,
            bpm:                120,
            playing:            false,
            user_num:           null,
            timer:              null,
            avail_drums:        [],
            add_drum_drop:      false,
            room_id:            GetRoomId(),
            volume:             75,
            show_modal:         true
        },
        watch: {
            bpm: function(){
                app.timer.stop();
                ResetTimer();
                if (app.playing){
                    app.timer.run();
                }
            },
            playing: function(){
                if (app.playing){
                    Play();
                }
                else{
                    Stop();
                }
            }
        }
	});

    CreateDrum("Kick", "../audio/Kick.wav");
    CreateDrum("Snare", "../audio/Snare.wav");
    CreateDrum("Hihat", "../audio/Hi Hat.wav");
    CreateDrum("Open Hihat", "../audio/Open Hi Hat.wav");
    CreateDrum("Tom", "../audio/Rack Tom.wav");
    CreateDrum("Floor Tom", "../audio/Floor Tom.wav");
    CreateDrum("Trap Hat", "../audio/Trap Hat.wav");
    CreateDrum("Trap Open", "../audio/Trap Open.wav");
    CreateDrum("Clap", "../audio/Clap.wav");
    CreateDrum("Shaker", "../audio/Shake.wav");
    CreateDrum("Clave", "../audio/Clave.wav");
    CreateDrum("808", "../audio/808.wav");


    /*app.avail_drums.push({"name": "Trap Hat", "file_path": "../audio/Trap Hat.wav"})
    app.avail_drums.push({"name": "'Open Trap'", "file_path": "../audio/Trap Open.wav"})
    app.avail_drums.push({"name": "Clap", "file_path": "../audio/Clap.wav"})
    app.avail_drums.push({"name": "Shaker", "file_path": "../audio/Shake.wav"})
    app.avail_drums.push({"name": "Clave", "file_path": "../audio/Clave.wav"})
    app.avail_drums.push({"name": "808", "file_path": "../audio/808.wav"})*/

    //Websocket setup
    var port = window.location.port || "80";
    ws = new WebSocket("ws://" + window.location.hostname + ":" + port);

    //Websocket message handler
    ws.onopen = (event) => {
        console.log("Connection successful!");
        ws.send(JSON.stringify({'msg': 'set_room', 'new_room_id': app.room_id}));
    };

    ws.onclose =(event) => {
        ws.send(JSON.stringify({'msg': 'chat', 'room_id': app.room_id, 
            'sender': app.username + " has left the room", 'content': ""}));
    }

    ResetTimer();

    ws.onmessage = (event) => {
    	var message = JSON.parse(event.data);
        console.log(message);
		if (message.msg === "client_count"){
            app.user_num = message.data;
        }
        else if (message.msg === "play"){
            app.playing = true;
        }
        else if (message.msg === "stop"){
            app.playing = false;
        } 
        else if (message.msg === "clear"){
            console.log('clearing!')
            for (var i = 0; i < app.all_rows.length; i++){
                for(var j = 0; j < num_counts * 4; j++){
                    app.all_rows[i].nodes[j].selected = "";
                    app.all_rows[i].nodes[j].play = false;
                }
            }
        }
        else if (message.msg === "selected_pad"){
            var play_status = app.all_rows[message.row_index].nodes[message.node_index].play;
            app.all_rows[message.row_index].nodes[message.node_index].play =! play_status;
            if (play_status){
                app.all_rows[message.row_index].nodes[message.node_index].selected = " ";
            }
            else{
                app.all_rows[message.row_index].nodes[message.node_index].selected = message.selection_value;
            }
        }
        else if (message.msg === "create"){
            CreateDrum(message.name, message.file_path, message.drum_index);
        }
        else if (message.msg === "remove"){
            RemoveDrum(message.name, message.file_path, message.drum_index);
        }
        else if (message.msg === "send_state"){
            SendState();
            app.playing = false;
            Stop();
        }
        else if (message.msg === 'new_user'){
            app.room_users.push(message.username);
            console.log(message.username)
        }
        else if(message.msg === 'chat'){
            app.messages.push(new chat_item(message.sender, message.content))
        }
        else if (message.msg === "state"){
            app.room_users = message.room_users;
            var new_all_rows = JSON.parse(message.all_rows);
            SetState(new_all_rows);
            app.bpm = message.bpm;
            app.playing = false;
            Stop();
        }
    };
}

function GetRoomId(){
    return Math.random().toString(36).substring(2,4) + Math.random().toString(36).substring(2,4);
}

function SubmitUsername(){
    if (app.username.length > 0){
        ws.send(JSON.stringify({'msg': 'submit_username', 'room_id': app.room_id, 'username': app.username}))
        app.show_modal = false;
    }
}

function JoinRoom(){
    ws.send(JSON.stringify({'msg': 'set_room', 'new_room_id': app.room_id, 'username': app.username}));
    app.messages = [];
}

function SendPlayMessage(){ 
    ws.send(JSON.stringify({'msg': 'play', 'room_id': app.room_id}));
    ws.send(JSON.stringify({'msg': 'chat', 'room_id': app.room_id, 'content': '',
	                    'sender':app.username + ' has Played the Beat'}));
}

function SendStopMessage(){
    ws.send(JSON.stringify({'msg': 'stop', 'room_id': app.room_id}));
    ws.send(JSON.stringify({'msg': 'chat', 'room_id': app.room_id, 'content': '',
	                    'sender':app.username + ' has Stopped the Beat'}));
}

function SendClearMessage(){
    ws.send(JSON.stringify({'msg': 'clear', 'room_id': app.room_id}));
    ws.send(JSON.stringify({'msg': 'chat', 'room_id': app.room_id, 'content': '',
	                    'sender':app.username + ' has Cleared the Beat'}));
}

function ClickNode(row_index, node_index){
    ws.send(JSON.stringify({'msg': 'selected_pad', 'room_id': app.room_id, 'row_index': row_index, 
                            'node_index': node_index, 'selection_value': app.username[0]}));
}

function SendCreateDrumMessage(name, file_path, index){ 
    ws.send(JSON.stringify({'msg': 'create', 'room_id': app.room_id,'name': name, 'file_path': file_path, 
                            'drum_index': index}));
}

function SendRemoveDrumMessage(name, file_path, index){
    if (app.add_drum_drop){
        ws.send(JSON.stringify({'msg': 'remove', 'room_id': app.room_id, 'name': name, 'file_path': file_path, 
                                'drum_index': index}));
    }
}

function SendMessage(){
    ws.send(JSON.stringify({'msg': 'chat', 'room_id': app.room_id, 
        'content': app.new_message, 'sender': app.username}));
    app.new_message = "";
}

function Play(){
    /*app.timer = new interval((60000 / app.bpm) / 4, function(){
        for (var j = 0; j < app.all_rows.length; j++){
            if (app.all_rows[j].nodes[app.curr_note_index].play == true ){
                //set volume - divide by 100 becuase html range sliders are int only 
                app.all_rows[j].nodes[app.curr_note_index].audio_element.volume(app.volume / 100);
                app.all_rows[j].nodes[app.curr_note_index].audio_element.play();
            }
            app.all_rows[j].nodes[app.curr_note_index].curr_note = true;
            app.all_rows[j].nodes[app.prev_note_index].curr_note = false;
        }
        app.prev_note_index = app.curr_note_index;
        app.curr_note_index = (app.curr_note_index + 1) % 16;
    });*/
    app.timer.run();
}

function ResetTimer(){
    app.timer = new interval((60000 / app.bpm) / 4, function(){
    for (var j = 0; j < app.all_rows.length; j++){
        if (app.all_rows[j].nodes[app.curr_note_index].play == true ){
            //set volume - divide by 100 becuase html range sliders are int only 
            app.all_rows[j].nodes[app.curr_note_index].audio_element.volume(app.volume / 100);
            app.all_rows[j].nodes[app.curr_note_index].audio_element.play();
        }
        app.all_rows[j].nodes[app.curr_note_index].curr_note = true;
        app.all_rows[j].nodes[app.prev_note_index].curr_note = false;
    }
    app.prev_note_index = app.curr_note_index;
    app.curr_note_index = (app.curr_note_index + 1) % 16;
    });
}

function Stop(){
    if (app.timer != undefined){
        app.timer.stop();
    }
    ResetCurNote();
    ResetTimer();
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
    for (var i = 0; i < num_counts * 4; i++){
        var node_entry = {curr_note: false, selected: " ", play: false, audio_element: sound};
        this.nodes.push(node_entry);
    }
}

function chat_item(sender, message_content){
    this.sender = sender;
    this.message_content = message_content
}

function ResetCurNote(){
    //clearTimeout();
    app.curr_note_index = 0;
    app.prev_note_index = 15;

    for (var i = 0; i < app.all_rows.length; i++){
        for (var j = 0; j < num_counts * 4; j++){
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

function SetState(new_all_rows){
    for (var i = 0; i < new_all_rows.length; i++){
        for (var j = 0; j < new_all_rows[i].nodes.length; j++){
            app.all_rows[i].nodes[j].curr_note = new_all_rows[i].nodes[j].curr_note;
            app.all_rows[i].nodes[j].play = new_all_rows[i].nodes[j].play;
            app.all_rows[i].nodes[j].selected = new_all_rows[i].nodes[j].selected;
        }
    }
}

function SendState(){
    var state = {'msg': 'state', 'room_id': app.room_id, room_users: app.room_users, 'all_rows': JSON.stringify(app.all_rows, getCircularReplacer()), 
    'playing': false, 'bpm': app.bpm};
    console.log("sending state: " +  app.all_rows);
    ws.send(JSON.stringify((state)));
}

function Clear(){
    if (app.playing){
        SendStopMessage();
    }
    SendClearMessage();
}

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
}; 
