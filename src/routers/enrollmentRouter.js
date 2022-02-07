const express = require('express')
const auth = require('../middleware/auth')
const Enrollment = require('../models/enrollment')
const Course = require('../models/course')
const User = require('../models/user')

const router = express()

// Enroll for a course
router.post('/', auth.studentAuth , async (req, res) => {
    try {
        const course = await Course.findOne(req.body)
        if(!course) throw 'Could not find course'

        if(course.capacity === 0) throw 'No seats available'
        if(course.status === 'completed') throw 'Cannot enroll for completed course'
        const enrollment = new Enrollment({course_id: course._id, student_id: req.user._id})
        course.capacity--;
        await enrollment.save()
        await course.save()
        res.send(enrollment)
    } catch (e) {
        console.log(e)
        res.status(400).send({Error : e})
    }
})

module.exports = router