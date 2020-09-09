const express = require('express');
const router = express.Router();
let roomFunctions = require('../data/room');
let userFunctions = require('../data/user');

router.get('/joinRoom', async (req, res) => {
  try {
    res.status(400).render('joinRoom', { title: "Join a room", roomid: req.session.roomid });
  } catch (e) {
    console.log(e)
    res.status(400).render('joinRoom', { title: "Join a room", error: e, roomid: req.session.roomid });
  }
});

router.post('/joinRoom', async (req, res) => {
  try {
    // get the room from the entry code
    var roomObj = await roomFunctions.checkEntryCode(req.body.invitecode);
    if (roomObj.none) {
      throw roomObj.none;
    } else {
      // join room
      var userObj = await userFunctions.getUserByEmail(req.session.uMail);
      m = await roomFunctions.addUser(userObj._id, roomObj._id);

      //redirect to homepage
      //console.log(m);
      res.render('joinRoom', { title: "Join Room", message: m });
    }
  } catch (e) {
    console.log(e)
    res.status(400).render('joinRoom', { title: "Join Room", message: e });
  }
});
// renders edit room
router.get('/:id/edit', async (req, res) => {
  try {
    if (!req.session.roomid) {
      res.redirect('/user');
    }
    m = req.session.roomid;
    var lowerLevels = await roomFunctions.lowerLevels(m, req.session.uMail);
    if (lowerLevels.length == 0) {
      // array is empty
      // render error -> you cant access
      res.render('editroom', { title: "Edit Room", message2: "No users bellow your current level!", roomid: m });
    } else {
      //get username for each user
      for (var i = 0; i < lowerLevels.length; i++) {
        var obj = await userFunctions.getUser(lowerLevels[i].userId)
        lowerLevels[i].username = obj.firstName + " " + obj.lastName;
      }
      res.render('editroom', { title: "Edit Room", roomid: m, lowerLevels: lowerLevels });
    }
  } catch (e) {
    res.render('editroom', { title: "Edit Room", message: e, roomid: m })
  }
});

// implements updation on room details
router.post('/updateroom', async (req, res) => {
  try {
    var userobj = await userFunctions.getUserByEmail(req.session.uMail);
    var uid = userobj._id;
    let rid = req.session.roomid;
    var roomObj = await roomFunctions.getRoom(rid);
    let title = req.body.title;
    let des = req.body.description;
    let limit = parseInt(req.body.limit);
    if (limit < roomObj.members.length) {
      throw "Cannot set a limit which is lower than current number of members!";
    } else if (limit < 0) {
      throw "Cannot set a limit as negative!";
    } else {
      let x = await roomFunctions.editRoom(rid, uid, title, des, limit);
      var m = req.session.roomid;
      var lowerLevels = await roomFunctions.lowerLevels(m, req.session.uMail);
      var message = "Room updated Successfully ! ";
      if (x != true) {
        message = "Room could not be updated!";
      }
      if (lowerLevels.length == 0) {
        // array is empty
        // render error -> you cant access
        res.render('editroom', { title: "Edit Room", message: message, message2: "No users bellow your current level!", roomid: m });
      } else {
        //get username for each user
        for (var i = 0; i < lowerLevels.length; i++) {
          var obj = await userFunctions.getUser(lowerLevels[i].userId)
          lowerLevels[i].username = obj.firstName + " " + obj.lastName;
        }
        res.render('editroom', { title: "Edit Room", message: message, roomid: m, lowerLevels: lowerLevels });
      }
    }

  } catch (e) {
    var m = req.session.roomid;
    var lowerLevels = await roomFunctions.lowerLevels(m, req.session.uMail);
    if (lowerLevels.length == 0) {
      // array is empty
      // render error -> you cant access
      res.render('editroom', { title: "Edit Room", message: e, message2: "No users bellow your current level!", roomid: m });
    } else {
      //get username for each user
      for (var i = 0; i < lowerLevels.length; i++) {
        var obj = await userFunctions.getUser(lowerLevels[i].userId)
        lowerLevels[i].username = obj.firstName + " " + obj.lastName;
      }
      res.render('editroom', { title: "Edit Room", roomid: m, message: e, lowerLevels: lowerLevels });
    }

    //res.render('editroom', { message: e, roomid: req.session.roomid });
  }
});
// implements updation on room details
router.post('/remove', async (req, res) => {
  try {
    var x = req.body.action;
    // when there is only one user in the list

    if (x) {
      if (!Array.isArray(x)) {
        y = [];
        y.push(x);
        x = y;
      }
      for (var i = 0; i < x.length; i++) {
        if (x[i] != "") {
          var userid = x[i];
          var del = await roomFunctions.removeUser(userid, req.session.roomid);
        }
      }
    }
    var m = req.session.roomid;
    var lowerLevels = await roomFunctions.lowerLevels(m, req.session.uMail);
    if (lowerLevels.length == 0) {
      // array is empty
      // render error -> you cant access
      res.render('editroom', { title: "Edit Room", message2: "users succesfully deleted!! There are no users lower than your priority level!", roomid: m });
    } else {
      //get username for each user
      for (var i = 0; i < lowerLevels.length; i++) {
        var obj = await userFunctions.getUser(lowerLevels[i].userId)
        lowerLevels[i].username = obj.firstName + " " + obj.lastName;
      }
      res.render('editroom', { title: "Edit Room", roomid: req.session.roomid, message2: "users succesfully deleted!!", lowerLevels: lowerLevels });
    }

  } catch (e) {
    var m = req.session.roomid;
    var lowerLevels = await roomFunctions.lowerLevels(m, req.session.uMail);
    if (lowerLevels.length == 0) {
      // array is empty
      // render error -> you cant access
      res.render('editroom', { title: "Edit Room", message: e, message2: "No users bellow your current level!", roomid: m });
    } else {
      //get username for each user
      for (var i = 0; i < lowerLevels.length; i++) {
        var obj = await userFunctions.getUser(lowerLevels[i].userId)
        lowerLevels[i].username = obj.firstName + " " + obj.lastName;
      }
      res.render('editroom', { title: "Edit Room", message2: e, roomid: m, lowerLevels: lowerLevels });
    }
  }
});
// implements updation on room details
router.post('/levels', async (req, res) => {
  try {
    var x = req.body.action;
    // when there is only one user in the list

    if (x) {
      if (!Array.isArray(x)) {
        y = [];
        y.push(x);
        x = y;
      }
      for (var i = 0; i < x.length; i++) {
        if (x[i] != "") {
          var action = x[i];
          //"{{this.userId}},1,{{this.flairLevel}}"
          m = action.split(",");
          var targetLevel = parseInt(m[2]);
          if (m[1] == 1) {
            // promote
            if (m[2] != 1) {
              targetLevel--;
            }
          } else {
            // demote
            if (m[2] != 3) {
              targetLevel++;
            }
          }
          var prom = await roomFunctions.changeLevel(m[0], req.session.roomid, targetLevel)
          console.log(prom);
        }
      }
    }
    m = req.session.roomid;
    // calculating new lowerlevels list
    var lowerLevels = await roomFunctions.lowerLevels(m, req.session.uMail);
    if (lowerLevels.length == 0) {
      // array is empty
      // render error -> you cant access
      res.render('editroom', { title: "Edit Room", message2: "There are no users lower than your priority level!", roomid: m });
    } else {
      //get username for each user
      for (var i = 0; i < lowerLevels.length; i++) {
        var obj = await userFunctions.getUser(lowerLevels[i].userId)
        lowerLevels[i].username = obj.firstName + " " + obj.lastName;
      }
      res.render('editroom', { title: "Edit Room", roomid: req.session.roomid, message2: "users succesfully edited!!", lowerLevels: lowerLevels });
    }


  } catch (e) {
    res.render('editroom', { title: "Edit Room", message2: e, roomid: m });
  }
});

