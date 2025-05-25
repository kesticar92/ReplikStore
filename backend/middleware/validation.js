const { ValidationError } = require('../utils/errors');
const { logger } = require('../utils/logger');

class ValidationMiddleware {
    validateRequest(schema) {
        return (req, res, next) => {
            try {
                this._validateObject(req.body, schema.body, 'body');
                this._validateObject(req.query, schema.query, 'query');
                this._validateObject(req.params, schema.params, 'params');
                next();
            } catch (error) {
                logger.error('Error de validación:', {
                    error: error.message,
                    path: req.path,
                    method: req.method
                });
                res.status(400).json({
                    error: 'Error de validación',
                    message: error.message
                });
            }
        };
    }

    _validateObject(obj, schema, context) {
        if (!schema) return;

        for (const [key, rules] of Object.entries(schema)) {
            const value = obj[key];

            // Verificar campo requerido
            if (rules.required && (value === undefined || value === null || value === '')) {
                throw new ValidationError(`El campo ${key} es requerido en ${context}`);
            }

            // Si el campo es opcional y no está presente, continuar
            if (!rules.required && (value === undefined || value === null)) {
                continue;
            }

            // Validar tipo
            if (rules.type && value !== undefined) {
                this._validateType(value, rules.type, key, context);
            }

            // Validar longitud mínima
            if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
                throw new ValidationError(`El campo ${key} debe tener al menos ${rules.minLength} caracteres en ${context}`);
            }

            // Validar longitud máxima
            if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
                throw new ValidationError(`El campo ${key} no debe exceder ${rules.maxLength} caracteres en ${context}`);
            }

            // Validar valor mínimo
            if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
                throw new ValidationError(`El campo ${key} debe ser mayor o igual a ${rules.min} en ${context}`);
            }

            // Validar valor máximo
            if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
                throw new ValidationError(`El campo ${key} debe ser menor o igual a ${rules.max} en ${context}`);
            }

            // Validar formato de email
            if (rules.format === 'email' && typeof value === 'string') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    throw new ValidationError(`El campo ${key} debe ser un email válido en ${context}`);
                }
            }

            // Validar formato de URL
            if (rules.format === 'url' && typeof value === 'string') {
                try {
                    new URL(value);
                } catch {
                    throw new ValidationError(`El campo ${key} debe ser una URL válida en ${context}`);
                }
            }

            // Validar formato de fecha
            if (rules.format === 'date' && typeof value === 'string') {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    throw new ValidationError(`El campo ${key} debe ser una fecha válida en ${context}`);
                }
            }

            // Validar enum
            if (rules.enum && !rules.enum.includes(value)) {
                throw new ValidationError(`El campo ${key} debe ser uno de los siguientes valores: ${rules.enum.join(', ')} en ${context}`);
            }

            // Validar patrón regex
            if (rules.pattern && typeof value === 'string') {
                const regex = new RegExp(rules.pattern);
                if (!regex.test(value)) {
                    throw new ValidationError(`El campo ${key} no cumple con el patrón requerido en ${context}`);
                }
            }
        }
    }

    _validateType(value, type, key, context) {
        switch (type) {
            case 'string':
                if (typeof value !== 'string') {
                    throw new ValidationError(`El campo ${key} debe ser una cadena de texto en ${context}`);
                }
                break;
            case 'number':
                if (typeof value !== 'number' || isNaN(value)) {
                    throw new ValidationError(`El campo ${key} debe ser un número en ${context}`);
                }
                break;
            case 'boolean':
                if (typeof value !== 'boolean') {
                    throw new ValidationError(`El campo ${key} debe ser un booleano en ${context}`);
                }
                break;
            case 'array':
                if (!Array.isArray(value)) {
                    throw new ValidationError(`El campo ${key} debe ser un array en ${context}`);
                }
                break;
            case 'object':
                if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                    throw new ValidationError(`El campo ${key} debe ser un objeto en ${context}`);
                }
                break;
            default:
                throw new ValidationError(`Tipo de dato no soportado: ${type} para el campo ${key} en ${context}`);
        }
    }
}

module.exports = new ValidationMiddleware(); 