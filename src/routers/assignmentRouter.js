const express = require('express')
const auth = require('../middleware/auth')
const Assignment = require('../models/assignment')
const Course = require('../models/course')
const Enrollment = require('../models/enrollment')

const router = express()

// Create an assignment
router.post('/create', auth.educatorAuth, async(req, res) => {
    try {
        const course = await Course.findOne({name: req.body.course_name})
        if(!course) throw 'Could not find course'
        if(!course.educator_id.equals(req.user._id)) throw 'Not authorized to add assignment'

        if(course.status!='running') throw ('Cannot create assignment for ' + course.status + ' course')

        if(req.body.start_time && Date.parse(req.body.start_time) < course.start_date.getTime()) {
            throw 'Assignment start time should be after the course starts'
        }
        if(req.body.end_time && Date.parse(req.body.end_time) > course.end_date.getTime()) {
            throw 'Assignment end time should be before the course ends'
        }

        const assignment = Assignment(req.body)
        assignment.course_id = course._id
        await assignment.save()
        res.send(assignment)
    } catch (e) {
        console.log(e)
        res.status(400).send({Error : e})
    }
})

// Update an assignment
router.patch('/update/:id', auth.educatorAuth, async(req, res) => {
    const allowedUpdates = ['description', 'start_time', 'end_time']
    const updates = Object.keys(req.body)
    const isValid = updates.every((update) => allowedUpdates.includes(update))
    try {
        if(!isValid) throw 'Invalid update field'
        const assignment = await Assignment.findById(req.params.id)
        if(!assignment) throw 'Could not find assignment'

        const course = await Course.findById(assignment.course_id)
        if(!course.educator_id.equals(req.user._id)) throw 'Not authorized to edit'

        if(req.body.start_time && Date.parse(req.body.start_time) < course.start_date.getTime()) {
            throw 'Assignment start time should be after the course starts'
        }
        if(req.body.end_time && Date.parse(req.body.end_time) > course.end_date.getTime()) {
            throw 'Assignment end time should be before the course ends'
        }

        updates.forEach((update) => assignment[update] = req.body[update])
        await assignment.save()
        res.send(assignment)
    } catch (e) {
        console.log(e)
        res.status(400).send({Error: e})
    }
})

// View an assignment
router.get('/view/:id', auth.allAuth, async(req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id)
        if(!assignment) throw 'No assignment found'
        res.send(assignment)
    } catch (e) {
        console.log(e)
        res.status(400).send({Error: e})
    }
})

//View all assignments of a course
router.post('/view', auth.studentAuth, async(req, res) => {
    try {  
        const course = await Course.findOne({name: req.body.course_name})
        if(!course) throw 'Could not find course'

        const enrollment = await Enrollment.findOne({course_id: course._id, student_id: req.user._id})
        if(!enrollment) throw 'Not enrolled in the course'

        await course.populate('assignments')
        res.send(course.assignments)
    } catch (e) {
        console.log(e)
        res.status(400).send({Error: e})
    }
})

// View all submissions of an assignment
router.get('/viewAll/:id', auth.educatorAuth, async(req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id)
        if(!assignment) throw 'Assigment not found'

        const course = await Course.findById(assignment.course_id)
        if(!(course.educator_id.equals(req.user._id))) throw 'Not allowed to view submissions'

        await assignment.populate('submissions')
        res.send(assignment.submissions)
    } catch (e) {
        console.log(e)
        res.status(400).send({Error: e})
    }
})

// Delete an assignment
router.delete('/delete/:id', auth.educatorAuth, async (req, res) => {
    try {
        let assignment = await Assignment.findById(req.params.id)
        if(!assignment) throw 'Could not find assignment'
    
        const course = await Course.findById(assignment.course_id)
        if(!course.educator_id.equals(req.user._id)) throw 'Not authorized to delete'
    
        assignment = await Assignment.findOneAndDelete({_id: req.params.id})
        res.send(assignment)
    } catch (e) {
        console.log(e)
        res.status(400).send({Error : e})
    }
})

module.exports = router