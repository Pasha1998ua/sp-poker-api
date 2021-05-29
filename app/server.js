const fastify = require('fastify')({ logger: false })
fastify.register(require('fastify-socket.io'));

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

fastify.get('/get-req', async (request, reply) => {
    reply.headers({
        'access-control-allow-origin': '*',
    })
    try {
        reply.send({
            statusCode: 200,
            result: "Success get"
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
        socket.on('chat message', msg => {
            fastify.io.emit('chat message', msg);
        });
    });
})

// Run the server!
const start = async () => {
    try {
        await fastify.listen(8081);
        fastify.log.info(`server listening on ${fastify.server.address().port}`)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
module.exports.start = start;
