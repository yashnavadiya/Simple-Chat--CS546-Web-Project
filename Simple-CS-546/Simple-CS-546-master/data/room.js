// All the functions that are related to rooms
const mongo = require('mongodb');
const mongoCollections = require('../config/mongoCollections');
const passHashFn = require('password-hash');

let userCollection = mongoCollections.users;
let roomsCollection = mongoCollections.rooms;
let userFunctions = require('./user');


//  create room
async function createRoom(roomTitle, roomDesc, creatorId, limit) {

    // verifying correctness of all the params
    if (!roomTitle || typeof (roomTitle) != 'string') throw "Error: The parameter roomTitle does not exist";
    if (!roomDesc || typeof (roomDesc) != 'string') throw "Error: The parameter roomDesc does not exist";
    if (!limit) {
        var limit = 50;   // Default limit
    } else if (!Number.isInteger(limit)) throw "Error: The parameter limit is not an integer";

    if (!creatorId) throw "Error: The parameter for id does not exist!!";
    var i = await isObjId(creatorId); //if string, it converts it to objectID
    let userColl = await userCollection();

    //checking if a user with creatorId exists
    var userArray = await userColl.find({ _id: i }).toArray();
    if (userArray.length === 0) throw "Error: a user with the given id does not exist!";

    var inviteCode = uuidv4();
    //check for colision

    var newRoom = {
        roomTitle: roomTitle,
        roomDesc: roomDesc,
        creatorId: i,
        inviteCode: inviteCode,
        limit: limit,
        members: [{ flairTitle: "Creator", flairLevel: 0, userId: i }],
        chat: []
    }

    var roomsColl = await roomsCollection();
    const insertedInfo = await roomsColl.insertOne(newRoom);
    if (insertedInfo.insertedCount === 0) throw 'Error: Adding post to roomscollection failed!';

    // update user's roomList
    const updated = await userColl.updateOne({ _id: i }, { $push: { "roomList": { roomId: insertedInfo.insertedId, flairLevel: 0 } } });
    if (updated.matchedCount === 0) throw "Error: the post cannot be updated!!";

    // return objectid of the created room
    return insertedInfo.insertedId;
}

// Helper function: a universally unique identifier generator, sourced from : https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
// used to create room invites
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// delete room
async function deleteRoom(roomId, userId) {
    if (!userId) throw "Error: The parameter for id does not exist!!";
    if (!roomId) throw "Error: The parameter for id does not exist!!";
    var useri = await isObjId(userId);
    var roomi = await isObjId(roomId);

    const userColl = await userCollection();
    const roomsColl = await roomsCollection();

    //checking user level
    var userArray = await userColl.find({ _id: useri }).toArray();
    if (userArray.length === 0) throw "Error: a user with the given id does not exist!";
    //console.log(userArray[0]._id);
    var roomArray = await roomsColl.find({ _id: roomi }).toArray();
    if (roomArray.length === 0) throw "Error: a room with the given id does not exist!";
    //console.log(roomArray[0].creatorId);
    if (userArray[0]._id.toString() != roomArray[0].creatorId.toString()) throw "Error: this user is not the room creator, hence he can't delete it";

    //delete room from each user's list
    var memberList = roomArray[0].members;
    for (var i = 0; i < memberList.length; i++) {
        var updatedInfo = await userColl.updateOne({ _id: memberList[i].userId }, { $pull: { roomList: { "roomId": roomi } } });
        if (updatedInfo.matchedCount == 0) throw "Error: User's roomlist could not be updated";
    }

    //delete room
    roomsColl.deleteOne({ _id: roomi });

    return roomArray[0];

}

//  getroom
async function getRoom(roomId) {
    if (!roomId) throw "Error: The param userId does not exist";
    var i = await isObjId(roomId);
    var roomsColl = await roomsCollection();

    var roomsArray = await roomsColl.find({ _id: i }).toArray();
    if (roomsArray.length == 0) throw "Error: room with given id does not exist";

    return roomsArray[0];
}

