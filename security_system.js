const EventEmitter = require('events');

class SecuritySystem extends EventEmitter {
    constructor() {
        super();
        this.cameras = new Map();
        this.motionSensors = new Map();
        this.alerts = new Map();
        this.initializeSecurity();
    }

    initializeSecurity() {
        // Inicializar cámaras
        ['A1', 'A2', 'B1', 'B2'].forEach(zone => {
            this.cameras.set(`cam_${zone}`, {
                id: `cam_${zone}`,
                status: 'active',
                recording: false,
                zone: zone,
                lastMotion: null
            });

            this.motionSensors.set(`motion_${zone}`, {
                id: `motion_${zone}`,
                status: 'active',
                zone: zone,
                lastTrigger: null
            });
        });
    }

    handleMotionDetection(zone, value) {
        const camera = this.cameras.get(`cam_${zone}`);
        const sensor = this.motionSensors.get(`motion_${zone}`);

        if (value > 0) {
            const timestamp = Date.now();
            camera.lastMotion = timestamp;
            sensor.lastTrigger = timestamp;
            camera.recording = true;

            this.emit('motion_detected', {
                zone: zone,
                timestamp: timestamp,
                camera: camera.id,
                sensor: sensor.id
            });

            // Crear alerta
            this.createAlert(zone, 'motion', {
                message: `Movimiento detectado en zona ${zone}`,
                severity: 'medium',
                timestamp: timestamp
            });
        } else {
            // Si no hay movimiento por 30 segundos, detener grabación
            setTimeout(() => {
                if (Date.now() - camera.lastMotion > 30000) {
                    camera.recording = false;
                }
            }, 30000);
        }
    }

    createAlert(zone, type, data) {
        const alertId = `${type}_${zone}_${Date.now()}`;
        const alert = {
            id: alertId,
            type: type,
            zone: zone,
            ...data,
            status: 'active'
        };

        this.alerts.set(alertId, alert);
        this.emit('new_alert', alert);

        return alert;
    }

    getSecurityStatus() {
        return {
            cameras: Object.fromEntries(this.cameras),
            motionSensors: Object.fromEntries(this.motionSensors),
            activeAlerts: Array.from(this.alerts.values())
                .filter(alert => alert.status === 'active')
        };
    }

    acknowledgeAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.status = 'acknowledged';
            alert.acknowledgedAt = Date.now();
            this.emit('alert_updated', alert);
        }
    }
}

module.exports = SecuritySystem; 