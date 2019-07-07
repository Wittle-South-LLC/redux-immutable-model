pipeline {
  agent any
  stages {
    stage ('Run tests') {
      environment {
        API_PATH='http://localhost/api/v1'
        NODE_ENV = 'test'
      }
      steps {
        sh "npm install"
        sh "npm test"
      }
    }
  }
  post {
    failure {
      mail to: 'eric@wittlesouth.com',
      subject: "WS Failed Pipeline: ${currentBuild.fullDisplayName}",
      body: "Build failed: ${env.BUILD_URL}"
    }
  }
}