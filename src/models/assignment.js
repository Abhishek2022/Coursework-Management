const mongoose = require('mongoose')

const assignmentSchema = new mongoose.Schema({
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Course'
    },
    description: {
        type: String,
        required: [true, 'Assignment description cannot be empty']
    },
    start_time: {
        type: Date,
        required: [true, 'Submission start time needs to be provided']
    },
    end_time: {
        type: Date,
        required: [true, 'Submission end time needs to be provided']
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
})

assignmentSchema.virtual('submissions', {
    ref: 'Submission',
    localField: '_id',
    foreignField: 'assignment_id'
})

assignmentSchema.methods.toJSON = function() {
    const assignment = this
    const assignmentObject = assignment.toObject()
    const deleteFields = ['created_at', 'updated_at','__v']
    deleteFields.forEach((e) => delete assignmentObject[e]) 
    return assignmentObject
}

assignmentSchema.pre('save', async function(next) {
    const assignment = this
    const currDate = new Date()
    if(currDate.getTime() > assignment.start_time.getTime()) throw 'Choose a future date'
    if(assignment.start_time.getTime() > assignment.end_time.getTime()) throw 'End time should be be after start time'
    next()
})

const errorHandler = function (error, res, next) {
    if(error.code === 11000) {
        next('Duplicate Assignment')
    } else if(error.name === 'ValidationError') { 
        let errorMsg = Object.values(error.errors)[0].message 
        next(errorMsg)
    } else {
        next()
    }
}

assignmentSchema.post('save', errorHandler)
assignmentSchema.post('update', errorHandler)
assignmentSchema.post('findOneAndUpdate', errorHandler)

const Assignment = mongoose.model('Assignment', assignmentSchema)

module.exports = Assignment