const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger_output.json'

const endpointsFiles = ['./routes/concerts.js', './routes/authentification.js', './routes/reservations.js']

const doc = {
    info: {
        title: 'web API RESTful',
        description: 'Starter pack',
    },
    host: 'localhost:5001',
    schemes: ['http'],
};

swaggerAutogen(outputFile, endpointsFiles, doc)
