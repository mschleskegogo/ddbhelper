import utilities.GogoUtilities

SHELL_STEPS=sprintf('''
  #!/bin/bash -x

  npm update
  npm install --production
  [ -d "node_modules" ] && cp -R node_modules src/ || echo "No node_modules found, skipping"
  ''', ['JOB_NAME'])

// API docs: https://jenkinsci.github.io/job-dsl-plugin/
def myJob = job("$SRC_JOB") {
//   parameters {
//     stringParam('GIT_BUILD_BRANCH', 'master', 'Git branch used to build.')
//   }
  logRotator {
    numToKeep(5)
    artifactNumToKeep(5)
  }
  scm {
    git {
      remote {
        url("$REPO")
        credentials('gitlab-jenkinsci')
      }
      branch('master')
    }
  }
  wrappers {
    preBuildCleanup()
  }
  configure { project ->
    project / buildWrappers << 'org.jenkinsci.plugins.nvm.NvmWrapper' {
        version('v12.18.0')
    }
  }
  triggers {
    scm('* * * * *')
  }
  steps {
    shell(SHELL_STEPS)
  }
}

g = new GogoUtilities(job: myJob)
g.addBaseOptions(artifact_type='lambda')
g.addSlack(slack_room='#mstest')
