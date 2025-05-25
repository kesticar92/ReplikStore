import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportService } from '../services/report.service';
import { CreateReportDto, UpdateReportDto, ReportFilterDto } from '../dto/report.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { MetricsService } from '../core/services/metrics.service';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly metrics: MetricsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo reporte' })
  @ApiResponse({ status: 201, description: 'Reporte creado exitosamente' })
  async create(@Body() createReportDto: CreateReportDto) {
    return this.reportService.create(createReportDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de reportes' })
  @ApiResponse({ status: 200, description: 'Lista de reportes obtenida exitosamente' })
  async findAll(@Query() filter: ReportFilterDto) {
    return this.reportService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un reporte por ID' })
  @ApiResponse({ status: 200, description: 'Reporte encontrado exitosamente' })
  async findOne(@Param('id') id: string) {
    return this.reportService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un reporte' })
  @ApiResponse({ status: 200, description: 'Reporte actualizado exitosamente' })
  async update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
  ) {
    return this.reportService.update(id, updateReportDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un reporte' })
  @ApiResponse({ status: 200, description: 'Reporte eliminado exitosamente' })
  async delete(@Param('id') id: string) {
    await this.reportService.delete(id);
    return { message: 'Reporte eliminado exitosamente' };
  }
} 