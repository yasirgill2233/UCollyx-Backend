// helpers/pipelineTemplates.js

const frameworkConfigs = {
  "react": {
    build_commands: "npm install && npm run build",
    dist_folder: "dist",
    start_command: "serve -s dist"
  },
  "nextjs": {
    build_commands: "npm install && npm run build",
    dist_folder: ".next",
    start_command: "npm run start"
  },
  "nodejs-express": {
    build_commands: "npm install",
    dist_folder: ".",
    start_command: "node app.js"
  },
  "python-django": {
    build_commands: "pip install -r requirements.txt && python manage.py migrate",
    dist_folder: ".",
    start_command: "gunicorn myproject.wsgi"
  }
};

/**
 * Dynamic GitHub Actions Workflow Generator
 */
exports.generateWorkflowYaml = (projectName, projectId, framework) => {
  const config = frameworkConfigs[framework] || frameworkConfigs["nodejs-express"];

  return `name: UCollyx Production Pipeline - ${projectName}

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository Code
        uses: actions/checkout@v3

      - name: Setup Node.js Runtime Environment
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Execute Framework Build Matrix
        run: |
          ${config.build_commands}

      # 🟢 NOTIFY UCOLLYX ON SUCCESS
      - name: Broadcast Success to UCollyx Ecosystem
        if: success()
        run: |
          curl -X POST https://api.ucollyx.com/api/webhooks/pipeline-status \\
          -H "Content-Type: application/json" \\
          -d '{"project_id": "${projectId}", "status": "success", "log_summary": "Build compiled successfully for ${framework}. Live servers operational."}'

      # 🔴 NOTIFY UCOLLYX ON FAILURE
      - name: Broadcast Failure to UCollyx Ecosystem
        if: failure()
        run: |
          curl -X POST https://api.ucollyx.com/api/webhooks/pipeline-status \\
          -H "Content-Type: application/json" \\
          -d '{"project_id": "${projectId}", "status": "failed", "log_summary": "Pipeline execution crashed during framework build/compilation phase."}'
`;
};
