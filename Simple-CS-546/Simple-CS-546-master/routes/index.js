const userRoutes = require('./user');
const roomRoutes = require('./room');
const outRoutes = require('./outside')

const constructormethod = app => {
    // room contains all routes related to the room
    app.use("/room", roomRoutes)

    // user contains all routes related to the user
    app.use("/user", userRoutes)

    // all routes related to user logging in and out
    app.use("/", outRoutes)

    app.use("*", (req, res) => {
        res.status(400).render('error', { title: "error", message: "You have reached an undefined path!!" });
    });

}


module.exports = constructormethod;