// edit room
async function editRoom(roomId, userId, roomTitle, roomDesc, limit) {
    let userColl = await userCollection();
    var roomsColl = await roomsCollection();


    if (!userId) throw "Error: The parameter for id does not exist!!";
    var useri = await isObjId(userId); //if string, it converts it to objectID

    if (!roomId) throw "Error: The parameter for id does not exist!!";
    var roomi = await isObjId(roomId); //if string, it converts it to objectID

    // check user level, 0 or 1
    var userArray = await userColl.find({ _id: useri }).toArray();
    if (userArray.length == 0) throw "Error: user with given id does not exist";

    var roomArray = await roomsColl.find({ _id: roomi }).toArray();
    if (roomArray.length == 0) throw "Error: room with given id does not exist";

    var memberList = roomArray[0].members;
    for (var m = 0; m < memberList.length; m++) {
        if (memberList[m].userId == useri && (memberList[m].flairLevel != 0 || memberList[m].flairLevel != 1)) {
            throw "Error: this user does not have the access to edit this room";
        }
    }

    // verifying correctness of all the params
    if (!roomTitle) {
        roomTitle = roomArray[0].roomTitle;
    } else if (typeof (roomTitle) != 'string') throw "Error: The parameter roomTitle is not a string";

    if (!roomDesc) {
        roomDesc = roomArray[0].roomDesc;
    } else if (typeof (roomDesc) != 'string') throw "Error: The parameter roomDesc is not a string";

    if (!limit) {
        limit = roomArray[0].limit;
    } else if (!Number.isInteger(limit)) throw "Error: The parameter limit is not an integer";

    // edit room
    const updated = await roomsColl.updateOne({ _id: roomi }, { $set: { roomTitle: roomTitle, roomDesc: roomDesc, limit: limit } });
    if (updated.matchedCount === 0) throw "Error: the post cannot be updated!!";

    return true;
}

//  add user
async function addUser(userId, roomId) {
    if (!userId) throw "Error: The param userId does not exist";
    var useri = await isObjId(userId);

    if (!roomId) throw "Error: The param roomId does not exist";
    var roomi = await isObjId(roomId);

    var roomsColl = await roomsCollection();
    var roomArray = await roomsColl.find({ _id: roomi }).toArray();
    if (roomArray.length == 0) throw "Error: room with given id does not exist";

    let userColl = await userCollection();
    var userArray = await userColl.find({ _id: useri }).toArray();
    if (userArray.length == 0) throw "Error: user with given id does not exist";
    var roomL = userArray[0].roomList;
    for (var i = 0; i < roomL.length; i++) {
        if (roomL[i].roomId.equals(roomi)) {
            return "You've already joined the room!"
        } else {
            console.log('a');
        }
    }

    // checking if room limit is reached
    if (roomArray[0].members.length == roomArray.limit) throw "Error: Max limit has been reached!";

    //update user's roomlist
    const userupdated = await userColl.updateOne({ _id: useri }, { $push: { "roomList": { roomId: roomi, flairLevel: 3 } } });
    if (userupdated.matchedCount === 0) throw "Error: the user's roomList cannot be updated!!";

    //update room's member list
    const roomupdated = await roomsColl.updateOne({ _id: roomi }, { $push: { "members": { flairTitle: "User", flairLevel: 3, userId: useri } } });
    if (roomupdated.matchedCount === 0) throw "Error: the room's memberlist cannot be updated!!";

    return "added to the room";
}

async function checkEntryCode(entryCode) {
    if (!entryCode) throw "Error: the entrycode param is empty!!";
    if (typeof (entryCode) != "string") throw "Error: the entry code is not a string";

    var roomsColl = await roomsCollection();
    var roomArray = await roomsColl.find({ inviteCode: entryCode }).toArray();

    var returnObj = {};
    if (roomArray.length == 0) {
        returnObj.none = "Invalid entry code"
    } else {
        returnObj = roomArray[0];
    }
    return returnObj;
}

