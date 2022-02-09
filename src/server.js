const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Queue = require('bull');
const Redis = require('redis')
const jwt = require('jsonwebtoken')
const Course = require('./models/course')
const User = require('./models/user')
const Assignment = require('./models/assignment')
const Enrollment = require('./models/enrollment')

const app = new express()
const server = http.createServer(app)
const io = socketio(server)
const client = Redis.createClient()

io.on('connect_error', (err) => {
    socket.emit(err)
})

client.on('error', err => {
    console.log('Error' + err)
})

const courseUpdateQueue = new Queue('courseUpdate')
const assignmentUpdateQueue = new Queue('assignmentUpdate')

const options = {
    repeat: {
        every: 60000, // 1min
        limit: 100
    }
}
 
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.headers['authorization']
        const decoded = jwt.verify(token, 'mysecret') 
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token})
        if(!user || (!user.active)) return next(new 'Please Authenticate')
        if(user.type !== 'student') throw ('Only students can subscribe to notifications')
        socket.request.user = user
        return next()
    } catch (e) {
        next(e)
    }
})

io.on('connection', (socket) => {
    console.log('New client connected - ' + socket.request.user.name)
    socket.join(socket.request.user._id.toString())
})

const courseJob = async () => {
    try {
        const courses = await Course.find({})
        const date = new Date()
        console.log('Hourly Job - Course Status Updated', date)
        courses.forEach(async (course) => await course.updateStatus())
    }
    catch(e) {
        console.log(e)
    }
}

const assignmentJob = async () => {
    const assignments = await Assignment.find({})
    const date = new Date()
    assignments.forEach(async (a) => {
        if(a.start_time.getTime() <= date.getTime() && a.end_time.getTime() > date.getTime()) {
            console.log('updating...')
            const courseId = a.course_id
            const course = await Course.findById(courseId)
            const enrolls = await Enrollment.find({course_id: courseId})
            const studentIds = enrolls.map((enroll) => enroll.student_id)
            console.log(studentIds)
            studentIds.forEach((id) => io.sockets.to(id.toString()).emit(
                'notifications',
                'Assignment open for course - ' + course.name
            ))
        }
    })
}

courseUpdateQueue.add({}, options)
assignmentUpdateQueue.add({}, options)

courseUpdateQueue.process( async job => { 
    return await courseJob(); 
})

assignmentUpdateQueue.process(async job => {
    return await assignmentJob()
})

module.exports = {app, server}