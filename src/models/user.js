const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Course = require('../models/course')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Enter a name'],
        trim: true
    },
    phone: {
        type: Number,
        required: [true, 'Phone number needs to be provided'],
        unique: true,
        trim: true,
        validate(value) {
            if(value.toString().length != 10) {
                throw new Error('Invalid phone number')
            }
        }
    },
    password: {
        type: String,
        required: [true, 'Password needs to be provided'],
        minlength: [7, 'Password should be atleast 7 characters']
    },
    active: {
        type: Boolean,
        default: true
    },
    type: {
        type: String,
        required: [true, 'User type not specified'],
        enum: ['admin', 'educator', 'student']
    }, 
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: {
        createdAt: 'created_at', 
        updatedAt: 'updated_at'
    },
})

userSchema.virtual('created_courses', {
    ref: 'Course',
    localField: '_id',
    foreignField: 'educator_id'
})

userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()
    const deleteFields = ['created_at', 'updated_at','password','__v','tokens','active']
    deleteFields.forEach((e) => delete userObject[e]) 
    return userObject
}

userSchema.statics.findByCredentials = async (phone, password) => {
    const user = await User.findOne({phone})
    if(!user) throw new Error('Invalid Credentials')

    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch) throw new Error('Invalid Credentials')
    return user
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = await jwt.sign({_id: user._id.toString()}, 'mysecret', {expiresIn: '7 days'})
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.pre('save', async function(next) {
    const user = this
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

const errorHandler = function (error, res, next) {
    if(error.code === 11000) {
        next('Phone number already exists!')
    } else if(error.name === 'ValidationError') {
        let errorMsg = Object.values(error.errors)[0].message
        next(errorMsg)
    } else {
        next()
    }
}

userSchema.post('save', errorHandler)
userSchema.post('update', errorHandler)
userSchema.post('findOneAndUpdate', errorHandler)

const User = mongoose.model('User', userSchema)

module.exports = User