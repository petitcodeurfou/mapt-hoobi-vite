// Détection VPN gratuite avec ip-api.com
// Limite: 45 requêtes/minute (suffisant pour un site normal)

export default async (req: Request) => {
    try {
        // Récupérer l'IP du visiteur depuis les headers Netlify
        const clientIP = req.headers.get('x-nf-client-connection-ip') 
            || req.headers.get('x-forwarded-for')?.split(',')[0]
            || '8.8.8.8'; // Fallback pour tests

        // Appeler ip-api.com (gratuit, pas de clé nécessaire)
        // Note: En production, utiliser HTTPS nécessite leur version payante
        // Mais depuis un serveur backend, HTTP est acceptable
        const response = await fetch(
            `http://ip-api.com/json/${clientIP}?fields=status,message,country,countryCode,city,isp,org,hosting,proxy,query`
        );

        const data = await response.json();

        if (data.status !== 'success') {
            return new Response(JSON.stringify({ 
                error: 'Could not check IP',
                isVPN: false 
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Détection VPN/Proxy
        const isVPN = data.hosting === true || data.proxy === true;

        return new Response(JSON.stringify({
            isVPN,
            isHosting: data.hosting,      // IP d'un datacenter (souvent VPN)
            isProxy: data.proxy,          // Proxy détecté
            country: data.country,
            countryCode: data.countryCode,
            city: data.city,
            isp: data.isp,
            org: data.org,
            ip: data.query
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ 
            error: error.message,
            isVPN: false 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
