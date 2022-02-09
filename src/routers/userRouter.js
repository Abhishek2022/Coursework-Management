const express = require('express')
const mongoose = require('mongoose')
const User = require('../models/user')
const auth = require('../middleware/auth')

const router = express()

// Create a user
router.post('/register', auth.adminAuth, async (req, res) => {
    try {
        const user = new User(req.body)
        await user.save()
        res.status(201).send(user)
    } catch (e) {
        console.log(e)
        res.status(400).send({Error: e})
    }
})

// User login
router.post('/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.phone, req.body.password)
        const token = await user.generateAuthToken()
        res.status(200).send({user, token})
    } catch (e) {
        res.status(400).send({Error: 'Invalid Credentials'})
    }
})

// View my profile
router.get('/me', auth.allAuth, async (req, res) => {
    res.send(req.user)
})

// User logout
router.get('/logout', auth.allAuth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send({message: 'Successfully logged out', user: req.user})
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})

// Update user details
router.patch('/update', auth.allAuth, async (req, res) => {
    const updates = Object.keys(req.body)
    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        console.log(e)
        res.status(400).send({Error: e})
    }
})

// Delete a user
router.delete('/delete/:id', auth.adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user) throw 'User not found'

        user.active = false
        await user.save()
        res.send(user)
    } catch(e) {
        res.status(400).send({Error: e})
    }
})

module.exports = router