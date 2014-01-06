var _ = require("./underscore-min");

var app = require('http').createServer(handler), 
          io = require('socket.io').listen(app),
          fs = require('fs')

app.listen(5000);

function handler (req, res) {
  if (req.url == "/admin"){
      fs.readFile(__dirname + '/admin.html', 
      function(err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error Loading index.html');
        }
        res.writeHead(200);
        res.end(data);
      });
  } else{
      fs.readFile(__dirname + '/index.html', 
      function(err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error Loading index.html');
        }
        res.writeHead(200);
        res.end(data);
      });
  }
}

var key_for_admin = "admin";
io.of("/" + key_for_admin).on('connection', function(socket) {
    socket.on('add socket instance', function (data){
        newChatService(data.key);
    });

    socket.on('get socket instances', function (){
        list = [];
        for(var k in io.namespaces){
            if (k != "")
                list.push({key: k});
        }
        socket.emit('get socket instances', list);
    });

    socket.on('remove socket instances', function(data){
      delete io.namespaces["/" + data.key];
    });
});

function newChatService(key){
    var users = [];
    var messages = [];
    var rooms = [];
    var rooms_count = 0;
    io.of("/" + key).on('connection', function(socket) {
      socket.on('add user', function (data){
        console.log('ADDING USER');
        console.log(data);
        if ( _.findWhere(users, {nickname: data.nickname }) == undefined ) {
          users.push( {
            id: data.id,
            nickname: data.nickname,
            avatar: data.avatar,
            client_id: socket.id
          });
          socket.emit('user logged', {user: data, users: users, messages: messages});
          //_.each(messages,function(message,index){
          //  socket.emit('new message', {text: message.text, user_sender: message.user_sender});
          //});
          socket.broadcast.emit('user added', {user: data});
        }else{
          socket.emit("nickname in use", {user: data.nickname });
        }
      });
      socket.on('new single chat', function(data){
        var invitated = _.findWhere(users, {nickname: data.nickname });
        var creator = _.findWhere(users, {client_id: socket.id });
        var is_able = true;
        if (invitated == creator){
            is_able = false;
        }
        else{
            _.each(rooms,function(room,index){
                if (room.is_single == true){
                    if (room.users.creator == creator && room.users.invitated == invitated || room.users.creator == invitated && room.users.invitated == creator ){
                        is_able = false;
                    }
                }
            });
        }
        if (is_able){
            var new_room = {
                id: String(rooms_count),
                users: { 
                    creator: creator,
                    invitated: invitated
                },
                is_single: true,
                messages : []
            };
            rooms.push(new_room);
            socket.join(new_room.id);
            invitated_socket = _.findWhere(io.of('/' + key).clients(), {id: invitated.client_id });
            invitated_socket.join(new_room.id);
            socket.emit("create private", new_room);
            invitated_socket.emit("create private", new_room);
            rooms_count++;
        }
      });
      socket.on("private message", function(data){
        var room = _.findWhere(rooms, {id: String(data.id) });
        user_sender = _.findWhere(users, {client_id: socket.id });
        room.messages.push({ text: data.text , user_sender: user_sender });
        io.of('/' + key).in(data.id).emit('private message', { room: room, text: data.text, user_sender: user_sender });
      });
      socket.on('new message', function (data){
        console.log('NEW MESSAGE');
        console.log(data);
        user_sender = _.findWhere(users, {client_id: socket.id });
        messages.push({
            text: data.text,
            user_sender: user_sender,
        });
        socket.emit('new message', {text: data.text, user_sender: user_sender});
        socket.broadcast.emit('new message', {text: data.text, user_sender: user_sender});
      });

      socket.on('disconnect', function (client) { 
        console.log(socket.id);
        var user = _.findWhere(users, {client_id: socket.id });
        users = _.without(users, user);
        socket.broadcast.emit('user disconnected', {user: user});
        _.each(rooms,function(room,index){
            if (room.is_single == true){
                if (room.users.creator.client_id == socket.id || room.users.invitated.client_id == socket.id ){
                  //var invitated_socket = _.findWhere(io.of('/' + key).clients(), {id: room.users.invitated.client_id});
                  //var creator_socket = _.findWhere(io.of('/' + key).clients(), {id: room.users.creator.client_id});
                    io.of('/' + key).in(room.id).emit('delete private', { room: room });
                    rooms = _.without(rooms, room);
                }
            }
        });

      });
      socket.on('loggout',function(){
        console.log(socket.id);
        var user = _.findWhere(users, {client_id: socket.id });
        users = _.without(users, user);
        socket.broadcast.emit('user disconnected', {user: user});
        _.each(rooms,function(room,index){
            if (room.is_single == true){
                if (room.users.creator.client_id == socket.id || room.users.invitated.client_id == socket.id ){
                  //var invitated_socket = _.findWhere(io.of('/' + key).clients(), {id: room.users.invitated.client_id});
                  //var creator_socket = _.findWhere(io.of('/' + key).clients(), {id: room.users.creator.client_id});
                    io.of('/' + key).in(room.id).emit('delete private', { room: room });
                    rooms = _.without(rooms, room);
                }
            }
        });
      });

    });
}

newChatService("asd");
newChatService("123");

