var users = [];

var _ = require("./underscore-min");

var app = require('http').createServer(handler), 
          io = require('socket.io').listen(app),
          fs = require('fs')

app.listen(7500);

function handler (req, res) {
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

io.sockets.on('connection', function(socket) {

  socket.on('add user', function (data){
    console.log('ADDING USER');
    console.log(data);
    if (addUser(data, socket)) {
      socket.emit('user added', {myself: data, users: users});
      socket.broadcast.emit('user added', {user: data, users: users});
    }
  });

  socket.on('disconnect', function (client) { 
    console.log(socket.id);
    var user = removeUser(socket.id);
    if (user) {
      io.sockets.emit('user disconnected', {user: user, users: users});
    }
  });
});

function addUser(user, socket){
  if ( _.findWhere(users, {id: user.id }) == undefined ) {
    users.push( {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      client_id: socket.id
    });
    return true;
  } 
  else
    return false;
}

function removeUser(clientid) {
  var user = _.findWhere(users, {client_id: clientid });
  users = _.without(users, user);
  return user;
}