// leave room
router.get('/:id/leaveroom', async (req, res) => {
  try {
    var userObj = await userFunctions.getUserByEmail(req.session.uMail);
    var roomObj = await roomFunctions.getRoom(req.session.roomid);
    var del;
    if (roomObj.creatorId.equals(userObj._id)) {
      del = await roomFunctions.deleteRoom(roomObj._id, userObj._id);
    } else {
      del = await roomFunctions.removeUser(userObj._id, roomObj._id);
    }
    res.redirect('/');
  } catch (e) {
    console.log(e);
    res.redirect('/');
  }
});

// renders create room
router.get('/createroom', async (req, res) => {
  try {
    res.render('createroom', { title: "Create Room" })
  } catch (e) {
    res.render('error', { title: "Error", message: e })
  }

});

// creates the room
router.post('/createroom', async (req, res) => {
  try {
    var userobj = await userFunctions.getUserByEmail(req.session.uMail);
    var id = userobj._id;
    let rtitle = req.body.title;
    let rdesc = req.body.description;
    let limit = parseInt(req.body.limit);
    let x = await roomFunctions.createRoom(rtitle, rdesc, id, limit);
    if (x) {
      //res.redirect('/');
      res.render('createroom', { title: "Create a room", message: "Room Created successfully ! " });
    }
    else {
      res.render('createroom', { title: "Create a room", message: "Room could not be created !" });
    }
  } catch (e) {
    res.render('createroom', { title: "error", message: e })
  }
});

// middleware to check if user is a part of that room
router.get('/:id', async (req, res, next) => {
  try {
    let m = req.url;
    m = m.substring(1);
    var roomObj = await roomFunctions.getRoom(m);
    var flag = false;
    for (var i = 0; i < roomObj.members.length; i++) {
      var em = await userFunctions.getUser(roomObj.members[i].userId);
      if (req.session.uMail == em.email) {
        flag = true;
        break;
      }
    }
    if (flag) {
      next();
    } else {
      res.redirect('/');
    }
  } catch (e) {
    console.log(e)
    res.redirect('/');
    //res.status(400).render('error', { title: "error", message: e });
  }
});
// when user selects a room, this page will be rendered, it has the chat
router.get('/:id', async (req, res) => {
  try {
    // open chat
    // get chat history
    // get user room list from req.session.uMail
    // get list of online users
    let m = req.url;
    m = m.substring(1);

    req.session.roomid = m;
    var roomObj = await roomFunctions.getRoom(m);
    var listOnline = await roomFunctions.getonlineusers(m);
    var userObj = await userFunctions.getUserByEmail(req.session.uMail);
    var roomsList = userObj.roomList;
    for (let i = 0; i < roomsList.length; i++) {
      var rm = await roomFunctions.getRoom(roomsList[i].roomId)
      roomsList[i].roomName = rm.roomTitle;
    }

    res.render('chatbox', {
      title: roomObj.roomTitle,
      usermail: req.session.uMail, // for socket.io
      roomsList: roomsList,
      roomId: m,
      history: roomObj.chat,
      listOnline: listOnline,
      invitecode: roomObj.inviteCode,
      desc: roomObj.roomDesc
    });
  } catch (e) {
    console.log(e)
    res.status(400).render('error', { title: "error", message: e });
  }
});

module.exports = router;