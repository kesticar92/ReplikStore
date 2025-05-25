const reportService = require('../services/reportService');
const { catchAsync } = require('../utils/catchAsync');
const { logger } = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');

const reportController = {
    generateReport: catchAsync(async (req, res) => {
        const { type, parameters } = req.body;
        const userId = req.user._id;

        const report = await reportService.generateReport(type, parameters, userId);

        res.status(201).json({
            success: true,
            data: report
        });
    }),

    getReports: catchAsync(async (req, res) => {
        const { page = 1, limit = 20, type, status } = req.query;
        const skip = (page - 1) * limit;

        const result = await reportService.getReports({
            skip,
            limit: parseInt(limit),
            type,
            status,
            generatedBy: req.user.role === 'admin' ? null : req.user._id
        });

        res.json({
            success: true,
            data: result
        });
    }),

    getReportById: catchAsync(async (req, res) => {
        const { id } = req.params;
        const report = await Report.findById(id)
            .populate('generatedBy', 'username email');

        if (!report) {
            throw new NotFoundError('Reporte no encontrado');
        }

        // Verificar permisos
        if (req.user.role !== 'admin' && report.generatedBy._id.toString() !== req.user._id.toString()) {
            throw new NotFoundError('Reporte no encontrado');
        }

        res.json({
            success: true,
            data: report
        });
    }),

    downloadReport: catchAsync(async (req, res) => {
        const { id } = req.params;
        const { format = 'json' } = req.query;

        const report = await Report.findById(id);
        if (!report) {
            throw new NotFoundError('Reporte no encontrado');
        }

        // Verificar permisos
        if (req.user.role !== 'admin' && report.generatedBy.toString() !== req.user._id.toString()) {
            throw new NotFoundError('Reporte no encontrado');
        }

        // Verificar estado
        if (report.status !== 'completed') {
            throw new Error('El reporte aún no está listo para descargar');
        }

        // Configurar headers según el formato
        switch (format) {
            case 'csv':
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=${report.title}.csv`);
                // Convertir datos a CSV
                const csv = convertToCSV(report.data);
                return res.send(csv);

            case 'pdf':
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=${report.title}.pdf`);
                // Convertir datos a PDF
                const pdf = await convertToPDF(report);
                return res.send(pdf);

            default:
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename=${report.title}.json`);
                return res.json(report.data);
        }
    }),

    deleteReport: catchAsync(async (req, res) => {
        const { id } = req.params;

        const report = await Report.findById(id);
        if (!report) {
            throw new NotFoundError('Reporte no encontrado');
        }

        // Verificar permisos
        if (req.user.role !== 'admin' && report.generatedBy.toString() !== req.user._id.toString()) {
            throw new NotFoundError('Reporte no encontrado');
        }

        await report.remove();

        res.json({
            success: true,
            message: 'Reporte eliminado exitosamente'
        });
    })
};

// Funciones auxiliares para conversión de formatos
function convertToCSV(data) {
    // Implementar conversión a CSV según la estructura de los datos
    // Esta es una implementación básica que debería adaptarse según el tipo de reporte
    const headers = Object.keys(data);
    const rows = [headers];

    if (Array.isArray(data)) {
        data.forEach(item => {
            rows.push(headers.map(header => item[header]));
        });
    } else {
        rows.push(headers.map(header => data[header]));
    }

    return rows.map(row => row.join(',')).join('\n');
}

async function convertToPDF(report) {
    // Implementar conversión a PDF
    // Esta es una función placeholder que debería implementarse con una librería como PDFKit
    throw new Error('Conversión a PDF no implementada');
}

module.exports = reportController; 