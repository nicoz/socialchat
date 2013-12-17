var users = {};

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
    if (addUser(data)) {
      socket.emit('user added', {myself: data, users: users});
      socket.broadcast.emit('user added', {user: data, users: users});
    }
  });

});

function addUser(user){
  if ( !users[user.id] ) {
    users[user.id] = {
      nickname: user.nickname,
      avatar: user.avatar
    };
    return true;
  } 
  else
    return false;
}
