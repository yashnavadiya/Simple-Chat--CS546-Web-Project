// We first require our express package
const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const bodyparser = require('body-parser');
const static = express.static(__dirname + '/public');
const configRoutes=require('./routes');
const roomFunctions=require('./data/room');
const userFunctions=require('./data/user');

// We create our express instance:
const app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use('/public', static);

// for parsing json
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
  extended:true
}));

// creaitng cookie
app.use(session({
    name: 'AuthCookie',
    secret: 'some secret string!',
    resave: false,
    saveUninitialized: true
}))

// 1.Middleware :runs every time
app.use('/',function(req, res, next) {
  var str = "["+new Date().toUTCString() + "]: " + req.method + "  " + req.originalUrl;
  if(req.session.uMail){
    str = str + ' (Authenticated User)';
  }else{
    str = str + ' (Non-Authenticated User)';
  }
  console.log(str);
  next();
});

// 2.Middleware for user route
app.use('/user', async (req, res, next) => {
  let sess = req.session; 
  if(!sess.uMail){
    //If a user is not logged in
    res.status(403).render('error',{title:"error",message:"user is not logged in!!"});
  }else{
    next();
  }
  // else if user is already logged in, then they will be taken to user.js in routes  
});

// 2.Middleware for room route
app.use('/room', async (req, res, next) => {
  let sess = req.session; 
  if(!sess.uMail){
    //If a user is not logged in
    res.status(403).render('error',{title:"error",message:"user is not logged in!!"});
  }else{
    next();
  }
  // else if user is already logged in, then they will be taken to user.js in routes  
});

// calling the routes folder
configRoutes(app);

// We can now navigate to localhost:3000
server =app.listen(3000, function() {
  console.log('Your server is now listening on port 3000! Navigate to http://localhost:3000 to access it');
});

const io=require("socket.io")(server);

io.on('connection', async function(socket){
  // this will run when socket is connected
  console.log('a user connected');

  // When frontend js makes a socket.emit() call
  socket.on('chat message', async function(msgObj){
    console.log('message: ' + msgObj.msg);

    var message = await roomFunctions.sendMessage(msgObj.email,msgObj.roomId,msgObj.msg);

    // This will emit the event to all connected sockets
    io.emit('chat message',message.username +": "+ msgObj.msg);
});

});