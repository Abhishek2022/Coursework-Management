const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req, res, next, type) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, 'mysecret')
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token})
    
        if(!user || (!user.active)) throw 'Please Authenticate'
        if(type && user.type !== type) throw ('Access restricted to ' + type + 's')
        req.token = token
        req.user = user
        next()
    } catch(e) {
        res.status(400).send({Error: e})
    } 
}

const allAuth = async (req, res, next) => auth(req, res, next, "")
const adminAuth = async (req, res, next) => auth(req, res, next, "admin")
const educatorAuth = async (req, res, next) => auth(req, res, next, "educator")
const studentAuth = async (req, res, next) => auth(req, res, next, "student")

module.exports = { allAuth, adminAuth, educatorAuth, studentAuth }