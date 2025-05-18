const app = require('./app');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const port = process.env.PORT || 3000;

// Configuración de Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ReplikStore API',
            version: '1.0.0',
            description: 'API para el sistema de gestión ReplikStore',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Servidor de desarrollo',
            },
        ],
    },
    apis: ['./backend/routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
    console.log(`Documentación API disponible en http://localhost:${port}/api-docs`);
}); 