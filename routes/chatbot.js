const Dialogflow = require('dialogflow');
const uuid = require('uuid');
require('dotenv').config();
const express = require('express');
const router = express.Router();

// Enhanced debug logging with clearer error messages
const debugLog = (stage, info) => {
    console.log(`[${new Date().toISOString()}] [${stage}]:`, info);
};

// Validate environment variables
const validateEnvironment = () => {
    const requiredVars = {
        PROJECT_ID: process.env.PROJECT_ID,
        GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
        GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    };

    const missingVars = Object.entries(requiredVars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missingVars.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingVars.join(', ')}. ` +
            'Please ensure all required variables are set in your .env file'
        );
    }

    return requiredVars;
};

// Initialize Dialogflow client with better error handling
const initializeDialogflowClient = () => {
    try {
        // Validate environment variables first
        const envVars = validateEnvironment();
        
        debugLog('ENV_VARS_STATUS', {
            project_id_length: envVars.PROJECT_ID.length,
            client_email_length: envVars.GOOGLE_CLIENT_EMAIL.length,
            private_key_exists: !!envVars.GOOGLE_PRIVATE_KEY
        });

        // Create credentials object
        const credentials = {
            client_email: envVars.GOOGLE_CLIENT_EMAIL,
            private_key: envVars.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
        };

        // Validate credential format
        if (!credentials.client_email.includes('@')) {
            throw new Error('Invalid client email format');
        }

        if (!credentials.private_key.includes('BEGIN PRIVATE KEY')) {
            throw new Error('Invalid private key format');
        }

        debugLog('CREDENTIALS_VALIDATION', 'Credentials format validated successfully');

        // Create the client with explicit settings
        const clientConfig = {
            credentials: credentials,
            projectId: envVars.PROJECT_ID
        };

        const client = new Dialogflow.SessionsClient(clientConfig);
        debugLog('CLIENT_CREATION', 'Successfully created Dialogflow client');
        return { client, projectId: envVars.PROJECT_ID };

    } catch (error) {
        debugLog('INITIALIZATION_ERROR', {
            error_type: error.name,
            error_message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

// Global client initialization with retry logic
let dialogflowConfig = null;
let initializationAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;

const initializeWithRetry = async () => {
    while (initializationAttempts < MAX_RETRY_ATTEMPTS) {
        try {
            dialogflowConfig = initializeDialogflowClient();
            debugLog('INIT_SUCCESS', 'Dialogflow client initialized successfully');
            return;
        } catch (error) {
            initializationAttempts++;
            debugLog('INIT_RETRY', {
                attempt: initializationAttempts,
                max_attempts: MAX_RETRY_ATTEMPTS,
                error: error.message
            });
            
            if (initializationAttempts === MAX_RETRY_ATTEMPTS) {
                debugLog('INIT_FAILED', 'Max retry attempts reached. Initialization failed.');
                throw error;
            }
            
            // Wait for 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};

// Initialize the client
initializeWithRetry().catch(error => {
    debugLog('FATAL_ERROR', {
        message: 'Failed to initialize Dialogflow client after multiple attempts',
        error: error.message
    });
});

router.post('/', async (req, res) => {
    try {
        // Check if Dialogflow is properly initialized
        if (!dialogflowConfig || !dialogflowConfig.client) {
            debugLog('REQUEST_ERROR', 'Dialogflow client not initialized');
            return res.status(500).json({ 
                error: 'Dialogflow client not initialized',
                timestamp: new Date().toISOString()
            });
        }

        const { message } = req.body;

        if (!message) {
            debugLog('VALIDATION_ERROR', 'Message is undefined or null');
            return res.status(400).json({ error: "'message' is required." });
        }

        if (typeof message !== 'string') {
            debugLog('VALIDATION_ERROR', `Invalid message type: ${typeof message}`);
            return res.status(400).json({ error: "'message' must be a string." });
        }

        // Create a unique session ID for this conversation
        const sessionId = uuid.v4();
        const sessionPath = dialogflowConfig.client.sessionPath(dialogflowConfig.projectId, sessionId);

        debugLog('PROCESSING_REQUEST', {
            sessionId,
            messageLength: message.length
        });

        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: message,
                    languageCode: 'en-US',
                },
            },
        };

        const response = await dialogflowConfig.client.detectIntent(request);
        const result = response[0].queryResult;

        debugLog('RESPONSE_RECEIVED', {
            hasResponse: !!result,
            hasText: !!result.fulfillmentText
        });

        return res.status(200).json({
            reply: result.fulfillmentText,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        debugLog('REQUEST_ERROR', {
            error: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            error: 'Failed to process request',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;