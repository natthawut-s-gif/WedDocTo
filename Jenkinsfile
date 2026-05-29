pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  parameters {
    string(name: 'APP_VERSION', defaultValue: '1.0.0', description: 'Production version to build and deploy')
    string(name: 'PYTHON_VERSION', defaultValue: '3.11.13-slim-bookworm', description: 'Docker base image tag')
    string(name: 'WEB_PORT', defaultValue: '8000', description: 'Host port for production container')
    booleanParam(name: 'DEPLOY', defaultValue: true, description: 'Deploy after successful build')
  }

  environment {
    IMAGE_NAME = 'webdocto'
    COMPOSE_PROJECT_NAME = 'webdocto-prod'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Set Version') {
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

    stage('Verify Python Files') {
      steps {
        bat 'python -m py_compile app\\main.py app\\processing.py ocr_preprocess.py'
      }
    }

    stage('Build Production Image') {
      steps {
        bat 'docker compose --env-file .env.production build --no-cache'
      }
    }

    stage('Deploy Production') {
      when {
        expression { return params.DEPLOY }
      }
      steps {
        bat 'docker compose --env-file .env.production up -d'
      }
    }

    stage('Verify Deployment') {
      when {
        expression { return params.DEPLOY }
      }
      steps {
        bat 'docker compose --env-file .env.production ps'
      }
    }
  }

  post {
    success {
      archiveArtifacts artifacts: 'VERSION,.env.production', fingerprint: true
    }
  }
}
