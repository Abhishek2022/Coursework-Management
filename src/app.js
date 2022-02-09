const express = require('express')
const server = require('./server')
require('./db/mongoose')
const userRouter = require('./routers/userRouter')
const courseRouter = require('./routers/courseRouter')
const enrollmentRouter = require('./routers/enrollmentRouter')
const assignmentRouter = require('./routers/assignmentRouter')
const submissionRouter = require('./routers/submissionRouter')

const port = 3000

server.app.use(express.json())

server.app.use('/users', userRouter)
server.app.use('/courses', courseRouter)
server.app.use('/enroll',enrollmentRouter)
server.app.use('/assignments',assignmentRouter)
server.app.use('/submissions',submissionRouter)

server.app.use((req,res,next) => {
    res.status(404).send({Error: 'Page not found'})
})

server.server.listen(port, () => {
    console.log('Listening on port ' +  port)
})
