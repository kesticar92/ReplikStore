import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Report } from '../models/report.model';
import { CreateReportDto, UpdateReportDto, ReportFilterDto } from '../dto/report.dto';
import { LoggerService } from '../core/services/logger.service';
import { MetricsService } from '../core/services/metrics.service';
import { NotificationService } from './notification.service';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  private readonly uploadDir: string;

  constructor(
    @InjectModel(Report.name) private reportModel: Model<Report>,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
    private readonly metrics: MetricsService,
    private readonly notificationService: NotificationService,
  ) {
    this.uploadDir = this.configService.get('upload.dir');
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async create(createReportDto: CreateReportDto): Promise<Report> {
    const report = new this.reportModel(createReportDto);
    await report.save();

    if (report.isScheduled) {
      this.scheduleReport(report);
    } else {
      this.generateReport(report);
    }

    return report;
  }

  async findAll(filter: ReportFilterDto): Promise<Report[]> {
    const query: any = {};

    if (filter.type) query.type = filter.type;
    if (filter.status) query.status = filter.status;
    if (filter.startDate || filter.endDate) {
      query.createdAt = {};
      if (filter.startDate) query.createdAt.$gte = new Date(filter.startDate);
      if (filter.endDate) query.createdAt.$lte = new Date(filter.endDate);
    }

    return this.reportModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportModel.findById(id).exec();
    if (!report) {
      throw new NotFoundException(`Reporte con ID ${id} no encontrado`);
    }
    return report;
  }

  async update(id: string, updateReportDto: UpdateReportDto): Promise<Report> {
    const report = await this.findOne(id);
    Object.assign(report, updateReportDto);
    return report.save();
  }

  async delete(id: string): Promise<void> {
    const report = await this.findOne(id);
    if (report.fileUrl) {
      const filePath = path.join(this.uploadDir, path.basename(report.fileUrl));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await this.reportModel.findByIdAndDelete(id).exec();
  }

  private async generateReport(report: Report): Promise<void> {
    report.markAsProcessing();
    await report.save();

    try {
      const start = Date.now();
      let fileUrl: string;
      let fileSize: number;

      switch (report.format) {
        case 'excel':
          ({ fileUrl, fileSize } = await this.generateExcel(report));
          break;
        case 'pdf':
          ({ fileUrl, fileSize } = await this.generatePDF(report));
          break;
        case 'csv':
          ({ fileUrl, fileSize } = await this.generateCSV(report));
          break;
        case 'json':
          ({ fileUrl, fileSize } = await this.generateJSON(report));
          break;
      }

      report.markAsCompleted(fileUrl, fileSize);
      this.metrics.observeHistogram('report_generation_duration_seconds',
        (Date.now() - start) / 1000,
        { type: report.type, format: report.format }
      );

      // Notificar al usuario
      await this.notifyReportCompletion(report);
    } catch (error) {
      report.markAsFailed(error.message);
      this.loggerService.error(`Error generating report: ${error.message}`, error);
    }

    await report.save();
  }

  private async generateExcel(report: Report): Promise<{ fileUrl: string; fileSize: number }> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Implementar lógica específica según el tipo de reporte
    switch (report.type) {
      case 'inventory':
        await this.generateInventoryExcel(worksheet, report.parameters);
        break;
      case 'sales':
        await this.generateSalesExcel(worksheet, report.parameters);
        break;
      // Agregar más casos según sea necesario
    }

    const fileName = `${report._id}-${Date.now()}.xlsx`;
    const filePath = path.join(this.uploadDir, fileName);
    await workbook.xlsx.writeFile(filePath);

    return {
      fileUrl: `/uploads/${fileName}`,
      fileSize: fs.statSync(filePath).size,
    };
  }

  private async generatePDF(report: Report): Promise<{ fileUrl: string; fileSize: number }> {
    const doc = new PDFDocument();
    const fileName = `${report._id}-${Date.now()}.pdf`;
    const filePath = path.join(this.uploadDir, fileName);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Implementar lógica específica según el tipo de reporte
    switch (report.type) {
      case 'inventory':
        await this.generateInventoryPDF(doc, report.parameters);
        break;
      case 'sales':
        await this.generateSalesPDF(doc, report.parameters);
        break;
      // Agregar más casos según sea necesario
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve({
          fileUrl: `/uploads/${fileName}`,
          fileSize: fs.statSync(filePath).size,
        });
      });
      stream.on('error', reject);
    });
  }

  private async generateCSV(report: Report): Promise<{ fileUrl: string; fileSize: number }> {
    // Implementar generación de CSV
    throw new Error('CSV generation not implemented');
  }

  private async generateJSON(report: Report): Promise<{ fileUrl: string; fileSize: number }> {
    // Implementar generación de JSON
    throw new Error('JSON generation not implemented');
  }

  private async notifyReportCompletion(report: Report): Promise<void> {
    await this.notificationService.create({
      type: 'email',
      recipient: report.metadata?.userEmail,
      subject: `Reporte ${report.name} completado`,
      content: `El reporte ${report.name} ha sido generado exitosamente. Puede descargarlo desde: ${report.fileUrl}`,
      metadata: {
        reportId: report._id,
        reportType: report.type,
        reportFormat: report.format,
      },
    });
  }

  private scheduleReport(report: Report): void {
    // Implementar lógica de programación
    // Por ejemplo, usando node-cron o similar
  }

  // Métodos auxiliares para generar diferentes tipos de reportes
  private async generateInventoryExcel(worksheet: ExcelJS.Worksheet, parameters: any): Promise<void> {
    // Implementar generación de reporte de inventario en Excel
  }

  private async generateSalesExcel(worksheet: ExcelJS.Worksheet, parameters: any): Promise<void> {
    // Implementar generación de reporte de ventas en Excel
  }

  private async generateInventoryPDF(doc: PDFKit.PDFDocument, parameters: any): Promise<void> {
    // Implementar generación de reporte de inventario en PDF
  }

  private async generateSalesPDF(doc: PDFKit.PDFDocument, parameters: any): Promise<void> {
    // Implementar generación de reporte de ventas en PDF
  }
} 