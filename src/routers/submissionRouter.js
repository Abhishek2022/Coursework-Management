const express = require('express')
const res = require('express/lib/response')
const multer = require('multer')
const auth = require('../middleware/auth')
const Assignment = require('../models/assignment')
const Course = require('../models/course')
const Enrollment = require('../models/enrollment')
const Submission = require('../models/submission')

const router = express()

const upload = multer({
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(pdf)$/)) {
            return cb('Only PDF files are allowed')
        }
        cb(undefined, true)
    }
})

// Upload an assignment submission
router.get('/upload/:id', auth.studentAuth, upload.single('file'), async(req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id)
        if(!assignment) throw 'No assignment found'

        const enrollment = await Enrollment.findOne({
            course_id: assignment.course_id, 
            student_id: req.user._id
        })
        if(!enrollment) throw 'Not enrolled in the course'

        const date = new Date()
        if(assignment.start_time.getTime() > date.getTime()) throw 'Assignment is not open for submissions'
        if(assignment.end_time.getTime() < date.getTime()) throw 'Submission deadline is over'
        const submission = Submission({
            student_id: req.user._id,
            assignment_id: req.params.id,
            file_url: req.file.buffer
        })

        await submission.save()
        res.send({Message: 'File uploaded successfully'})
    } catch (e) {
        res.status(400).send({Error: e})
    }
}, (error, req, res, next) => {
    res.status(400).send({Error: error})
})

// View a submission
router.get('/view/:id', async(req, res) => {
    try {
        const submission = await Submission.findById(req.params.id)
        if(!submission) throw 'No submission exists'

        res.set('Content-Type', 'Application/pdf')
        res.send(submission.file_url)
    } catch (e) {
        res.status(404).send()
    }
})

// Grade a submission
router.patch('/grade/:id', auth.educatorAuth, async(req, res) => {
    try {
        const submission = await Submission.findById(req.params.id)
        if(!submission) throw 'Could not find submission'

        const assignment = await Assignment.findById(submission.assignment_id)
        const course = await Course.findById(assignment.course_id)
        if(!(course.educator_id.equals(req.user._id))) throw 'Not authorized to grade'

        submission.grade = req.body.grade
        await submission.save()
        res.send(submission)
    } catch (e) {
        res.status(400).send({Error: e})
    }
})

// Student to view their grade 
router.get('/viewGrade/:id', auth.studentAuth, async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id)
        if(!submission) throw 'Could not find submission'
        const assignment = await Assignment.findById(submission.assignment_id.toString())
        if(!assignment) throw 'Could not find assignment'

        if(!req.user._id.equals(submission.student_id)) throw 'Not allowed to view this submission'
        if(submission.grade == 'NG') throw 'Assignment is yet to be graded'
        const date = new Date()
        if(assignment.end_time.getTime() > date.getTime()) throw 'Assignment is not over yet!'

        res.send({"Grade": submission.grade})
    } catch(e) {
        console.log(e)
        res.status(400).send({Error: e})
    }
})

module.exports = router