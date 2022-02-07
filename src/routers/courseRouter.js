const express = require('express')
const Course = require('../models/course')
const User = require('../models/user')
const auth = require('../middleware/auth')
const Enrollment = require('../models/enrollment')

const router = new express()

// Create a course
router.post('/create', auth.educatorAuth, async(req, res) => {
    try {
        const course = new Course(req.body)
        const date = new Date()
        if(req.body.start_date && (Date.parse(req.body.start_date) <= date.getTime())) {
            throw 'Choose a future start date'
        }
        course.educator_id = req.user._id
        await course.save()
        res.send(course)
    } catch(e) {
        res.status(400).send({Error: e})
    }
})

// List of students in a particular course
router.get('/students/:id', auth.educatorAuth, async(req, res) => {
    try {
        const course = await Course.findById(req.params.id)
        if(!course) throw 'Could not find course'
        if(!course.educator_id.equals(req.user._id)) throw 'Not authorized for this course'

        const enrolls = await Enrollment.find({course_id: req.params.id})
        const studentIds = enrolls.map((enroll) => enroll.student_id)
        const students = await User.find({ '_id' : { $in : studentIds}, active: true})
        res.send(students)
    } catch (e) {
        console.log(e)
        res.status(400).send({Error: e})
    }
})

// View courses created by the educator
router.get('/viewCourses', auth.educatorAuth, async(req, res) => {
    try {
        await req.user.populate('created_courses')
        res.send(req.user.created_courses)
    } catch (e) {
        console.log(e)
        res.status(400).send({Error: e})
    }
})

// Update a course
router.patch('/update/:id', auth.educatorAuth, async(req, res) => {
    const allowedUpdates = ['name', 'description', 'start_date', 'end_date']
    const updates = Object.keys(req.body)
    const isValid = updates.every((update) => allowedUpdates.includes(update))
    try {
        if(!isValid) throw 'Invalid update field'
        const course = await Course.findById(req.params.id)
        if(course.status === 'completed') throw 'The course is already over'
        if(!course) throw 'Could not find course'
        if(!course.educator_id.equals(req.user._id)) throw 'Not authorized to edit'
        
        const date = new Date()
        if(course.status == 'upcoming') {
            if(req.body.start_date && (Date.parse(req.body.start_date) < date.getTime())) {
                throw 'Choose a future start date'
            }
        } else if(course.status == 'running') {
            if(req.body.start_date) throw 'Cannot change start date of running course'
            if(req.body.end_date && (Date.parse(req.body.end_date) < date.getTime())) {
                throw 'Choose a future end date'
            }
        }

        updates.forEach((update) => course[update] = req.body[update])
        await course.save()
        res.send(course)
    } catch (e) {
        console.log(e)
        res.status(400).send({Error: e})
    }
})

// List of all the available courses for enrollment
router.get('/available', auth.studentAuth, async(req, res) => {
    try {
        const courses = await Course.find({status: {$ne: 'completed'}})
        res.send(courses)
    } catch (e) {
        console.log(e)
        res.status(400).send({Error: e})
    }
})

// View all my enrolled courses
// ?completed=true
router.get('/myCourses', auth.studentAuth, async(req, res) => {
    try {
        const enrolls = await Enrollment.find({student_id: req.user._id})
        const courseIds = enrolls.map((enroll) => enroll.course_id)
        let courses = await Course.find({ '_id' : { $in : courseIds}})

        if(req.query.completed) {
            if(req.query.completed === 'false') {
                courses = courses.filter((course) => (course.status!=='completed'))
            } else if (req.query.completed === 'true') {
                courses = courses.filter((course) => (course.status === 'completed'))
            } else {
                throw 'Invalid arguments'
            }
        }
        res.send(courses)
    } catch (e) {
        console.log(e)
        res.status(400).send({Error: e})
    }
})

module.exports = router