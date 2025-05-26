import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportService } from '../services/report.service';
import { CreateReportDto, ReportFilterDto } from '../dto/report.dto';
import { Report } from '../models/report.model';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../dto/user.dto';
import { MetricsService } from '../core/services/metrics.service';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly metrics: MetricsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Crear un nuevo reporte' })
  @ApiResponse({ status: 201, description: 'Reporte creado exitosamente', type: Report })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async create(@Body() createReportDto: CreateReportDto): Promise<Report> {
    const report = await this.reportService.create(createReportDto);
    this.metrics.increment('reports.created');
    return report;
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Obtener todos los reportes' })
  @ApiResponse({ status: 200, description: 'Lista de reportes', type: [Report] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(@Query() filter: ReportFilterDto): Promise<Report[]> {
    return this.reportService.findAll(filter);
  }

  @Get('types')
  @ApiOperation({ summary: 'Obtener tipos de reportes disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de reportes' })
  async getTypes(): Promise<string[]> {
    return ['inventory', 'sales', 'users', 'notifications'];
  }

  @Get('formats')
  @ApiOperation({ summary: 'Obtener formatos de reportes disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de formatos de reportes' })
  async getFormats(): Promise<string[]> {
    return ['excel', 'pdf', 'csv'];
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Obtener un reporte por ID' })
  @ApiResponse({ status: 200, description: 'Reporte encontrado', type: Report })
  @ApiResponse({ status: 404, description: 'Reporte no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findOne(@Param('id') id: string): Promise<Report> {
    return this.reportService.findOne(id);
  }

  @Get(':id/download')
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Descargar un reporte' })
  @ApiResponse({ status: 200, description: 'Archivo del reporte' })
  @ApiResponse({ status: 404, description: 'Reporte no encontrado' })
  @ApiResponse({ status: 400, description: 'El reporte no está completo' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async download(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { fileUrl, fileSize } = await this.reportService.download(id);
    this.metrics.increment('reports.downloaded');
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=${fileUrl.split('/').pop()}`);
    res.sendFile(fileUrl);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar un reporte' })
  @ApiResponse({ status: 200, description: 'Reporte eliminado' })
  @ApiResponse({ status: 404, description: 'Reporte no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.reportService.delete(id);
    this.metrics.increment('reports.deleted');
  }
} 