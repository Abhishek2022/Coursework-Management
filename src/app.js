const express = require('express')
require('./db/mongoose')
const User = require('./models/user')
const queue = require('./db/utils/queue')
const userRouter = require('./routers/userRouter')
const courseRouter = require('./routers/courseRouter')
const enrollmentRouter = require('./routers/enrollmentRouter')
const assignmentRouter = require('./routers/assignmentRouter')
const submissionRouter = require('./routers/submissionRouter')

const app = new express()
const port = 3000

app.use(express.json())

app.use('/users', userRouter)
app.use('/courses', courseRouter)
app.use('/enroll',enrollmentRouter)
app.use('/assignments',assignmentRouter)
app.use('/submissions',submissionRouter)

app.use((req,res,next) => {
    res.status(404).send({Error: 'Page not found'})
})

app.listen(port, () => {
    console.log('Listening on port ' +  port)
})