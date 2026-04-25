const { exec } = require('child_process');
const path = require('path');

const PROJECTS_BASE_DIR = path.join(process.cwd(), "user_projects");

exports.getGitGraphData = (projectId, callback) => {
    const projectPath = path.join(PROJECTS_BASE_DIR, projectId);

    console.log("Git Path:", projectPath);

    const command = `git -C "${projectPath}" log --all --pretty=format:"%H|%P|%s" -n 50`;

    exec(command, (error, stdout, stderr) => {
        if (error) return callback(error, null);

        const logs = stdout
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => {
                const [hash, parents, message] = line.split('|');

                return {
                    hash,
                    parents: parents ? parents.split(' ') : [],
                    message,
                    isMerge: parents && parents.split(' ').length > 1
                };
            });

        callback(null, logs);
    });
};