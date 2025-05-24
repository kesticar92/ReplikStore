const EventEmitter = require('events');

class CustomerSimulation extends EventEmitter {
    constructor() {
        super();
        this.activeCustomers = new Map();
        this.behaviorPatterns = new Map();
        this.heatMap = new Map();
        this.initializePatterns();
    }

    initializePatterns() {
        // Patrones básicos de comportamiento
        this.behaviorPatterns.set('browser', {
            name: 'browser',
            avgTimeInStore: 1800000, // 30 minutos
            interactionProbability: 0.3,
            purchaseProbability: 0.2
        });

        this.behaviorPatterns.set('determined', {
            name: 'determined',
            avgTimeInStore: 600000, // 10 minutos
            interactionProbability: 0.8,
            purchaseProbability: 0.7
        });

        this.behaviorPatterns.set('rusher', {
            name: 'rusher',
            avgTimeInStore: 300000, // 5 minutos
            interactionProbability: 0.9,
            purchaseProbability: 0.5
        });

        // Inicializar heat map para cada zona
        ['A1', 'A2', 'B1', 'B2'].forEach(zone => {
            this.heatMap.set(zone, {
                visits: 0,
                totalTime: 0,
                interactions: 0,
                purchases: 0
            });
        });
    }

    createVirtualCustomer() {
        const customerId = `customer_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const patterns = Array.from(this.behaviorPatterns.keys());
        const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        const customer = {
            id: customerId,
            pattern: selectedPattern,
            entryTime: Date.now(),
            currentZone: null,
            visitedZones: [],
            interactions: 0,
            purchases: 0
        };

        this.activeCustomers.set(customerId, customer);
        this.emit('customer_entered', customer);
        
        return customer;
    }

    moveCustomer(customerId, newZone) {
        const customer = this.activeCustomers.get(customerId);
        if (customer) {
            const oldZone = customer.currentZone;
            customer.currentZone = newZone;
            
            if (!customer.visitedZones.includes(newZone)) {
                customer.visitedZones.push(newZone);
            }

            // Actualizar heat map
            const heatMapData = this.heatMap.get(newZone);
            heatMapData.visits++;
            
            this.emit('customer_moved', {
                customerId,
                fromZone: oldZone,
                toZone: newZone,
                timestamp: Date.now()
            });
        }
    }

    simulateInteraction(customerId) {
        const customer = this.activeCustomers.get(customerId);
        if (customer && customer.currentZone) {
            const pattern = this.behaviorPatterns.get(customer.pattern);
            const willInteract = Math.random() < pattern.interactionProbability;
            
            if (willInteract) {
                customer.interactions++;
                const heatMapData = this.heatMap.get(customer.currentZone);
                heatMapData.interactions++;
                
                this.emit('customer_interaction', {
                    customerId,
                    zone: customer.currentZone,
                    timestamp: Date.now(),
                    interactionCount: customer.interactions
                });
            }
        }
    }

    simulatePurchase(customerId) {
        const customer = this.activeCustomers.get(customerId);
        if (customer && customer.currentZone) {
            const pattern = this.behaviorPatterns.get(customer.pattern);
            const willPurchase = Math.random() < pattern.purchaseProbability;
            
            if (willPurchase) {
                customer.purchases++;
                const heatMapData = this.heatMap.get(customer.currentZone);
                heatMapData.purchases++;
                
                this.emit('customer_purchase', {
                    customerId,
                    zone: customer.currentZone,
                    timestamp: Date.now(),
                    purchaseCount: customer.purchases
                });
            }
        }
    }

    removeCustomer(customerId) {
        const customer = this.activeCustomers.get(customerId);
        if (customer) {
            const timeInStore = Date.now() - customer.entryTime;
            
            // Actualizar estadísticas
            customer.visitedZones.forEach(zone => {
                const heatMapData = this.heatMap.get(zone);
                heatMapData.totalTime += timeInStore / customer.visitedZones.length;
            });

            this.activeCustomers.delete(customerId);
            this.emit('customer_left', {
                customerId,
                timeInStore,
                visitedZones: customer.visitedZones,
                interactions: customer.interactions,
                purchases: customer.purchases
            });
        }
    }

    getHeatMapData() {
        return Object.fromEntries(this.heatMap);
    }

    getActiveCustomers() {
        return Array.from(this.activeCustomers.values());
    }

    getCustomerAnalytics() {
        return {
            totalCustomers: this.activeCustomers.size,
            heatMap: this.getHeatMapData(),
            patternDistribution: Array.from(this.behaviorPatterns.keys()).map(pattern => ({
                pattern,
                count: Array.from(this.activeCustomers.values())
                    .filter(customer => customer.pattern === pattern).length
            }))
        };
    }
}

module.exports = CustomerSimulation; 