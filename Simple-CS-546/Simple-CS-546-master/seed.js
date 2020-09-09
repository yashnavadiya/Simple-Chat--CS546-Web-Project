const dbConnection = require('./config/mongoConnection');
const user = require('./data/user');
const room = require('./data/room');

const seedmain = async () => {
    //add users
    try {
        const db = await dbConnection();
        var newUser = await user.createUser('Michael', 'Scott', 'ms@dundermifflin.com', 'pewdiepie');
        var newUser1 = await user.createUser('Dright', 'Schrute', 'ds@dundermifflin.com', 'pewdiepie1');
        var newUser2 = await user.createUser('Jim', 'Halpert', 'jh@dundermifflin.com', 'pewdiepie2');
        var newUser3 = await user.createUser('Pam', 'Beesly', 'pb@dundermifflin.com', 'pewdiepie2');
        var newUser4 = await user.createUser('Kevin', 'Malone', 'km@dundermifflin.com', 'pewdiepie3');
        var newUser5 = await user.createUser('Andy', 'Bernard', 'ab@dundermifflin.com', 'pewdiepie3');
        var newUser6 = await user.createUser('Erin', 'Hanron', 'eh@dundermifflin.com', 'pewdiepie3');
        var newUser7 = await user.createUser('Toby', 'Flenderson', 'tf@dundermifflin.com', 'pewdiepie3');
        var newUser8 = await user.createUser('Angela', 'Martin', 'am@dundermifflin.com', 'pewdiepie3');
        var newUser9 = await user.createUser('Ryan', 'Howard', 'rh@dundermifflin.com', 'pewdiepie3');
        var newUser10 = await user.createUser('Creed', 'Bratton', 'cb@dundermifflin.com', 'pewdiepie3');
        var newUser11 = await user.createUser('Darryl', 'Philbin', 'dp@dundermifflin.com', 'pewdiepie3');
        var newUser12 = await user.createUser('Stanley', 'Hudson', 'sh@dundermifflin.com', 'pewdiepie3');
        var newUser13 = await user.createUser('Kelly', 'Kapoor', 'kk@dundermifflin.com', 'pewdiepie3');
        var newUser14 = await user.createUser('Meredith', 'Palmer', 'mp@dundermifflin.com', 'pewdiepie3');
        var newUser15 = await user.createUser('Oscar', 'Martinez', 'om@dundermifflin.com', 'pewdiepie3');
        var newUser16 = await user.createUser('Phylis', 'Vance', 'pv@dundermifflin.com', 'pewdiepie3');
        var newUser17 = await user.createUser('Roy', 'Anderson', 'ra@dundermifflin.com', 'pewdiepie3');

        var mic = await user.getUserByEmail('ms@dundermifflin.com');
        var dw = await user.getUserByEmail('ds@dundermifflin.com');
        var newRoom = await room.createRoom("Dunder Mifflin", "ChatRoom for employees of DM Scranton", mic._id, 30);
        var roomss = await user.roomList('ms@dundermifflin.com');
        var adduse = await room.addUser(dw._id, newRoom);
        await db.serverConfig.close();
    } catch (e) {
        console.log(e);
    }
}

seedmain().catch(console.log);
