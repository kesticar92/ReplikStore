const errorHandler = (err, req, res, next) => {
    // Log del error para debugging
    console.error('Error:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        user: req.user?.id
    });

    // Manejo específico de errores de autenticación
    if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Manejo de errores de validación
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: err.message || 'Error de validación',
            errors: Array.isArray(err.errors) ? err.errors : [err.message]
        });
    }

    // Manejo de errores de conflicto (por ejemplo, SKU duplicado)
    if (err.name === 'ConflictError') {
        return res.status(409).json({
            success: false,
            message: err.message || 'Conflicto',
            errors: err.errors || []
        });
    }

    // Manejo de errores de recurso no encontrado
    if (err.name === 'NotFoundError') {
        return res.status(404).json({
            success: false,
            message: err.message || 'Recurso no encontrado',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Manejo de errores de MongoDB
    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Conflicto: El recurso ya existe',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Error en la base de datos',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Manejo de errores de sintaxis JSON
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'JSON inválido en el cuerpo de la petición',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Manejo de errores de límite de tamaño
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            message: 'El tamaño de la petición excede el límite permitido',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Error por defecto
    res.status(err.statusCode || err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler; 