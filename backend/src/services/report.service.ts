import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Report } from '../models/report.model';
import { CreateReportDto, ReportFilterDto, ReportType, ReportFormat, ReportStatus } from '../dto/report.dto';
import { LoggerService } from '../core/services/logger.service';
import { MetricsService } from '../core/services/metrics.service';
import { NotificationService } from './notification.service';
import { NotificationType } from '../dto/notification.dto';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  private readonly uploadDir: string;

  constructor(
    @InjectModel(Report.name) private readonly reportModel: Model<Report>,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
    private readonly metrics: MetricsService,
    private readonly notificationService: NotificationService,
  ) {
    const uploadDir = this.configService.get<string>('upload.dir');
    if (!uploadDir) {
      throw new Error('Upload directory not configured');
    }
    this.uploadDir = uploadDir;
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async create(createReportDto: CreateReportDto): Promise<Report> {
    try {
      const report = new this.reportModel({
        ...createReportDto,
        status: ReportStatus.PENDING,
      });
      const saved = await report.save();
      this.metrics.increment('reports.created');
      return saved;
    } catch (error) {
      this.logger.error(`Error creating report: ${error.message}`);
      throw error;
    }
  }

  async findAll(filter?: FilterQuery<Report>): Promise<Report[]> {
    try {
      return await this.reportModel.find(filter || {}).exec();
    } catch (error) {
      this.logger.error(`Error finding reports: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<Report> {
    try {
      const report = await this.reportModel.findById(id).exec();
      if (!report) {
        throw new NotFoundException(`Report with ID ${id} not found`);
      }
      return report;
    } catch (error) {
      this.logger.error(`Error finding report: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await this.reportModel.deleteOne({ _id: id }).exec();
      if (result.deletedCount === 0) {
        throw new NotFoundException(`Report with ID ${id} not found`);
      }
      this.metrics.increment('reports.deleted');
    } catch (error) {
      this.logger.error(`Error deleting report: ${error.message}`);
      throw error;
    }
  }

  async download(id: string): Promise<{ fileUrl: string; fileSize: number }> {
    const report = await this.findOne(id);
    
    if (report.status !== ReportStatus.COMPLETED) {
      throw new Error('Report is not completed yet');
    }

    if (!report.fileUrl || !report.fileSize) {
      throw new Error('Report file information is missing');
    }

    return {
      fileUrl: report.fileUrl,
      fileSize: report.fileSize,
    };
  }

  async getAvailableTypes(): Promise<ReportType[]> {
    return Object.values(ReportType);
  }

  async getAvailableFormats(): Promise<ReportFormat[]> {
    return Object.values(ReportFormat);
  }

  private async notifyReportCompletion(report: Report): Promise<void> {
    try {
      await this.notificationService.create({
        type: NotificationType.EMAIL,
        recipient: report.metadata?.userEmail || 'admin@example.com',
        subject: `Report ${report.type} completed`,
        content: `Your report ${report.type} has been completed and is ready for download.`,
      });
    } catch (error) {
      this.logger.error(`Error sending notification: ${error.message}`);
    }
  }

  async processReport(id: string): Promise<void> {
    const report = await this.findOne(id);
    
    try {
      // Simular el procesamiento del reporte
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const generatedFileUrl = `https://example.com/reports/${id}.${report.format.toLowerCase()}`;
      const generatedFileSize = 1024; // Tamaño simulado en bytes
      
      report.markAsCompleted(generatedFileUrl, generatedFileSize);
      await report.save();
      
      await this.notifyReportCompletion(report);
    } catch (error) {
      report.markAsFailed(error.message);
      await report.save();
      throw error;
    }
  }

  private async generateReport(report: Report): Promise<void> {
    report.markAsProcessing();
    await report.save();

    try {
      const start = Date.now();
      let fileUrl: string | undefined = undefined;
      let fileSize: number | undefined = undefined;

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
        default:
          report.markAsFailed(`Unsupported format: ${report.format}`);
          await report.save();
          return;
      }

      if (fileUrl && fileSize !== undefined) {
        report.markAsCompleted(fileUrl, fileSize);
      } else {
        report.markAsFailed('File generation failed');
      }
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