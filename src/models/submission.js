const mongoose = require('mongoose')
const errorHandler = require('../db/utils/errors')

const submissionSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assignment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true,
    },
    file_url: {
        type: Buffer, 
        required: true
    },
    grade: {
        type: String,
        enum: ['A', 'B', 'C', 'D', 'F', 'NG'],
        required: true,
        default: 'NG'
    }
}, {
    timestamps: {
        createdAt: 'submission_time',
        updatedAt: 'updated_at'
    }
})

submissionSchema.index({student_id: 1, assignment_id: 1}, {unique: true})

submissionSchema.methods.toJSON = function () {
    const submission = this
    const submissionObject = submission.toObject()

    submissionObject.file_link = 'http://localhost:3000/submissions/view/'+submissionObject._id.toString()
    delete submissionObject.file_url
    delete submissionObject.updated_at
    delete submissionObject.__v

    return submissionObject
}

submissionSchema.post('save', errorHandler)
submissionSchema.post('update', errorHandler)
submissionSchema.post('findOneAndUpdate', errorHandler)

const Submission = mongoose.model('Submission', submissionSchema)

module.exports = Submission