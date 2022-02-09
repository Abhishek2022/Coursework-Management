const mongoose = require('mongoose')

const courseSchema = new mongoose.Schema({
    educator_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: [true, 'Need to provide a name'],
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
        required: [true, 'Need to provide the capacity of the course'],
        validate(value) {
            if(value < 0) {
                throw new Error('Course capacity has to be positive')
            }
        }
    },
    start_date: {
        type: Date,
        required: [true, 'Course start date must be provided']
    },
    end_date: {
        type: Date,
        required: [true, 'Course end date must be provided']
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

const errorHandler = function (error, res, next) {
    if(error.code === 11000) {
        next('Course already registered with the same name!')
    } else if(error.name === 'ValidationError') { 
        let errorMsg = Object.values(error.errors)[0].message 
        next(errorMsg)
    } else {
        next()
    }
}

courseSchema.post('save', errorHandler)
courseSchema.post('update', errorHandler)
courseSchema.post('findOneAndUpdate', errorHandler)

const Course = mongoose.model('Course', courseSchema)

module.exports = Course