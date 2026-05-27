import { Client } from '@hygraph/management-sdk';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const token = process.env.HYGRAPH_WRITE_TOKEN;
if (!token) {
    console.error("❌ Error: HYGRAPH_WRITE_TOKEN not found in .env.local");
    process.exit(1);
}

// The Management SDK requires the endpoint with the environment ID (e.g., /environments/master)
// We construct this based on standard Hygraph structure.
const endpoint = "https://management-us-west-2.hygraph.com/graphql/environments/master";

const client = new Client({
    authToken: token,
    endpoint: endpoint
});

// Helper function to run migrations one by one so we can catch and skip "already exists" errors
async function runMigration(name, migrationFn) {
    migrationFn(); // Queues the operation
    try {
        await client.run(); // Executes the queued operation
        console.log(`✅ Success: ${name}`);
    } catch (error) {
        const errorString = error.body ? JSON.stringify(error.body) : (error.message || String(error));
        const isDuplicate = errorString.toLowerCase().includes("already exists") || 
                            errorString.toLowerCase().includes("not unique") || 
                            errorString.toLowerCase().includes("already defined");
        
        if (isDuplicate) {
            console.log(`⏭️ Skipped: ${name} (Already exists)`);
        } else {
            console.log(`❌ Error on ${name}:`, errorString);
        }
    }
}

async function main() {
    console.log("Loading environment variables from .env.local...\n");
    console.log("--- Creating Enumerations ---");
    
    await runMigration("Enumeration 'Importance'", () => {
        client.createEnumeration({
            apiId: 'Importance',
            displayName: 'Importance',
            values: [
                { apiId: 'LOW', displayName: 'Low' },
                { apiId: 'MEDIUM', displayName: 'Medium' },
                { apiId: 'HIGH', displayName: 'High' }
            ]
        });
    });

    await runMigration("Enumeration 'AiTool'", () => {
        client.createEnumeration({
            apiId: 'AiTool',
            displayName: 'AI Tool',
            values: [
                { apiId: 'CLAUDE', displayName: 'Claude' },
                { apiId: 'GPT', displayName: 'GPT' },
                { apiId: 'GEMINI', displayName: 'Gemini' },
                { apiId: 'OTHER', displayName: 'Other' }
            ]
        });
    });

    await runMigration("Enumeration 'TechnicalDepth'", () => {
        client.createEnumeration({
            apiId: 'TechnicalDepth',
            displayName: 'Technical Depth',
            values: [
                { apiId: 'BEGINNER', displayName: 'Beginner' },
                { apiId: 'INTERMEDIATE', displayName: 'Intermediate' },
                { apiId: 'ADVANCED', displayName: 'Advanced' }
            ]
        });
    });

    console.log("\n--- Creating Fields for Blog Model ---");
    const blog = client.model('Blog');

    const fields = [
        { apiId: 'importance', displayName: 'Importance', type: 'enum', enumId: 'Importance' },
        { apiId: 'importanceReason', displayName: 'Importance Reason', type: 'string' },
        { apiId: 'sourceUrl', displayName: 'Source URL', type: 'string' },
        { apiId: 'sourceName', displayName: 'Source Name', type: 'string' },
        { apiId: 'aiTool', displayName: 'AI Tool', type: 'enum', enumId: 'AiTool' },
        { apiId: 'aiToolVersion', displayName: 'AI Tool Version', type: 'string' },
        { apiId: 'canLearn', displayName: 'Can Learn', type: 'boolean' },
        { apiId: 'prerequisites', displayName: 'Prerequisites', type: 'string' },
        { apiId: 'learningRoadmap', displayName: 'Learning Roadmap', type: 'string' },
        { apiId: 'estimatedLearningTime', displayName: 'Estimated Learning Time', type: 'string' },
        { apiId: 'canTest', displayName: 'Can Test', type: 'boolean' },
        { apiId: 'testingGuide', displayName: 'Testing Guide', type: 'string' },
        { apiId: 'codeExamples', displayName: 'Code Examples', type: 'string' },
        { apiId: 'technicalDepth', displayName: 'Technical Depth', type: 'enum', enumId: 'TechnicalDepth' },
        { apiId: 'actionSuggestion', displayName: 'Action Suggestion', type: 'string' },
        { apiId: 'isAiGenerated', displayName: 'Is AI Generated', type: 'boolean' }
    ];

    for (const field of fields) {
        await runMigration(`Field '${field.apiId}'`, () => {
            if (field.type === 'enum') {
                blog.addEnumerableField({
                    apiId: field.apiId,
                    displayName: field.displayName,
                    enumerationApiId: field.enumId
                });
            } else if (field.type === 'string') {
                blog.addSimpleField({
                    apiId: field.apiId,
                    displayName: field.displayName,
                    type: 'String'
                });
            } else if (field.type === 'boolean') {
                blog.addSimpleField({
                    apiId: field.apiId,
                    displayName: field.displayName,
                    type: 'Boolean'
                });
            }
        });
    }

    console.log("\n--- Summary ---");
    console.log("Migration complete! Check your Hygraph dashboard.");
    console.log("NOTE: You may still need to manually set the 'Appearance' of fields like prerequisites/codeExamples to 'Markdown' inside the Hygraph Studio UI.");
}

main();
