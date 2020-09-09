const express = require('express');
const router = express.Router();
const roomFunctions = require('../data/room');
const userFunctions = require('../data/user');

// this will render user's homepage
router.get('/', async (req, res) => {
  try {
    // get user's date by email present in req.session.uMail
    var userObj = await userFunctions.getUserByEmail(req.session.uMail);

    // get room list
    var roomsList = userObj.roomList;

    // add roomnames to roomList
    for (let i = 0; i < roomsList.length; i++) {
      //console.log(roomsList[i]);
      //var m = roomsList[i].roomId;

      var rm = await roomFunctions.getRoom(roomsList[i].roomId)
      roomsList[i].roomName = rm.roomTitle;
    }


    // render home page with the roomlist and user object to personalize the handlebar      
    res.render('homepage', { title: "Dashboard", roomsList: roomsList })
  } catch (e) {
    console.log(e)
    res.status(400).render('error', { title: "error", post: e });
  }
});

// this will go to edit user details
router.get('/changepswd', async (req, res) => {
  try {
    res.render('changepassword', { title: "Change Password" })
  } catch (e) {
    res.render('error', { title: "error", message: e })
  }

});

router.post('/updatepswd', async (req, res) => {
  try {
    var userobj = await userFunctions.getUserByEmail(req.session.uMail);
    var id = userobj._id;
    let oldpassword = req.body.oldpassword;

    let newpassword = req.body.newpassword;
    let confirmpassword = req.body.confirmpassword;
    if (newpassword.length < 8) throw "The new password entered is very short!! (minimum 8 characters required)";
    let x = await userFunctions.changepassword(id, oldpassword, newpassword, confirmpassword);
    if (x == true) {
      res.render('changepassword', { message: "Password changed successfully ! " });
    }
    else {
      res.render('changepassword', { message: "Password could not be updated !" });
    }
  } catch (e) {
    res.render('changepassword', { title: "Login", message: e })
  }
});


module.exports = router;