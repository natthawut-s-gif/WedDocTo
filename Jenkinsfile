def runStep(String unixCommand, String windowsCommand = null) {
  if (isUnix()) {
    sh unixCommand
  } else {
    bat(windowsCommand ?: unixCommand)
  }
}

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
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Runtime Check') {
      steps {
        script {
          if (isUnix()) {
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

              echo "[OK] Python: $(python3 --version)"
              echo "[OK] Node  : $(node --version)"
              echo "[OK] curl  : $(curl --version | head -n 1)"
              echo "[OK] Docker: $(docker --version)"
              echo "[OK] Compose: $(docker compose version | head -n 1)"
            '''
          } else {
            bat '''
              @echo off
              echo ==================================================
              echo RUNTIME CHECK
              echo ==================================================

              where python >nul 2>nul || (echo [ERROR] Missing required command: python & exit /b 1)
              where docker >nul 2>nul || (echo [ERROR] Missing required command: docker & exit /b 1)
              where node >nul 2>nul || (echo [ERROR] Missing required command: node & exit /b 1)

              docker compose version >nul 2>nul || (echo [ERROR] docker compose plugin is not available & exit /b 1)
              docker info >nul 2>nul || (echo [ERROR] Docker daemon is not reachable & exit /b 1)

              for /f "delims=" %%i in ('python --version') do echo [OK] Python: %%i
              for /f "delims=" %%i in ('node --version') do echo [OK] Node  : %%i
              for /f "delims=" %%i in ('docker --version') do echo [OK] Docker: %%i
              for /f "delims=" %%i in ('docker compose version') do (
                echo [OK] Compose: %%i
                goto :doneCompose
              )
              :doneCompose
            '''
          }
        }
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
        script {
          runStep(
            '''
              set -eu
              python3 -m py_compile app/main.py app/processing.py ocr_preprocess.py
              node --check app/static/app.js
              docker compose --env-file .env.production -f "${COMPOSE_FILE}" config >/dev/null
            ''',
            '''
              @echo off
              python -m py_compile app\\main.py app\\processing.py ocr_preprocess.py || exit /b 1
              node --check app\\static\\app.js || exit /b 1
              docker compose --env-file .env.production -f "%COMPOSE_FILE%" config >nul || exit /b 1
            '''
          )
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        script {
          runStep(
            '''
              set -eu
              docker compose --env-file .env.production -f "${COMPOSE_FILE}" build
            ''',
            '''
              @echo off
              docker compose --env-file .env.production -f "%COMPOSE_FILE%" build || exit /b 1
            '''
          )
        }
      }
    }

    stage('Deploy') {
      when {
        expression { return params.DEPLOY }
      }
      steps {
        script {
          runStep(
            '''
              set -eu
              docker compose --env-file .env.production -f "${COMPOSE_FILE}" up -d --build --remove-orphans
            ''',
            '''
              @echo off
              docker compose --env-file .env.production -f "%COMPOSE_FILE%" up -d --build --remove-orphans || exit /b 1
            '''
          )
        }
      }
    }

    stage('Health Check') {
      when {
        expression { return params.DEPLOY }
      }
      steps {
        script {
          if (isUnix()) {
            sh '''
              set -eu
              attempts=20
              count=1
              until curl --fail --silent "${HEALTH_URL}" >/dev/null; do
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
          } else {
            powershell '''
              $attempts = 20
              for ($i = 1; $i -le $attempts; $i++) {
                try {
                  $response = Invoke-WebRequest -Uri $env:HEALTH_URL -UseBasicParsing -TimeoutSec 5
                  if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
                    Write-Host "[OK] Health check passed: $env:HEALTH_URL"
                    exit 0
                  }
                } catch {}

                if ($i -eq $attempts) {
                  Write-Host "[ERROR] Health check failed: $env:HEALTH_URL"
                  docker compose --env-file .env.production -f $env:COMPOSE_FILE ps
                  docker compose --env-file .env.production -f $env:COMPOSE_FILE logs --tail=200 $env:APP_SERVICE
                  exit 1
                }

                Write-Host "Waiting for health endpoint $env:HEALTH_URL ($i/$attempts)"
                Start-Sleep -Seconds 5
              }
            '''
          }
        }
      }
    }
  }

  post {
    always {
      script {
        runStep(
          '''
            set +e
            docker compose --env-file .env.production -f "${COMPOSE_FILE}" ps
          ''',
          '''
            @echo off
            docker compose --env-file .env.production -f "%COMPOSE_FILE%" ps
            exit /b 0
          '''
        )
      }
    }

    success {
      archiveArtifacts artifacts: 'VERSION,.env.production', fingerprint: true
    }

    failure {
      script {
        runStep(
          '''
            set +e
            docker compose --env-file .env.production -f "${COMPOSE_FILE}" logs --tail=200 "${APP_SERVICE}"
          ''',
          '''
            @echo off
            docker compose --env-file .env.production -f "%COMPOSE_FILE%" logs --tail=200 "%APP_SERVICE%"
            exit /b 0
          '''
        )
      }
    }
  }
}
