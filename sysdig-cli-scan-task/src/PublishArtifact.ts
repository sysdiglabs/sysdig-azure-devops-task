// import * as azureDevOps from 'azure-devops-node-api';
// import * as tl from 'azure-pipelines-task-lib/task';
// import * as fs from 'fs';

// // Function to publish artifacts
// export async function publishArtifact(artifactName: string, filePath: string) {

//     console.log(`[INFO] Publishing artifact ${artifactName}...`);
//     console.log(`[INFO] File path: ${filePath}`);
    
//     const buildId = tl.getVariable('Build.BuildId');
//     const projectId = tl.getVariable('System.TeamProjectId');

//     // Validate buildId and projectId
//     if (!buildId || !projectId) {
//         throw new Error('Build ID or Project ID is not available.');
//     }

//     // Initialize connection to Azure DevOps
//     const orgUrl = tl.getVariable('System.TeamFoundationCollectionUri');
//     const token = tl.getVariable('System.AccessToken'); // Use the system access token
//     if (!orgUrl || !token) {
//         throw new Error('Organization URL or Access Token is not available.');
//     }
//     const authHandler = azureDevOps.getPersonalAccessTokenHandler(token);
//     const connection = new azureDevOps.WebApi(orgUrl, authHandler);

//     // Get build API
//     const buildApi = await connection.getBuildApi();

//     // Read the file to be uploaded
//     const fileBuffer = fs.readFileSync(filePath);

//     // Upload the file as an artifact
//     await buildApi.createArtifact({
//         name: artifactName,
//         resource: {
//             type: 'Container',
//             data: fileBuffer.toString('base64'),
//             properties: {
//                 artifacttype: 'Container',
//                 containerfolder: artifactName,
//                 localpath: filePath
//             }
//         }
//     }, buildId, parseInt(projectId));
// }
