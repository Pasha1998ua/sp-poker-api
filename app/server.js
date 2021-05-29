const fastify = require('fastify')({ logger: true })

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
