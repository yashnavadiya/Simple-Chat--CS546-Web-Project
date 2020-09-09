// All the functions that are related to users
const mongo = require('mongodb');
const mongoCollections = require('../config/mongoCollections');
const passHashFn = require('password-hash');
const roomfunctions = require('./room.js');

let userCollection = mongoCollections.users;
let onlineCollection = mongoCollections.online;
let roomsCollection = mongoCollections.rooms;

// Create user 
async function createUser(firstName, lastName, email, password) {
    if (!firstName || typeof (firstName) != "string") throw "Error: firstName param does not exist or is not a String";
    if (!lastName || typeof (lastName) != "string") throw "Error: lastName param does not exist or is not a String";
    if (!email || typeof (email) != "string") throw "Error: email param does not exist or is not a String";
    if (!password || typeof (password) != "string") throw "Error: password param does not exist or is not a String";
    if (password.length < 8) throw "Error: the password is not long enough (minimum 8)";

    // connecting to the user collection
    var userColl = await userCollection();

    // checking if user with a given email already exists
    email = email.toLowerCase();
    var emailExists = await userColl.find({ email: email }).toArray();
    if (emailExists.length != 0) {
        throw "Error: A user with the given email already exists!";
    }

    // Now that the user is a new user, we can proceed to adding them
    //  password is passed through a hashfunction
    var hashedPassword = passHashFn.generate(password);

    // created a new object to represent our user
    var newUser = {
        "firstName": firstName,
        "lastName": lastName,
        "email": email,
        "password": hashedPassword,
        "online": false,
        "roomList": [] // initially, the user will not be a part of any room
    }

    // insert user into the database
    var insertedInfo = await userColl.insertOne(newUser);
    if (insertedInfo.insertedCount === 0) throw 'Error: Adding user to userCollection failed!';

    return newUser;
}

// Get user by Id
async function getUser(id) {
    if (!id) throw "Error: The parameter for id does not exist!!";
    var i = await isObjId(id);
    var userColl = await userCollection();

    var userArray = await userColl.find({ _id: i }).toArray();
    if (userArray.length === 0) throw "Error: a user with the given id does not exist!";

    return userArray[0];
}

// Get user by email
async function getUserByEmail(email) {
    if (!email || typeof (email) != 'string') throw "Error: The parameter for email does not exist!!";
    var userColl = await userCollection();

    var userArray = await userColl.find({ email: email }).toArray();
    if (userArray.length === 0) throw "Error: a user with the given email does not exist!";

    return userArray[0];
}

// Delete User (deletes user and returns the deleted user)
async function deleteUser(id) {

    if (!id) throw "Error: The parameter does not exist!!";
    var i = await isObjId(id);  // checks if param is a objectid, if not checks if its a proper hex string

    const userColl = await userCollection();
    const roomsColl = await roomsCollection();

    //find the user to be deleted
    var tobedeleted = await userColl.find({ _id: i }).toArray();
    if (tobedeleted.length == 0) throw "Error: the element to be deleted does not exist!";

    //  delete all the rooms created by the user
    var createdArray = await roomsColl.find({ creatorId: i }).toArray();
    for (var m = 0; m < createdArray.length; m++) {
        //delete rooms function of room.js

        var deletedRoom = await roomfunctions.deleteRoom(createdArray[m]._id, i);
    }

    //remove user from remaining rooms
    //(refreshing user data, to find the updated roomList)
    tobedeleted = await userColl.find({ _id: i }).toArray();
    // if(tobedeleted.length == 0)throw "Error: the element to be deleted does not exist!";

    for (var n = 0; n < tobedeleted[0].roomList.length; n++) {
        // remove user function of room.js
        console.log(tobedeleted[0]);
        const removed = await roomfunctions.removeUser(tobedeleted[0]._id, tobedeleted[0].roomList[n].roomId);
        //if(roomupdated.matchedCount === 0) throw "Error: the room's memberlist cannot be updated!!";

    }

    // deleting user from user collection
    const deleted = await userColl.deleteOne({ _id: i });
    if (deleted.deletedCount == 0) throw "Error: could not delete user from collection"

    return tobedeleted[0];
}

