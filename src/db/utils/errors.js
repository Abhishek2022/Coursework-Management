const errorHandler = function (error, res, next) {
    if(error.code === 11000) {
        next('There was a duplicate entry')
    } else if(error.name === 'ValidationError') {
        next(error.message)
    } else {
        next()
    }
}

module.exports = errorHandler