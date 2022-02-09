const mongoose = require('mongoose')

const enrollmentSchema = new mongoose.Schema({
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Course'
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: {
        createdAt: 'created_at'
    }
})

enrollmentSchema.index({course_id: 1, student_id: 1}, {unique: true})

enrollmentSchema.methods.toJSON = function() {
    const enrollment = this
    const enrollmentObject = enrollment.toObject()
    const deleteFields = ['created_at', 'updatedAt','__v']
    deleteFields.forEach((e) => delete enrollmentObject[e]) 
    return enrollmentObject
}


const errorHandler = function (error, res, next) {
    if(error.code === 11000) {
        next('Already enrolled for the course!')
    } else if(error.name === 'ValidationError') {
        let errorMsg = Object.values(error.errors)[0].message
        next(errorMsg)
    } else {
        next()
    }
}

enrollmentSchema.post('save', errorHandler)
enrollmentSchema.post('update', errorHandler)
enrollmentSchema.post('findOneAndUpdate', errorHandler)

const Enrollment = mongoose.model('Enrollment', enrollmentSchema)

module.exports = Enrollment