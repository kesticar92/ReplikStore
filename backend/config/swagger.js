const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ReplkStore API',
            version: '1.0.0',
            description: 'API para el sistema de gestión de inventario ReplkStore con gemelo digital en Unreal Engine',
            contact: {
                name: 'Soporte ReplkStore',
                email: 'soporte@replkstore.com'
            }
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:3000',
                description: 'Servidor de desarrollo'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Mensaje de error'
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        email: {
                            type: 'string',
                            format: 'email'
                        },
                        name: {
                            type: 'string'
                        },
                        role: {
                            type: 'string',
                            enum: ['admin', 'manager', 'user']
                        },
                        status: {
                            type: 'string',
                            enum: ['active', 'inactive', 'suspended']
                        }
                    }
                },
                Product: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        name: {
                            type: 'string'
                        },
                        description: {
                            type: 'string'
                        },
                        sku: {
                            type: 'string'
                        },
                        price: {
                            type: 'number',
                            format: 'float'
                        },
                        stock: {
                            type: 'integer'
                        },
                        minStock: {
                            type: 'integer'
                        },
                        category: {
                            type: 'string'
                        },
                        location: {
                            type: 'object',
                            properties: {
                                x: { type: 'number' },
                                y: { type: 'number' },
                                z: { type: 'number' }
                            }
                        }
                    }
                }
            }
        }
    },
    apis: [
        './backend/routes/*.js',
        './backend/models/*.js'
    ]
};

module.exports = swaggerJsdoc(options); 