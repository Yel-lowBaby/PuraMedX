module.exports = (err, req, res, next) => {
    console.error('ERROR:', err);

    const statusCode = err.statusCode || 500;

    res.status(err.statusCode || 500).json({
        sucess: false,
        message: err.message || 'Server Error'
    });
};