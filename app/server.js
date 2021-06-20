const fastify = require('fastify')({ logger: false })
fastify.register(require('fastify-socket.io'));

const MESSAGE_CHANNEL = 'chatMsgEvent'
const UPDATE_CHANNEL = 'updateUser'
const JOIN_CHANNEL = 'joinRoom'
const LEAVE_CHANNEL = 'leaveRoom'
const GUEST_LIST = {}
const IDLE_CHECK_INTERVAL = 2000
const REMOVE_THRESHOLD = 3000

function addUserToRoomGuestList (roomId, userId, userInfo) {
    if(!GUEST_LIST[roomId]) {
        GUEST_LIST[roomId] = {}
    }
    GUEST_LIST[roomId][userId] = {...userInfo}
}

function updateUserInRoomGuestList (roomId, userId, userInfo) {
    if(GUEST_LIST[roomId]) {
        GUEST_LIST[roomId][userId] = {...userInfo}
    }
}

function deleteFromRoomGuestList (roomId, userId) {
    if(GUEST_LIST[roomId]) {
        delete GUEST_LIST[roomId][userId]
        if(Object.keys(GUEST_LIST[roomId]).length === 0) {
            delete GUEST_LIST[roomId]
        }
    }
}

function idleUserRemover () {
    const CURRENT_TIMESTAMP = Date.now()
    const GUEST_LIST_COPY = {...GUEST_LIST}
    for (const roomId in GUEST_LIST_COPY) {
        const ROOM_COPY = {...GUEST_LIST_COPY[roomId]}
        for (const userId in ROOM_COPY) {
            if((CURRENT_TIMESTAMP - ROOM_COPY[userId].lastUpdated) > REMOVE_THRESHOLD) {
                delete GUEST_LIST[roomId][userId]
            }
        }
        if(Object.keys(GUEST_LIST[roomId]).length === 0) {
            delete GUEST_LIST[roomId]
        }
    }
}
// Routes
fastify.post('/post-req', async (request, reply) => {
    reply.headers({
        'access-control-allow-origin': '*',
    })
    try {
        reply.send({
            statusCode: 200,
            result: "Success post"
        })
    } catch (err) {
        reply.send({
            statusCode: 500,
            result: err.toString()
        })
    }
})

fastify.get('/get-guests', async (request, reply) => {
    reply.headers({
        'access-control-allow-origin': '*',
    })
    try {
        reply.send({
            statusCode: 200,
            result: GUEST_LIST
        })
    } catch (err) {
        reply.send({
            statusCode: 500,
            result: err.toString()
        })
    }
})

// Socket.io
fastify.ready(err => {
    if (err) throw err

    fastify.io.on('connection', (socket) => {
        socket.on(MESSAGE_CHANNEL, msg => {
            fastify.io.in(msg.room).emit(MESSAGE_CHANNEL, msg);
        });
        socket.on(UPDATE_CHANNEL, (key, id, user) => {
            updateUserInRoomGuestList(key, id, {
                name: user,
                lastUpdated: Date.now()
            });
        });
        socket.on(JOIN_CHANNEL, (key, id, user) => {
            socket.join(key);
            // Emit event to inform joiners
            addUserToRoomGuestList(key, id, {
                name: user,
                lastUpdated: Date.now()
            });
            fastify.io.in(key).emit(MESSAGE_CHANNEL, {
                room: key,
                userNickName: 'System',
                sentTimestamp: Date.now(),
                message: user + ' connected to ' + key,
            });
        })
        socket.on(LEAVE_CHANNEL, (key, id, user) => {
            // Emit event to inform joiners
            fastify.io.in(key).emit(MESSAGE_CHANNEL, {
                room: key,
                userNickName: 'System',
                sentTimestamp: Date.now(),
                message: user + ' leave from ' + key,
            });
            deleteFromRoomGuestList(key, id);
            socket.leave(key);
        })
    });
})

// Run the server!
const start = async () => {
    try {
        await fastify.listen(8081);
        fastify.log.info(`server listening on ${fastify.server.address().port}`)
        setInterval(() => {
            idleUserRemover()
        }, IDLE_CHECK_INTERVAL)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
module.exports.start = start;
