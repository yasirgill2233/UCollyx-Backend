const Docker = require('dockerode');
const docker = new Docker(); // Automatically connects to /var/run/docker.sock

const createProjectContainer = async (projectPath) => {
    try {
        const container = await docker.createContainer({
            Image: 'node:18-alpine', // Lightest image for development
            Tty: true,
            AttachStdout: true,
            AttachStderr: true,
            OpenStdin: true,
            StdinOnce: false,
            HostConfig: {
                // local project path : container workspace
                Binds: [`${projectPath}:/workspace`],
            },
            WorkingDir: '/workspace',
        });

        await container.start();
        return container;
    } catch (err) {
        console.error("Docker Error:", err);
        throw err;
    }
};