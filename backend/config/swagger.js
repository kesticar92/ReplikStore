const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Gemelo Digital',
            version: '1.0.0',
            description: 'API para el gemelo digital de la tienda física usando Unreal Engine 5.5',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor de desarrollo',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{
            bearerAuth: [],
        }],
    },
    apis: ['./backend/routes/*.js'], // Rutas para buscar anotaciones
};

module.exports = swaggerJsdoc(options); 