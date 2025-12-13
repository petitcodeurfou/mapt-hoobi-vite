import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyA9OUUnxAZIoLYaktoAhqswcLK7gebVFWY');

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { message, siteUrl, siteContent, history } = JSON.parse(event.body || '{}');

        if (!message || !siteUrl) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Message and siteUrl are required' }) };
        }

        const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });

        // Build context with site info and conversation history
        const systemContext = `Tu es un assistant expert en analyse de sites web. L'utilisateur te pose des questions sur le site ${siteUrl}. Voici le contenu extrait du site:\n\n${siteContent || 'Aucun contenu disponible'}\n\nRéponds de manière concise et utile en français.`;

        // Format history for the model
        const historyText = history?.map((h: any) => `${h.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${h.content}`).join('\n') || '';

        const prompt = `${systemContext}\n\nHistorique de la conversation:\n${historyText}\n\nUtilisateur: ${message}\n\nAssistant:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiResponse = response.text();

        return {
            statusCode: 200,
            body: JSON.stringify({ response: aiResponse }),
        };
    } catch (error) {
        console.error('Error in AI chat:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erreur lors de la génération de la réponse' }),
        };
    }
};