// changepassword
async function changepassword(id, oldPassword, newPassword, newPassword1) {
    if (!id) throw "Error: The parameter for id does not exist!!";
    if (!oldPassword || typeof (oldPassword) != 'string') throw "Error: The parameter for oldPassword does not exist!!";
    if (!newPassword || typeof (newPassword) != 'string') throw "Error: The parameter for newPassword does not exist!!";
    if (!newPassword1 || typeof (newPassword1) != 'string') throw "Error: The parameter for newPassword does not exist!!";

    var i = await isObjId(id);
    var userColl = await userCollection();

    var userArray = await userColl.find({ _id: i }).toArray();
    if (userArray.length === 0) throw "Error: a user with the given id does not exist!";

    if (!passHashFn.verify(oldPassword, userArray[0].password)) {
        throw "Error: the old password field does not match the actual password";
    }
    if (newPassword !== newPassword1) {
        throw "Error: the new passwords do not match each other";
    }

    // convert new password to hash and update the object
    var newPass = passHashFn.generate(newPassword);
    var updated = await userColl.updateOne({ _id: i }, { $set: { "password": newPass } });
    if (updated.matchedCount === 0) throw "Error: the password could not be updated!!";
    return true;
}

// login
async function userLogin(userEmail, userPassword) {
    if (!userEmail || typeof (userEmail) != 'string') throw "Error: the userEmail param does not exist";
    if (!userPassword || typeof (userPassword) != 'string') throw "Error: the userPassword param does not exist";
    userEmail = userEmail.toLowerCase();

    //  check if user with given email exists
    var userColl = await userCollection();
    var userArray = await userColl.find({ email: userEmail }).toArray();
    if (userArray.length === 0) throw "Error: a user with the given id does not exist!";

    //  verify the password
    if (!passHashFn.verify(userPassword, userArray[0].password)) {
        throw "Error: incorrect password entered";
    }

    // Now we can add current user to "online" collection
    var makeOnline = await userColl.updateOne({ _id: userArray[0]._id }, { $set: { online: true } });
    if (makeOnline.matchedCount == 0) throw "Error: could not update user's online flag";

    return userArray[0];
}

// logout
async function userLogout(userEmail) {
    if (!userEmail || typeof (userEmail) != 'string') throw "Error: the userEmail param does not exist";
    userEmail = userEmail.toLowerCase();

    var userColl = await userCollection();

    //  check if user with given email exists
    var userArray = await userColl.find({ email: userEmail }).toArray();
    if (userArray.length === 0) throw "Error: a user with the given id does not exist!";

    // check if current user is logged in or not
    var makeOffline = await userColl.updateOne({ _id: userArray[0]._id }, { $set: { online: false } });
    if (makeOffline.matchedCount == 0) throw "Error: could not update user's online flag";

    return true;
}

// list of rooms a user is part of
async function roomList(userEmail) {
    if (!userEmail || typeof (userEmail) != 'string') throw "Error: the userEmail param does not exist";
    userEmail = userEmail.toLowerCase();

    var userColl = await userCollection();

    //  check if user with given email exists
    var userArray = await userColl.find({ email: userEmail }).toArray();
    if (userArray.length === 0) throw "Error: a user with the given id does not exist!";

    // returns the list of rooms that user is a part of
    return userArray[0].roomList;
}
module.exports = { createUser, getUser, deleteUser, changepassword, userLogin, userLogout, getUserByEmail, roomList }

// helper method
async function isObjId(id) {
    if (mongo.ObjectID.isValid(id)) {
        // if param is an ObjectId then do nothing
    } else if (typeof (id) != "string" || id.length != 24 || !id.match("^[0-9a-f]+$")) {
        throw "Error: The parameter creatorId is not of valid format,it cant be converted to ObjectId";
    }
    return mongo.ObjectId(id);
}

/*   1. USER
*           [{
*               "_id":       (objectId),
*               "firstName": (String),
*                "lastName": (String),
*                "email":    (String),
*                "password": (String -> Output of a hashfunction),
*                "type":     (String -> Student, Mentor or Teacher)
*                "roomList": [{
*                            roomId:     (objectId),
*                            flairLevel: (Integer -> 0 = Creator, 1-3 = Other levels)
*                         }]
*            }]
*/