//  remove user
async function removeUser(userId, roomId) {
    if (!userId) throw "Error: The param userId does not exist";
    var useri = await isObjId(userId);
    if (!roomId) throw "Error: The param roomId does not exist";
    var roomi = await isObjId(roomId);

    var roomsColl = await roomsCollection();
    var roomArray = await roomsColl.find({ _id: roomi }).toArray();
    if (roomArray.length == 0) throw "Error: room with given id does not exist";

    let userColl = await userCollection();
    var userArray = await userColl.find({ _id: useri }).toArray();
    if (userArray.length == 0) throw "Error: user with given id does not exist";

    //Check if room is empty
    if (roomArray[0].members.length == 0) throw "Error: the room list is already empty";

    //Check if user to be deleted is the creator
    if (userArray[0]._id == roomArray[0].creatorId) throw "Error: Cannot remove the room creator";

    //update user's roomlist
    const userupdated = await userColl.updateOne({ _id: useri }, { $pull: { "roomList": { roomId: roomi } } });
    if (userupdated.matchedCount === 0) throw "Error: the user's roomList cannot be updated!!";

    //update room's member list
    const roomupdated = await roomsColl.updateOne({ _id: roomi }, { $pull: { "members": { userId: useri } } });
    if (roomupdated.matchedCount === 0) throw "Error: the room's memberlist cannot be updated!!";

    return true;
}

//  change flair title
//  check user level in middleware
async function changeFlair(userId, roomId, currLevel, flairTitle) {
    if (!currLevel || !Number.isInteger(currLevel)) throw "Error: param currLevel is incorrect";
    if (!flairTitle || typeof (flairTitle) != 'string') throw "Error: param flairTitle is incorrect";

    if (!userId) throw "Error: The param userId does not exist";
    var useri = await isObjId(userId);

    if (!roomId) throw "Error: The param roomId does not exist";
    var roomi = await isObjId(roomId);

    var roomsColl = await roomsCollection();
    var roomArray = await roomsColl.find({ _id: roomi }).toArray();
    if (roomArray.length == 0) throw "Error: room with given id does not exist";

    let userColl = await userCollection();
    var userArray = await userColl.find({ _id: useri }).toArray();
    if (userArray.length == 0) throw "Error: user with given id does not exist";

    // currLevel -> level of user who is editing
    // userId -> taget user
    var targetLevel = 3;
    for (var m = 0; m < roomArray[0].members.length; m++) {
        if (roomArray[0].members[m].userId == useri) {
            targetLevel = roomArray[0].members[m].flairLevel;
            break;
        }
    }
    if (currLevel < targetLevel) throw "Error: you don't have the ability to change this user's details";

    //update room's member list
    const roomupdated = await roomsColl.update({ _id: roomi, 'members.userId': useri }, { $set: { "members.$.flairTitle": flairTitle } });
    if (roomupdated.matchedCount === 0) throw "Error: the room's memberlist cannot be updated!!";

    return true;
}

//  change user level
async function changeLevel(userId, roomId, targetLevel) {
    if (!targetLevel || !Number.isInteger(targetLevel) || targetLevel == 0) throw "Error: param flairLevel is incorrect";

    if (!userId) throw "Error: The param userId does not exist";
    var useri = await isObjId(userId);

    if (!roomId) throw "Error: The param roomId does not exist";
    var roomi = await isObjId(roomId);

    var roomsColl = await roomsCollection();
    let userColl = await userCollection();

    // update user's roomlist
    const userupdated = await userColl.updateOne({ _id: useri, 'roomList.roomId': roomi }, { $set: { "roomList.$.flairLevel": targetLevel } });
    if (userupdated.matchedCount === 0) throw "Error: the user's roomList cannot be updated!!";

    //update room's member list
    const roomupdated = await roomsColl.updateOne({ _id: roomi, 'members.userId': useri }, { $set: { "members.$.flairLevel": targetLevel } });
    if (roomupdated.matchedCount === 0) throw "Error: the room's memberlist cannot be updated!!";

    return true;
}

