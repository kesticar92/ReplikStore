const EventEmitter = require('events');

class LayoutSystem extends EventEmitter {
    constructor() {
        super();
        this.layout = new Map();
        this.objects = new Map();
        this.collisionGrid = new Map();
        this.gridSize = 0.5; // Tamaño de celda en metros
        this.initializeLayout();
    }

    initializeLayout() {
        ['A1', 'A2', 'B1', 'B2'].forEach(zone => {
            this.layout.set(zone, {
                id: zone,
                dimensions: { width: 10, length: 10, height: 3 }, // metros
                objects: [],
                walkways: [],
                occupiedSpace: 0,
                lastModified: Date.now()
            });
        });
    }

    addObject(zoneId, object) {
        const zone = this.layout.get(zoneId);
        if (!zone) {
            throw new Error(`Zona ${zoneId} no encontrada`);
        }

        // Validar dimensiones
        if (!this.validateObjectDimensions(object)) {
            throw new Error('Dimensiones de objeto inválidas');
        }

        // Verificar colisiones
        if (this.checkCollisions(zoneId, object)) {
            throw new Error('El objeto colisiona con elementos existentes');
        }

        // Añadir objeto
        const objectId = `obj_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        this.objects.set(objectId, {
            ...object,
            id: objectId,
            zone: zoneId
        });

        zone.objects.push(objectId);
        zone.occupiedSpace += this.calculateObjectArea(object);
        zone.lastModified = Date.now();

        // Actualizar grid de colisiones
        this.updateCollisionGrid(zoneId, objectId, object);

        this.emit('object_added', {
            zoneId,
            objectId,
            object: this.objects.get(objectId)
        });

        return objectId;
    }

    validateObjectDimensions(object) {
        return (
            object.width > 0 &&
            object.length > 0 &&
            object.height > 0 &&
            object.width <= 10 &&
            object.length <= 10 &&
            object.height <= 3
        );
    }

    calculateObjectArea(object) {
        return object.width * object.length;
    }

    checkCollisions(zoneId, newObject) {
        const zone = this.layout.get(zoneId);
        if (!zone) return true;

        // Convertir posición a coordenadas de grid
        const gridX = Math.floor(newObject.position.x / this.gridSize);
        const gridY = Math.floor(newObject.position.y / this.gridSize);
        const gridWidth = Math.ceil(newObject.width / this.gridSize);
        const gridLength = Math.ceil(newObject.length / this.gridSize);

        // Verificar cada celda que ocuparía el objeto
        for (let x = gridX; x < gridX + gridWidth; x++) {
            for (let y = gridY; y < gridY + gridLength; y++) {
                const cellKey = `${zoneId}_${x}_${y}`;
                if (this.collisionGrid.has(cellKey)) {
                    return true; // Colisión detectada
                }
            }
        }

        return false;
    }

    updateCollisionGrid(zoneId, objectId, object) {
        const gridX = Math.floor(object.position.x / this.gridSize);
        const gridY = Math.floor(object.position.y / this.gridSize);
        const gridWidth = Math.ceil(object.width / this.gridSize);
        const gridLength = Math.ceil(object.length / this.gridSize);

        // Marcar celdas ocupadas
        for (let x = gridX; x < gridX + gridWidth; x++) {
            for (let y = gridY; y < gridY + gridLength; y++) {
                const cellKey = `${zoneId}_${x}_${y}`;
                this.collisionGrid.set(cellKey, objectId);
            }
        }
    }

    validateEvacuationRoutes(zoneId) {
        const zone = this.layout.get(zoneId);
        if (!zone) return false;

        // Implementar algoritmo de pathfinding para verificar rutas de evacuación
        const exits = this.findExits(zoneId);
        const accessibleArea = this.calculateAccessibleArea(zoneId);
        const totalArea = zone.dimensions.width * zone.dimensions.length;
        const minAccessibleRatio = 0.3; // 30% del área debe ser accesible

        return {
            hasValidRoutes: exits.length > 0 && accessibleArea / totalArea >= minAccessibleRatio,
            accessibleRatio: accessibleArea / totalArea,
            exits: exits
        };
    }

    findExits(zoneId) {
        // Simular búsqueda de salidas
        // En una implementación real, esto vendría de la configuración del mapa
        return [{
            id: `exit_${zoneId}_1`,
            position: { x: 0, y: 0 },
            width: 1.5
        }];
    }

    calculateAccessibleArea(zoneId) {
        const zone = this.layout.get(zoneId);
        if (!zone) return 0;

        const totalArea = zone.dimensions.width * zone.dimensions.length;
        const occupiedArea = zone.occupiedSpace;
        return totalArea - occupiedArea;
    }

    optimizeLayout(zoneId) {
        const zone = this.layout.get(zoneId);
        if (!zone) return null;

        // Calcular métricas actuales
        const currentMetrics = {
            occupiedSpace: zone.occupiedSpace,
            accessibleArea: this.calculateAccessibleArea(zoneId),
            evacuationRoutes: this.validateEvacuationRoutes(zoneId)
        };

        // Sugerir mejoras
        const suggestions = [];

        // Verificar densidad de ocupación
        const occupancyRatio = zone.occupiedSpace / (zone.dimensions.width * zone.dimensions.length);
        if (occupancyRatio > 0.7) {
            suggestions.push({
                type: 'density_warning',
                message: 'La densidad de ocupación es muy alta',
                currentValue: occupancyRatio,
                recommendedMax: 0.7
            });
        }

        // Verificar rutas de evacuación
        if (!currentMetrics.evacuationRoutes.hasValidRoutes) {
            suggestions.push({
                type: 'evacuation_warning',
                message: 'Las rutas de evacuación no son óptimas',
                currentRatio: currentMetrics.evacuationRoutes.accessibleRatio,
                recommendedMin: 0.3
            });
        }

        return {
            metrics: currentMetrics,
            suggestions: suggestions
        };
    }

    getLayoutStatus() {
        return {
            zones: Object.fromEntries(this.layout),
            objects: Object.fromEntries(this.objects),
            metrics: Array.from(this.layout.keys()).map(zoneId => ({
                zoneId,
                ...this.optimizeLayout(zoneId)
            }))
        };
    }
}

module.exports = LayoutSystem; 