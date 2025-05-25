const EventEmitter = require('events');

class InventorySystem extends EventEmitter {
    constructor() {
        super();
        this.products = new Map();
        this.stockThresholds = new Map();
        this.rfidSensors = new Map();
        this.stockHistory = new Map();
        this.initializeInventory();
    }

    initializeInventory() {
        ['A1', 'A2', 'B1', 'B2'].forEach(zone => {
            this.rfidSensors.set(`rfid_${zone}`, {
                id: `rfid_${zone}`,
                status: 'active',
                zone: zone,
                lastScan: null
            });
        });
    }

    addProduct(productId, data) {
        this.products.set(productId, {
            id: productId,
            name: data.name,
            currentStock: data.initialStock,
            minStock: data.minStock,
            maxStock: data.maxStock,
            zone: data.zone,
            lastUpdated: Date.now()
        });

        this.stockThresholds.set(productId, {
            min: data.minStock,
            max: data.maxStock,
            reorderPoint: data.reorderPoint
        });

        this.stockHistory.set(productId, [{
            timestamp: Date.now(),
            stock: data.initialStock,
            type: 'initial'
        }]);
    }

    updateStock(productId, quantity, type = 'manual') {
        const product = this.products.get(productId);
        if (product) {
            const oldStock = product.currentStock;
            product.currentStock = Math.max(0, product.currentStock + quantity);
            product.lastUpdated = Date.now();

            this.stockHistory.get(productId).push({
                timestamp: Date.now(),
                stock: product.currentStock,
                change: quantity,
                type: type
            });

            this.checkStockThresholds(productId);
            
            this.emit('stock_updated', {
                productId,
                oldStock,
                newStock: product.currentStock,
                change: quantity,
                type: type
            });
        }
    }

    checkStockThresholds(productId) {
        const product = this.products.get(productId);
        const thresholds = this.stockThresholds.get(productId);

        if (product && thresholds) {
            if (product.currentStock <= thresholds.reorderPoint) {
                this.emit('reorder_needed', {
                    productId,
                    currentStock: product.currentStock,
                    reorderPoint: thresholds.reorderPoint,
                    suggestedOrder: thresholds.max - product.currentStock
                });
            }
        }
    }

    predictStockNeeds() {
        this.products.forEach((product, productId) => {
            const history = this.stockHistory.get(productId);
            if (history && history.length > 1) {
                const recentHistory = history.slice(-30); // Últimos 30 registros
                const avgDailyUsage = this.calculateAverageDailyUsage(recentHistory);
                
                const prediction = {
                    productId,
                    currentStock: product.currentStock,
                    avgDailyUsage,
                    daysUntilReorder: Math.floor(
                        (product.currentStock - this.stockThresholds.get(productId).reorderPoint) / avgDailyUsage
                    )
                };

                this.emit('stock_prediction', prediction);
            }
        });
    }

    calculateAverageDailyUsage(history) {
        if (history.length < 2) return 0;
        
        const usage = history.reduce((acc, curr, idx, arr) => {
            if (idx === 0) return acc;
            const change = curr.stock - arr[idx - 1].stock;
            return acc + (change < 0 ? Math.abs(change) : 0);
        }, 0);

        const days = (history[history.length - 1].timestamp - history[0].timestamp) / (1000 * 60 * 60 * 24);
        return usage / days;
    }

    getInventoryStatus() {
        return {
            products: Object.fromEntries(this.products),
            rfidSensors: Object.fromEntries(this.rfidSensors),
            predictions: Array.from(this.products.keys()).map(productId => {
                const history = this.stockHistory.get(productId);
                return {
                    productId,
                    avgDailyUsage: this.calculateAverageDailyUsage(history || [])
                };
            })
        };
    }
}

module.exports = InventorySystem; 