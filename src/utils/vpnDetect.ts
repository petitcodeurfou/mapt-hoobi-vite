// Détection VPN basique SANS API
// Efficacité: ~20-30% (limité mais gratuit et sans dépendance)

export async function detectVPN(): Promise<{
    suspicious: boolean;
    reasons: string[];
    confidence: 'low' | 'medium' | 'high';
}> {
    const reasons: string[] = [];

    // 1. Détection WebRTC Leak
    try {
        const webrtcIP = await getWebRTCIP();
        if (webrtcIP && webrtcIP.startsWith('10.') ||
            webrtcIP?.startsWith('192.168.') ||
            webrtcIP?.startsWith('172.')) {
            // IP privée détectée via WebRTC = potentiel VPN
            reasons.push('WebRTC leak detected');
        }
    } catch (e) {
        // WebRTC bloqué = souvent un VPN ou extension privacy
        reasons.push('WebRTC blocked');
    }

    // 2. Détection Timezone vs Langue
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;

    // Exemple: Timezone "America/New_York" mais langue "fr-FR" = suspect
    if (timezone.includes('America') && language.startsWith('fr')) {
        reasons.push('Timezone/Language mismatch');
    }
    if (timezone.includes('Europe') && language.startsWith('zh')) {
        reasons.push('Timezone/Language mismatch');
    }

    // 3. Détection de connexion lente (VPN = latence)
    const latency = await measureLatency();
    if (latency > 500) {
        reasons.push('High latency detected');
    }

    // 4. Nombre de plugins/extensions suspect
    if (navigator.plugins.length === 0) {
        reasons.push('No plugins (privacy mode)');
    }

    // Calcul du niveau de suspicion
    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (reasons.length >= 3) confidence = 'high';
    else if (reasons.length >= 2) confidence = 'medium';

    return {
        suspicious: reasons.length >= 2,
        reasons,
        confidence
    };
}

// Récupère l'IP via WebRTC
async function getWebRTCIP(): Promise<string | null> {
    return new Promise((resolve) => {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel('');

        pc.onicecandidate = (e) => {
            if (!e.candidate) return;
            const match = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
            if (match) {
                resolve(match[1]);
                pc.close();
            }
        };

        pc.createOffer().then(offer => pc.setLocalDescription(offer));

        // Timeout après 3s
        setTimeout(() => resolve(null), 3000);
    });
}

// Mesure la latence
async function measureLatency(): Promise<number> {
    const start = performance.now();
    try {
        await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' });
    } catch (e) {
        // Ignore errors
    }
    return performance.now() - start;
}
