const Queue = require('bull');
const Redis = require('redis')
const Course = require('../../models/course')

const client = Redis.createClient()

client.on('error', err => {
    console.log('Error' + err)
})

const courseUpdateQueue = new Queue('courseUpdate');

const options = {
    repeat: {
        every: 60000, // 1min
        limit: 100
    }
};

const performJob = async () => {
    const courses = await Course.find({})
    const date = new Date()
    console.log('Hourly Job - Course Status Updated', date)
    courses.forEach(async (course) => await course.updateStatus())
}

courseUpdateQueue.add({}, options)

courseUpdateQueue.process( async job => { 
    return await performJob(); 
})
  