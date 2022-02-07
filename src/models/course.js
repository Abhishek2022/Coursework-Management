const mongoose = require('mongoose')
const errorHandler = require('../db/utils/errors')

const courseSchema = new mongoose.Schema({
    educator_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        required: true,
        enum: ['upcoming', 'running', 'completed'],
        default: 'upcoming'
    },
    capacity: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0) {
                throw new Error('Course capacity cannot be negative')
            }
        }
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
})

courseSchema.virtual('assignments', {
    ref: 'Assignment',
    localField: '_id',
    foreignField: 'course_id'
})

courseSchema.methods.toJSON = function() {
    const course = this
    const courseObject = course.toObject()
    const deleteFields = ['created_at', 'updated_at', '__v']
    deleteFields.forEach((e) => delete courseObject[e]) 
    return courseObject
}

courseSchema.methods.updateStatus = async function() {
    const course = this
    const date = new Date()
    if(course.end_date.getTime() < date.getTime()) course.status = 'completed'
    else if(course.start_date.getTime() <= date.getTime()) course.status = 'running'
    await course.save()
}

// Check for end date < start date
courseSchema.pre('save', async function(next) {
    const course = this
    const currDate = new Date()
    // if(currDate.getTime() > course.start_date.getTime()) throw 'Choose a future date'
    if(course.start_date.getTime() > course.end_date.getTime()) throw 'End date should be be after start date'
    next()
})

courseSchema.post('save', errorHandler)
courseSchema.post('update', errorHandler)
courseSchema.post('findOneAndUpdate', errorHandler)

const Course = mongoose.model('Course', courseSchema)

module.exports = Course