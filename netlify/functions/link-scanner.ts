import { Handler } from '@netlify/functions';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyA9OUUnxAZIoLYaktoAhqswcLK7gebVFWY');

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { url } = JSON.parse(event.body || '{}');

        if (!url) {
            return { statusCode: 400, body: JSON.stringify({ error: 'URL is required' }) };
        }

        // Add protocol if missing
        const targetUrl = url.startsWith('http') ? url : `https://${url}`;

        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; LinkScanner/1.0; +http://localhost:5173)'
            }
        });
        const html = await response.text();
        const $ = cheerio.load(html);

        // 1. Extract Metadata
        const title = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
        const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content');
        const image = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
        const keywords = $('meta[name="keywords"]').attr('content');
        const author = $('meta[name="author"]').attr('content');
        const themeColor = $('meta[name="theme-color"]').attr('content');

        // 2. Intelligent Content Extraction for AI
        $('script, style, noscript, iframe, svg, nav, footer, header, form, button').remove();
        let textContent = $('body').text().replace(/\s+/g, ' ').trim();

        // Truncate for AI context window (keep first 10k chars which is usually enough for summary)
        const aiContext = textContent.substring(0, 10000);

        // Generate AI Summary
        let aiSummary = null;
        try {
            const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });
            const prompt = `Parle-moi du site ${targetUrl}. Voici le contenu extrait de ce site: ${aiContext}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            aiSummary = response.text();
        } catch (aiError) {
            console.error('AI Summary failed:', aiError);
            aiSummary = "L'analyse IA n'a pas pu être générée.";
        }

        // Fallback description logic (if AI fails or for standard description field)
        let finalDescription = description;
        if (!finalDescription) {
            if (textContent.length > 300) {
                finalDescription = textContent.substring(0, 300) + '...';
            } else if (textContent.length > 0) {
                finalDescription = textContent;
            } else {
                const htmlContent = html.toLowerCase();
                if (htmlContent.includes('react') || htmlContent.includes('vite')) {
                    finalDescription = "Application Web (SPA) - Contenu dynamique.";
                } else {
                    finalDescription = "Aucun contenu textuel significatif trouvé.";
                }
            }
        }

        // 3. Security Headers & Scoring
        const headers = Object.fromEntries(response.headers.entries());
        const securityHeaders = {
            'Strict-Transport-Security': headers['strict-transport-security'] || 'Missing',
            'Content-Security-Policy': headers['content-security-policy'] || 'Missing',
            'X-Frame-Options': headers['x-frame-options'] || 'Missing',
            'X-Content-Type-Options': headers['x-content-type-options'] || 'Missing',
            'Referrer-Policy': headers['referrer-policy'] || 'Missing',
            'Permissions-Policy': headers['permissions-policy'] || 'Missing',
        };

        // Calculate Security Score
        let score = 0;

        // Critical Security (Base 60)
        if (targetUrl.startsWith('https')) score += 20;
        if (securityHeaders['Strict-Transport-Security'] !== 'Missing') score += 20;
        if (securityHeaders['Content-Security-Policy'] !== 'Missing') score += 20;

        // Standard Security (Base 40)
        if (securityHeaders['X-Frame-Options'] !== 'Missing') score += 10;
        if (securityHeaders['X-Content-Type-Options'] !== 'Missing') score += 10;
        if (securityHeaders['Referrer-Policy'] !== 'Missing') score += 10;
        if (securityHeaders['Permissions-Policy'] !== 'Missing') score += 10;

        // Penalties
        if (headers['x-powered-by']) score -= 10; // Tech stack leak
        if (headers['server']) score -= 5;        // Server version leak
        if (headers['set-cookie']) score -= 10;   // Tracking/Session cookies

        // Clamp score 0-100
        score = Math.max(0, Math.min(100, score));

        // 4. Captcha/Bot Detection
        const lowerHtml = html.toLowerCase();
        const captchaKeywords = [
            'verify you are human',
            'attention required',
            'security check',
            'just a moment...',
            'cloudflare',
            'captcha',
            'robot',
            'challenge-form',
            'challenge-platform',
            'vérification de sécurité',
            'êtes-vous un robot',
            'verifying...'
        ];

        const isCaptcha = captchaKeywords.some(keyword =>
            title.toLowerCase().includes(keyword) ||
            lowerHtml.includes(keyword)
        );

        const data = {
            url: targetUrl,
            status: response.status,
            title: title || 'Sans titre',
            description: finalDescription,
            aiSummary: aiSummary,
            image: image || null,
            keywords: keywords || null,
            author: author || null,
            themeColor: themeColor || null,
            security: securityHeaders,
            server: headers['server'] || 'Unknown',
            contentType: headers['content-type'] || 'Unknown',
            size: html.length,
            isCaptcha: isCaptcha,
            securityScore: score
        };

        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error('Error scanning link:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Échec du scan', details: String(error) }),
        };
    }
};
