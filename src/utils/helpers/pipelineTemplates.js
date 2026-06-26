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
 * Functional export pattern matching the backend architectural style
 */
const generateWorkflowYaml = (projectName, projectId, framework) => {
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
        uses: actions/checkout@v4

      - name: Setup Node.js Runtime Environment
        uses: actions/setup-node@v4
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
          PROJECT_ID="${projectId}"
          VERSION="v1.0.\${{ github.run_number }}"
          ENV_TYPE="prod"
          STATUS="Success"
          LOG_SUMMARY="Build compiled successfully for ${framework}. Live servers operational."
          LOG_OUTPUT="GitHub Actions Workflow: Success\\nFramework: ${framework}\\nBranch: main\\nCommit: \${{ github.sha }}\\nRunner ID: \${{ github.run_id }}"

          curl -X POST https://api.ucollyx.com/api/webhooks/pipeline-status \\
            -H "Content-Type: application/json" \\
            -d "{
              \\"project_id\\": \\"\$PROJECT_ID\\",
              \\"status\\": \\"\$STATUS\\",
              \\"version\\": \\"\$VERSION\\",
              \\"env\\": \\"\$ENV_TYPE\\",
              \\"log_summary\\": \\"\$LOG_SUMMARY\\",
              \\"log_output\\": \\"\$LOG_OUTPUT\\"
            }"

      # 🔴 NOTIFY UCOLLYX ON FAILURE
      - name: Broadcast Failure to UCollyx Ecosystem
        if: failure()
        run: |
          PROJECT_ID="${projectId}"
          VERSION="v1.0.\${{ github.run_number }}"
          ENV_TYPE="prod"
          STATUS="Failed"
          LOG_SUMMARY="Pipeline execution crashed during framework build/compilation phase."
          LOG_OUTPUT="GitHub Actions Workflow: Failed\\nFramework: ${framework}\\nBranch: main\\nCheck logs for runner execution failure details."

          curl -X POST https://api.ucollyx.com/api/webhooks/pipeline-status \\
            -H "Content-Type: application/json" \\
            -d "{
              \\"project_id\\": \\"\$PROJECT_ID\\",
              \\"status\\": \\"\$STATUS\\",
              \\"version\\": \\"\$VERSION\\",
              \\"env\\": \\"\$ENV_TYPE\\",
              \\"log_summary\\": \\"\$LOG_SUMMARY\\",
              \\"log_output\\": \\"\$LOG_OUTPUT\\"
            }"
`;
};

module.exports = {
  generateWorkflowYaml
};