//  send message
async function sendMessage(emailId, roomId, text) {
    if (!text || typeof (text) != 'string') throw "Error: text param is invalid";
    if (!emailId) throw "Error: The param emailId does not exist";

    if (!roomId) throw "Error: The param roomId does not exist";
    var roomi = await isObjId(roomId);

    var roomsColl = await roomsCollection();
    var roomArray = await roomsColl.find({ _id: roomi }).toArray();
    if (roomArray.length == 0) throw "Error: room with given id does not exist";

    var userObj = await userFunctions.getUserByEmail(emailId);

    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date + ' ' + time;
    //update room's chat

    var message = {
        username: userObj.firstName + " " + userObj.lastName,
        text: text,
        time: dateTime,
        votes: 1
    }

    const roomupdated = await roomsColl.updateOne({ _id: roomi }, { $push: { "chat": message } });
    if (roomupdated.matchedCount === 0) throw "Error: the room's memberlist cannot be updated!!";

    return message;
}

//  upvote
async function upVote(roomId, emailId, time, text) {
    if (!text || typeof (text) != 'string') throw "Error: text param is invalid";
    if (!emailId) throw "Error: The param userId does not exist";
    if (!roomId) throw "Error: The param userId does not exist";
    if (!time) throw "Error: the time parameter does not exist!";

    var userObj = await userFunctions.getUserByEmail(emailId);

    var roomi = await isObjId(roomId);

    const roomsColl = await roomsCollection();
    var updatedInfo = await roomsColl.update({ _id: roomi, 'chat.username': userObj.firstName + " " + userObj.lastName, 'chat.time': time, 'chat.text': text }, { $inc: { 'chat.$.votes': 1 } })
    if (updatedInfo.matchedCount === 0) throw "Error: the number of upvotes could not be updated!!";

    return true;
}

//  downvote
async function downVote(roomId, emailId, time, text) {
    if (!text || typeof (text) != 'string') throw "Error: text param is invalid";
    if (!emailId) throw "Error: The param userId does not exist";
    if (!roomId) throw "Error: The param userId does not exist";
    if (!time) throw "Error: the time parameter does not exist!";

    var userObj = await userFunctions.getUserByEmail(emailId);
    var roomi = await isObjId(roomId);

    const roomsColl = await roomsCollection();
    var updatedInfo = await roomsColl.update({ _id: roomi, 'chat.username': userObj.firstName + " " + userObj.lastName, 'chat.time': time, 'chat.text': text }, { $inc: { 'chat.$.votes': -1 } })
    if (updatedInfo.matchedCount === 0) throw "Error: the number of upvotes could not be updated!!";

    return true;
}



//  list of users -> use getRoom
//  list of users with level less than current user's
async function lowerLevels(roomId, uMail) {
    if (!uMail) throw "there is no uMail param in the function";
    var userObj = await userFunctions.getUserByEmail(uMail);
    var roomi = await isObjId(roomId);
    var currLevel = 3;
    for (var i = 0; i < userObj.roomList.length; i++) {
        if (userObj.roomList[i].roomId.equals(roomi)) {
            currLevel = userObj.roomList[i].flairLevel;
            break;
        }
    }
    var roomsObj = await getRoom(roomId);
    var lusersArray = []
    for (var i = 0; i < roomsObj.members.length; i++) {
        if (roomsObj.members[i].flairLevel > currLevel) {
            lusersArray.push(roomsObj.members[i])
        }
    }
    return lusersArray;
}

// list of online users
async function getonlineusers(roomid) {
    if (!roomid) throw "Error: The parameter for id does not exist!!";
    var roomi = await isObjId(roomid); //if string, it converts it to objectID

    let x = await getRoom(roomi);

    var memberList = x.members;
    var online = [];
    for (var m = 0; m < memberList.length; m++) {
        let y = await userFunctions.getUser(memberList[m].userId);
        if (y.online == true) {
            online.push(y.firstName + " " + y.lastName);
        }
    }
    return online;
}

module.exports = { createRoom, deleteRoom, editRoom, addUser, removeUser, changeFlair, changeLevel, sendMessage, upVote, downVote, getRoom, lowerLevels, checkEntryCode, getonlineusers }

// HELPER FUNCTION - used to check if input is a valid objectId
async function isObjId(id) {
    if (mongo.ObjectID.isValid(id)) {
        // if param is an ObjectId then do nothing
    } else if (typeof (id) != "string" || id.length != 24 || !id.match("^[0-9a-f]+$")) {
        throw "Error: The parameter creatorId is not of valid format,it cant be converted to ObjectId";
    }
    return mongo.ObjectId(id);
}