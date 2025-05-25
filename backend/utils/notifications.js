const nodemailer = require('nodemailer');
const twilio = require('twilio');
const axios = require('axios');
const { logger } = require('./logger');
const { ValidationError } = require('./errors');

class NotificationService {
    constructor({ emailTransporter, smsClient } = {}) {
        this._emailTransporter = emailTransporter;
        this._smsClient = smsClient;
        this._templates = {
            lowStock: {
                email: {
                    subject: 'Alerta: Stock Bajo - {{product.name}}',
                    template: `
                        <h2>Alerta de Stock Bajo</h2>
                        <p>El producto {{product.name}} (SKU: {{product.sku}}) tiene stock bajo.</p>
                        <ul>
                            <li>Stock actual: {{product.currentStock}}</li>
                            <li>Punto de reorden: {{product.reorderPoint}}</li>
                            <li>Categoría: {{product.category}}</li>
                            <li>Zona: {{product.zone}}</li>
                        </ul>
                        <p>Por favor, tome las acciones necesarias para reabastecer el inventario.</p>
                    `
                },
                sms: 'Alerta: {{product.name}} tiene stock bajo ({{product.currentStock}} unidades)'
            },
            stockUpdate: {
                email: {
                    subject: 'Actualización de Stock - {{product.name}}',
                    template: `
                        <h2>Actualización de Stock</h2>
                        <p>El stock del producto {{product.name}} (SKU: {{product.sku}}) ha sido actualizado.</p>
                        <ul>
                            <li>Stock anterior: {{oldStock}}</li>
                            <li>Stock nuevo: {{newStock}}</li>
                            <li>Tipo de operación: {{type}}</li>
                            <li>Categoría: {{product.category}}</li>
                            <li>Zona: {{product.zone}}</li>
                        </ul>
                    `
                }
            }
        };
    }

    get emailTransporter() {
        if (!this._emailTransporter) {
            if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
                throw new ValidationError('Configuración de SMTP incompleta');
            }
            this._emailTransporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                pool: true,
                maxConnections: 5,
                maxMessages: 100,
                rateDelta: 1000,
                rateLimit: 5
            });
        }
        return this._emailTransporter;
    }

    get smsClient() {
        if (!this._smsClient) {
            if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
                throw new ValidationError('Configuración de Twilio incompleta');
            }
            this._smsClient = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );
        }
        return this._smsClient;
    }

    _replaceTemplateVariables(template, data) {
        return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const value = key.split('.').reduce((obj, k) => obj?.[k], data);
            return value !== undefined ? value : match;
        });
    }

    async sendEmail(to, subject, content, options = {}) {
        try {
            if (!to || !subject || !content) {
                throw new ValidationError('Faltan campos requeridos para enviar email');
            }

            const mailOptions = {
                from: process.env.SMTP_FROM || 'noreply@inventory.com',
                to,
                subject,
                html: content,
                ...options
            };

            const info = await this.emailTransporter.sendMail(mailOptions);
            logger.info('Email enviado exitosamente', { 
                to, 
                subject, 
                messageId: info.messageId 
            });
            return info;
        } catch (error) {
            logger.error('Error al enviar email:', {
                error: error.message,
                to,
                subject
            });
            throw error;
        }
    }

    async sendSMS(to, message, options = {}) {
        try {
            if (!to || !message) {
                throw new ValidationError('Faltan campos requeridos para enviar SMS');
            }

            const result = await this.smsClient.messages.create({
                body: message,
                to,
                from: process.env.TWILIO_PHONE_NUMBER,
                ...options
            });

            logger.info('SMS enviado exitosamente', { 
                to, 
                messageId: result.sid 
            });
            return result;
        } catch (error) {
            logger.error('Error al enviar SMS:', {
                error: error.message,
                to
            });
            throw error;
        }
    }

    async sendWebhook(url, payload, options = {}) {
        try {
            if (!url || !payload) {
                throw new ValidationError('Faltan campos requeridos para enviar webhook');
            }

            const config = {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Inventory-System/1.0'
                },
                ...options
            };

            const response = await axios.post(url, payload, config);
            logger.info('Webhook enviado exitosamente', { 
                url, 
                status: response.status 
            });
            return response;
        } catch (error) {
            logger.error('Error al enviar webhook:', {
                error: error.message,
                url
            });
            throw error;
        }
    }

    async notifyLowStock(product) {
        try {
            if (!product || !product.sku) {
                throw new ValidationError('Producto inválido para notificación de stock bajo');
            }

            const template = this._templates.lowStock;
            const data = { product };

            // Enviar email si está configurado
            if (process.env.NOTIFY_EMAIL) {
                const subject = this._replaceTemplateVariables(template.email.subject, data);
                const content = this._replaceTemplateVariables(template.email.template, data);
                await this.sendEmail(process.env.NOTIFY_EMAIL, subject, content);
            }

            // Enviar SMS si está configurado
            if (process.env.NOTIFY_SMS) {
                const message = this._replaceTemplateVariables(template.sms, data);
                await this.sendSMS(process.env.NOTIFY_SMS, message);
            }

            // Enviar webhook si está configurado
            if (process.env.NOTIFY_WEBHOOK) {
                await this.sendWebhook(process.env.NOTIFY_WEBHOOK, {
                    type: 'low_stock',
                    timestamp: new Date().toISOString(),
                    product: {
                        sku: product.sku,
                        name: product.name,
                        currentStock: product.currentStock,
                        reorderPoint: product.reorderPoint,
                        category: product.category,
                        zone: product.zone
                    }
                });
            }
        } catch (error) {
            logger.error('Error en notificación de stock bajo:', {
                error: error.message,
                product: product?.sku
            });
            throw error;
        }
    }

    async notifyStockUpdate(product, oldStock, newStock, type) {
        try {
            if (!product || !product.sku) {
                throw new ValidationError('Producto inválido para notificación de actualización de stock');
            }

            const template = this._templates.stockUpdate;
            const data = { product, oldStock, newStock, type };

            // Enviar email si está configurado
            if (process.env.NOTIFY_EMAIL) {
                const subject = this._replaceTemplateVariables(template.email.subject, data);
                const content = this._replaceTemplateVariables(template.email.template, data);
                await this.sendEmail(process.env.NOTIFY_EMAIL, subject, content);
            }

            // Enviar webhook si está configurado
            if (process.env.NOTIFY_WEBHOOK) {
                await this.sendWebhook(process.env.NOTIFY_WEBHOOK, {
                    type: 'stock_update',
                    timestamp: new Date().toISOString(),
                    product: {
                        sku: product.sku,
                        name: product.name,
                        category: product.category,
                        zone: product.zone
                    },
                    stock: {
                        old: oldStock,
                        new: newStock,
                        change: newStock - oldStock
                    },
                    operation: {
                        type,
                        timestamp: new Date().toISOString()
                    }
                });
            }
        } catch (error) {
            logger.error('Error en notificación de actualización de stock:', {
                error: error.message,
                product: product?.sku
            });
            throw error;
        }
    }
}

module.exports = new NotificationService();
module.exports.NotificationService = NotificationService; 