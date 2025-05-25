#!/bin/bash

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker y Docker Compose
sudo apt install -y docker.io docker-compose

# Iniciar y habilitar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Crear directorios necesarios
sudo mkdir -p /opt/replikstore
sudo mkdir -p /opt/replikstore/logs
sudo mkdir -p /opt/replikstore/database

# Copiar archivos
sudo cp -r ../backend /opt/replikstore/
sudo cp -r ../deployment /opt/replikstore/
sudo cp ../package*.json /opt/replikstore/

# Configurar permisos
sudo chown -R $USER:$USER /opt/replikstore

# Instalar dependencias
cd /opt/replikstore && npm install

# Construir y levantar contenedores
cd /opt/replikstore/deployment/docker && docker-compose up -d

# Configurar Nginx como proxy inverso
sudo apt install -y nginx
sudo tee /etc/nginx/sites-available/replikstore << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /metrics {
        proxy_pass http://localhost:9090;
    }

    location /grafana {
        proxy_pass http://localhost:3001;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/replikstore /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Configurar firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

echo "Despliegue completado. Accede a:"
echo "- API: http://localhost"
echo "- Métricas: http://localhost/metrics"
echo "- Grafana: http://localhost/grafana" 