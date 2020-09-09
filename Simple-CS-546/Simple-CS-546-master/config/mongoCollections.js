// This file will help us connect to a particular collection

const dbConnection = require('./mongoConnection');

// This function will connect to a particular collection for us
const getCollectionFn = (collection) => {
  let _col = undefined;

  return async () => {
    if (!_col) {
      const db = await dbConnection();
      _col = await db.collection(collection);
    }

    return _col;
  };
};

/* Now, you can list your collections here: */
module.exports = {
  users: getCollectionFn('users'),
  rooms: getCollectionFn('rooms'),
  chat: getCollectionFn('chat'),
  online: getCollectionFn('online')
};


/* COLLECTION SCHEMAS
*
*   1. USER
*           [{
*               "_id":       (objectId),
*               "firstName": (String),
*                "lastName": (String),
*                "email":    (String),
*                "password": (String -> Output of a hashfunction),
*                "online":    (boolean),
*                "roomList": [{
*                            roomId:     (objectId),
*                            flairLevel: (Integer -> 0 = Creator, 1-3 = Other levels)
*                         }]
*            }]
*
*   ROOMS
*             [{
*               "_id":          (objectId),
*               "roomTitle":    (String),
*               "roomDesc":     (String),
*               "inviteCode":   (String),
*               "members":  [{
*                               "flairTitle": (String),
*                               "flairLevel": (Integer -> 0 = Creator, 1-3 = Other levels),
*                               "userId":     (ObjectId)
*                           }],
*               "creatorId": (ObjectId),
*               "limit":        (Integer),
*               "chat": [{
*                               "username":   (ObjectId),
*                               "time":     (Date),
*                               "text":     (String),
*                               "votes":  (Integer)
*                        }]
*            }]
*   Level 0 -> Creator,
*   Level 1 -> admin, everything except delete room,
*   Level 2 -> add/remove people lower level than them, edit flair titles
*   Level 3 -> text
*/
