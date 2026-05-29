pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  parameters {
    string(
      name: 'APP_VERSION',
      defaultValue: '1.0.0',
      description: 'Application version written to VERSION and used for the Docker tag.'
    )
    string(
      name: 'PYTHON_VERSION',
      defaultValue: '3.11.13-slim-bookworm',
      description: 'Docker Python base image tag passed to Docker build.'
    )
    string(
      name: 'WEB_PORT',
      defaultValue: '8000',
      description: 'Host port for the deployed WebDocTo container.'
    )
    string(
      name: 'COMPOSE_FILE',
      defaultValue: 'docker-compose.yml',
      description: 'Docker Compose file used to build and deploy this project.'
    )
    string(
      name: 'APP_SERVICE',
      defaultValue: 'web',
      description: 'Docker Compose service name for this project.'
    )
    string(
      name: 'HEALTH_URL',
      defaultValue: 'http://127.0.0.1:8000/api/health',
      description: 'Health endpoint checked after deploy.'
    )
    booleanParam(
      name: 'DEPLOY',
      defaultValue: true,
      description: 'Deploy after a successful build and validation.'
    )
  }

  environment {
    COMPOSE_DOCKER_CLI_BUILD = '1'
    DOCKER_BUILDKIT = '1'
    IMAGE_NAME = 'webdocto'
    COMPOSE_FILE = "${params.COMPOSE_FILE}"
    APP_SERVICE = "${params.APP_SERVICE}"
    HEALTH_URL = "${params.HEALTH_URL}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Runtime Check') {
      steps {
        sh '''
          set -eu
          echo "=================================================="
          echo "RUNTIME CHECK"
          echo "=================================================="

          require_cmd() {
            if ! command -v "$1" >/dev/null 2>&1; then
              echo "[ERROR] Missing required command: $1"
              exit 1
            fi
          }

          require_cmd python3
          require_cmd docker
          require_cmd node
          require_cmd curl

          docker compose version >/dev/null 2>&1 || {
            echo "[ERROR] docker compose plugin is not available"
            exit 1
          }

          docker info >/dev/null 2>&1 || {
            echo "[ERROR] Docker daemon is not reachable"
            exit 1
          }

          echo "[OK] Python : $(python3 --version)"
          echo "[OK] Node   : $(node --version)"
          echo "[OK] curl   : $(curl --version | head -n 1)"
          echo "[OK] Docker : $(docker --version)"
          echo "[OK] Compose: $(docker compose version | head -n 1)"
        '''
      }
    }

    stage('Prepare Build Metadata') {
      steps {
        script {
          writeFile file: 'VERSION', text: "${params.APP_VERSION}\n"
          writeFile file: '.env.production', text: """APP_VERSION=${params.APP_VERSION}
PYTHON_VERSION=${params.PYTHON_VERSION}
WEB_PORT=${params.WEB_PORT}
WEBDOCTO_SECRET=${env.WEBDOCTO_SECRET ?: 'change-me-in-production'}
N8N_WEBHOOK_URL=${env.N8N_WEBHOOK_URL ?: 'https://n8n.sahapat.com:5678/webhook/WebDocToFolw'}
"""
        }
      }
    }

    stage('Static Validation') {
      steps {
        sh '''
          set -eu
          echo "=================================================="
          echo "STATIC VALIDATION"
          echo "=================================================="
          python3 -m py_compile app/main.py app/processing.py ocr_preprocess.py
          node --check app/static/app.js
          docker compose --env-file .env.production -f "${COMPOSE_FILE}" config >/dev/null
        '''
      }
    }

    stage('Build Docker Image') {
      steps {
        sh '''
          set -eu
          echo "=================================================="
          echo "BUILD DOCKER IMAGE"
          echo "=================================================="
          docker compose --env-file .env.production -f "${COMPOSE_FILE}" build
        '''
      }
    }

    stage('Deploy') {
      when {
        expression { return params.DEPLOY }
      }
      steps {
        sh '''
          set -eu
          echo "=================================================="
          echo "DEPLOY"
          echo "=================================================="
          docker compose --env-file .env.production -f "${COMPOSE_FILE}" up -d --build --remove-orphans
        '''
      }
    }

    stage('Health Check') {
      when {
        expression { return params.DEPLOY }
      }
      steps {
        sh '''
          set -eu
          echo "=================================================="
          echo "HEALTH CHECK"
          echo "=================================================="
          attempts=20
          count=1
          until docker compose --env-file .env.production -f "${COMPOSE_FILE}" exec -T "${APP_SERVICE}" \
            curl --fail --silent "${HEALTH_URL}" >/dev/null; do
            if [ "$count" -ge "$attempts" ]; then
              echo "[ERROR] Health check failed: ${HEALTH_URL}"
              docker compose --env-file .env.production -f "${COMPOSE_FILE}" ps || true
              docker compose --env-file .env.production -f "${COMPOSE_FILE}" logs --tail=200 "${APP_SERVICE}" || true
              exit 1
            fi
            echo "Waiting for health endpoint ${HEALTH_URL} (${count}/${attempts})"
            count=$((count + 1))
            sleep 5
          done
          echo "[OK] Health check passed: ${HEALTH_URL}"
        '''
      }
    }
  }

  post {
    always {
      sh '''
        set +e
        docker compose --env-file .env.production -f "${COMPOSE_FILE}" ps
      '''
    }

    success {
      archiveArtifacts artifacts: 'VERSION,.env.production', fingerprint: true
    }

    failure {
      sh '''
        set +e
        docker compose --env-file .env.production -f "${COMPOSE_FILE}" logs --tail=200 "${APP_SERVICE}"
      '''
    }
  }
}
