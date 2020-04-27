var ws;
var app;
var chat_color = '#4cb178';

    Vue.component("modal", {
        template: "#modal-template"
    });

function Init(){
	app = new Vue({
		el: "#app",
		data: {
            username:            "", 
            user_colors:         ["#9dd975", "#75d9d4", "#757cd9", "#d975bb", "#d97575", "#d99575", ],
            selected_user_color: "",
            room_users:          [],
            messages:            [],
            new_message:         "",
            num_counts:          8,
            all_rows:            {},
            curr_selected:       null,
            curr_note_index:     0,
            prev_note_index:     15,
            bpm:                 120,
            playing:             false,
            user_num:            null,
            timer:               null,
            avail_drums:         [],
            add_drum_drop:       false,
            room_id:             GetRoomId(),
            volume:              75,
            show_modal:          true
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
    //CreateDrum("")
    CreateDrum("Kick1.wav","../audio/Kick1.wav");   
    CreateDrum("Snare1.wav","../audio/Snare1.wav");
    CreateDrum("Clap1.wav","../audio/Clap1.wav");
    CreateDrum("Hi Hat1.wav","../audio/Hi Hat1.wav");
    CreateDrum("Open Hihat.mp3","../audio/Open Hihat.mp3");
    CreateDrum("Ride1.wav","../audio/Ride1.wav");
    CreateDrum("Tamberine1.wav","../audio/Tamberine1.wav");
    CreateDrum("Shaker1.wav","../audio/Shaker1.wav");
    CreateDrum("Rim Click.mp3","../audio/Rim Click.mp3");
    CreateDrum("Hi Tom.mp3","../audio/Hi Tom.mp3");
    CreateDrum("Claves.mp3","../audio/Claves.mp3");

    app.avail_drums.push({"name":"Kick2.wav","file_path":"../audio/Kick2.wav"});
    app.avail_drums.push({"name":"Kick3.wav","file_path":"../audio/Kick3.wav"});
    app.avail_drums.push({"name":"Kick4.wav","file_path":"../audio/Kick4.wav"});
    app.avail_drums.push({"name":"Kick5.wav","file_path":"../audio/Kick5.wav"});
    app.avail_drums.push({"name":"Deep Kick1.mp3","file_path":"../audio/Deep Kick1.mp3"});
    app.avail_drums.push({"name":"Deep Kick2.mp3","file_path":"../audio/Deep Kick2.mp3"});
    app.avail_drums.push({"name":"Snare2.wav","file_path":"../audio/Snare2.wav"});
    app.avail_drums.push({"name":"Snare3.wav","file_path":"../audio/Snare3.wav"});
    app.avail_drums.push({"name":"Snare4.wav","file_path":"../audio/Snare4.wav"});
    app.avail_drums.push({"name":"Snare5.wav","file_path":"../audio/Snare5.wav"});
    app.avail_drums.push({"name":"Snare6.mp3","file_path":"../audio/Snare6.mp3"});
    app.avail_drums.push({"name":"Snare7.mp3","file_path":"../audio/Snare7.mp3"});
    app.avail_drums.push({"name":"Hi Hat2.wav","file_path":"../audio/Hi Hat2.wav"});
    app.avail_drums.push({"name":"Hi Hat3.wav","file_path":"../audio/Hi Hat3.wav"});
    app.avail_drums.push({"name":"Hi Hat4.wav","file_path":"../audio/Hi Hat4.wav"});
    app.avail_drums.push({"name":"Hi Hat5.wav","file_path":"../audio/Hi Hat5.wav"});
    app.avail_drums.push({"name":"Ride2.wav","file_path":"../audio/Ride2.wav"});
    app.avail_drums.push({"name":"Clap2.mp3","file_path":"../audio/Clap2.mp3"});
    app.avail_drums.push({"name":"Impact.wav","file_path":"../audio/Impact.wav"});
    app.avail_drums.push({"name":"Hi Conga.wav","file_path":"../audio/Hi Conga.wav"});
    app.avail_drums.push({"name":"Scrape.wav","file_path":"../audio/Scrape.wav"});
    app.avail_drums.push({"name":"Slap.mp3","file_path":"../audio/Slap.mp3"});
    app.avail_drums.push({"name":"Shaker2.wav","file_path":"../audio/Shaker2.wav"});
    app.avail_drums.push({"name":"Shaker3.mp3","file_path":"../audio/Shaker.mp3"});
    app.avail_drums.push({"name":"Lock.wav","file_path":"../audio/Lock.wav"});
    app.avail_drums.push({"name":"Crash1.wav","file_path":"../audio/Crash1.wav"});
    app.avail_drums.push({"name":"Crash2.mp3","file_path":"../audio/Crash.mp3"});
    app.avail_drums.push({"name":"conga1.mp3","file_path":"../audio/conga1.mp3"});
    app.avail_drums.push({"name":"Perc.wav","file_path":"../audio/Perc.wav"});
    app.avail_drums.push({"name":"Low Conga.wav","file_path":"../audio/Low Conga.wav"});
    app.avail_drums.push({"name":"Deep Hit.wav","file_path":"../audio/Deep Hit.wav"});
    app.avail_drums.push({"name":"Snap.wav","file_path":"../audio/Snap.wav"});
    app.avail_drums.push({"name":"Drop.wav","file_path":"../audio/Drop.wav"});
    app.avail_drums.push({"name":"Maracas.mp3","file_path":"../audio/Maracas.mp3"});


    // Pick random default color from options
    app.selected_user_color = app.user_colors[Math.floor(Math.random() * Math.floor(app.user_colors.length))]

    //Websocket setup
    var port = window.location.port || "80";
    ws = new WebSocket("ws://" + window.location.hostname + ":" + port);

    //Websocket message handler
    ws.onopen = (event) => {
        ws.send(JSON.stringify({'msg': 'set_room', 'new_room_id': app.room_id}));
    };

    ws.onclose =(event) => {
        ws.send(JSON.stringify({'msg': 'chat', 'room_id': app.room_id, 
            'sender': app.username + " has left the room", 'content': "", 'color': 'red'}));
    }

    ResetTimer();

    ws.onmessage = (event) => {
    	var message = JSON.parse(event.data);
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
            for (row in app.all_rows){
                var drum_row = app.all_rows[row];
                for(var j = 0; j < app.num_counts * 4; j++){
                    var node = drum_row.nodes[j]
                    node.selected = "";
                    node.play = false;
                    node.color = "";
                }
            }
        }
        else if (message.msg === "selected_pad"){
            var play_status = app.all_rows[message.row_name].nodes[message.node_index].play;
            app.all_rows[message.row_name].nodes[message.node_index].play =! play_status;
            var node = app.all_rows[message.row_name].nodes[message.node_index];
            //console.log(node);
            if (play_status){
                node.selected = " ";
                node.color = "";
            }
            else{
                node.selected = message.selection_value;
                node.color = message.color;
            }
            console.log(app.all_rows[message.row_name].nodes[message.node_index]);
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
        }
        else if(message.msg === 'chat'){
            app.messages.push(new chat_item(message.sender, message.content, message.color));
            setTimeout(function(){
                ScrollToEnd();
            }, 100);
            
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
	                    'sender':app.username + ' has Played the Beat', 'color': chat_color}));
}

function SendStopMessage(){
    ws.send(JSON.stringify({'msg': 'stop', 'room_id': app.room_id}));
    ws.send(JSON.stringify({'msg': 'chat', 'room_id': app.room_id, 'content': '',
	                    'sender':app.username + ' has Stopped the Beat', 'color': chat_color}));
}

function SendClearMessage(){
    ws.send(JSON.stringify({'msg': 'clear', 'room_id': app.room_id}));
    ws.send(JSON.stringify({'msg': 'chat', 'room_id': app.room_id, 'content': '',
	                    'sender':app.username + ' has Cleared the Beat', 'color': chat_color}));
}

function ClickNode(row_name, node_index){
    ws.send(JSON.stringify({'msg': 'selected_pad', 'room_id': app.room_id, 'row_name': row_name, 
                            'node_index': node_index, 'selection_value': app.username[0], 
                            'color': app.selected_user_color}));
}

function SendCreateDrumMessage(name, file_path, index){ 
    ws.send(JSON.stringify({'msg': 'create', 'room_id': app.room_id,'name': name, 'file_path': file_path, 
                            'drum_index': index}));
}

function SendRemoveDrumMessage(name, file_path, row_name){
    if (app.add_drum_drop){
        ws.send(JSON.stringify({'msg': 'remove', 'room_id': app.room_id, 'name': name, 'file_path': file_path, 
                                'drum_index': row_name}));
    }
}

function PreviewSound(row_name, index){
    if (app.all_rows.hasOwnProperty(row_name)){
        app.all_rows[row_name].nodes[0].audio_element.play();
    }
    else{
        var file_path = app.avail_drums[index].file_path;
        var sound = new Howl({
            src: [file_path]
        });
        sound.play();
    } 
}

function SelectColor(color){
    console.log(color);
    app.selected_user_color = color;
}

function SendMessage(){
    if (app.new_message.length > 0){
        ws.send(JSON.stringify({'msg': 'chat', 'room_id': app.room_id, 
            'content': app.new_message, 'sender': app.username, 'color': app.selected_user_color}));
        app.new_message = "";
    }
}

function Play(){
    app.timer.run();
}

function ResetTimer(){
    app.timer = new interval((60000 / app.bpm) / 4, function(){
    for (row in app.all_rows){
        var drum_row = app.all_rows[row];
        if (drum_row.nodes[app.curr_note_index].play == true ){
            //set volume - divide by 100 becuase html range sliders are int only 
            drum_row.nodes[app.curr_note_index].audio_element.volume(app.volume / 100);
            drum_row.nodes[app.curr_note_index].audio_element.play();
        }
        drum_row.nodes[app.curr_note_index].curr_note = true;
        drum_row.nodes[app.prev_note_index].curr_note = false;
    }
    app.prev_note_index = app.curr_note_index;
    app.curr_note_index = (app.curr_note_index + 1) % (4 * app.num_counts);
    });
}

function ScrollToEnd() {       
    var container = document.getElementsByClassName("messages");
    container[0].scrollTop = container[0].scrollHeight;
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
    for (var i = 0; i < app.num_counts * 4; i++){
        var node_entry = {curr_note: false, color: "", selected: " ", play: false, audio_element: sound};
        this.nodes.push(node_entry);
    }
}

function chat_item(sender, message_content, color){
    this.sender = sender;
    this.message_content = message_content;
    this.color = color;
}

function ResetCurNote(){
    app.curr_note_index = 0;
    app.prev_note_index = 15;

    for (row in app.all_rows){
        var drum_row = app.all_rows[row];
        for (var j = 0; j < app.num_counts * 4; j++){
            drum_row.nodes[j].curr_note = false;
        }
    }
}

function CreateDrum(name, file_path, index){
    //remove the element from avail_drums
    if (index == undefined){
        for(var i = 0; i < app.avail_drums.length; i++){
            if (app.avail_drums[i].name == name){
                index = i;
                console.log("found!!");
            }
        }
    }
    app.avail_drums.splice(index,1);

    new_drum_row = new drum_row(name, file_path);
    Vue.set(app.all_rows, name, new_drum_row);
    //app.all_rows[name] = new_drum_row;ß
}

function RemoveDrum(name, file_path, row_index){
    delete(app.all_rows[name]);
    //app.all_rows.splice(row_index,1);
    app.avail_drums.push({"name": name, "file_path": file_path});
}

function SetState(new_all_rows){
    for (new_row in new_all_rows){
        var new_drum_row = new_all_rows[new_row];
        if (!app.all_rows.hasOwnProperty(new_row)){
            CreateDrum(new_row,new_drum_row.file_path);
            console.log(new_row);
            console.log(new_drum_row.file_path)
            console.log(app.all_rows);
        }
        for (var j = 0; j < new_drum_row.nodes.length; j++){
            var node = app.all_rows[new_row].nodes[j];
            var new_node = new_drum_row.nodes[j];
            node.curr_note = new_node.curr_note;
            node.play = new_node.play;
            node.selected = new_node.selected;
            node.color = new_node.color;
        }
    }
    for (row in app.all_rows){
        var drum_row = app.all_rows[row];
        if (!new_all_rows.hasOwnProperty(row)){
            RemoveDrum(row, drum_row.file_path);
        }
    }
}

function SendState(){
    var state = {'msg': 'state', 'room_id': app.room_id, room_users: app.room_users, 
    'all_rows': JSON.stringify(app.all_rows, getCircularReplacer()), 
    'avail_drums': JSON.stringify(app.avail_drums, getCircularReplacer()),
    'playing': false, 'bpm': app.bpm};
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
