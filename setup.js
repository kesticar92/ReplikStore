const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m'
};

function log(message, type = 'info') {
    const prefix = {
        info: `${colors.bright}[INFO]${colors.reset}`,
        success: `${colors.green}[SUCCESS]${colors.reset}`,
        error: `${colors.red}[ERROR]${colors.reset}`,
        warning: `${colors.yellow}[WARNING]${colors.reset}`
    };
    console.log(`${prefix[type]} ${message}`);
}

function checkDependencies() {
    log('Verificando dependencias...');
    
    // Verificar Node.js
    try {
        const nodeVersion = execSync('node --version').toString().trim();
        log(`Node.js versión ${nodeVersion} instalado`, 'success');
    } catch (error) {
        log('Node.js no encontrado. Por favor, instala Node.js', 'error');
        process.exit(1);
    }
    
    // Verificar npm
    try {
        const npmVersion = execSync('npm --version').toString().trim();
        log(`npm versión ${npmVersion} instalado`, 'success');
    } catch (error) {
        log('npm no encontrado. Por favor, instala npm', 'error');
        process.exit(1);
    }
    
    // Verificar Python
    try {
        const pythonVersion = execSync('python --version').toString().trim();
        log(`Python ${pythonVersion} instalado`, 'success');
    } catch (error) {
        try {
            const python3Version = execSync('python3 --version').toString().trim();
            log(`Python ${python3Version} instalado`, 'success');
        } catch (error) {
            log('Python no encontrado. Por favor, instala Python 3.7 o superior', 'error');
            process.exit(1);
        }
    }
}

function installNodeDependencies() {
    log('Instalando dependencias de Node.js...');
    try {
        execSync('npm install ws', { stdio: 'inherit' });
        log('Dependencias de Node.js instaladas correctamente', 'success');
    } catch (error) {
        log('Error al instalar dependencias de Node.js', 'error');
        process.exit(1);
    }
}

function createDirectoryStructure() {
    log('Creando estructura de directorios...');
    
    const directories = [
        'Content/Blueprints/Core',
        'Content/Blueprints/Security',
        'Content/Blueprints/Inventory',
        'Content/Blueprints/Customer',
        'Content/Blueprints/Layout',
        'Content/Blueprints/Help'
    ];
    
    directories.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            log(`Directorio creado: ${dir}`, 'success');
        } else {
            log(`Directorio ya existe: ${dir}`, 'warning');
        }
    });
}

function verifyFiles() {
    log('Verificando archivos del proyecto...');
    
    const requiredFiles = [
        'ws-server.js',
        'test-ws-client.js',
        'generate_blueprints.py',
        'README.md'
    ];
    
    requiredFiles.forEach(file => {
        if (fs.existsSync(path.join(process.cwd(), file))) {
            log(`Archivo encontrado: ${file}`, 'success');
        } else {
            log(`Archivo no encontrado: ${file}`, 'error');
        }
    });
}

function main() {
    console.log('\n=== Configuración del Gemelo Digital ===\n');
    
    try {
        checkDependencies();
        installNodeDependencies();
        createDirectoryStructure();
        verifyFiles();
        
        console.log('\n=== Configuración completada ===\n');
        log('El proyecto está listo para usar', 'success');
        log('Sigue las instrucciones en README.md para continuar', 'info');
    } catch (error) {
        log('Error durante la configuración:', 'error');
        log(error.message, 'error');
        process.exit(1);
    }
}

main(); 