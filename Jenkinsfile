pipeline {
  agent any
  stages {
    stage ('Run tests') {
      environment {
        API_PATH='http://localhost/api/v1'
        NODE_ENV = 'test'
      }
      steps {
        sh "npm config set cache ${env.WORKSPACE}"
        sh "npm ci"
        sh "npm build"
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
    always {
      deleteDir()
    }
  }
}
