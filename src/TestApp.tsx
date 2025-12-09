import { useState, useEffect } from 'react';

export default function TestApp() {
    const [ping, setPing] = useState('Checking server...');

    useEffect(() => {
        fetch('/.netlify/functions/ping')
            .then(res => res.text())
            .then(txt => setPing(`Server Response: ${txt}`))
            .catch(err => setPing(`Server Error: ${err.message}`));
    }, []);

    return (
        <div style={{
            backgroundColor: 'black',
            color: '#00ff00',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'monospace',
            fontSize: '24px'
        }}>
            <h1>SYSTEM DIAGNOSTIC</h1>
            <p>React Status: OPERATIONAL</p>
            <p>{ping}</p>
            <p style={{ color: 'white', marginTop: '20px', fontSize: '16px' }}>
                If you can read this, the white screen is gone.
            </p>
        </div>
    );
}
