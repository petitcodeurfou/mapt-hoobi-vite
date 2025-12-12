import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

function GradientSphere() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        // Slow, elegant rotation
        meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.05;
        meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.07;
    });

    return (
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
            <mesh ref={meshRef} scale={[1.5, 1.5, 1.5]}>
                <sphereGeometry args={[3, 64, 64]} />
                <meshPhysicalMaterial
                    color="#4c1d95" // Deep indigo/purple base
                    emissive="#2e1065"
                    emissiveIntensity={0.2}
                    roughness={0.1}
                    metalness={0.1}
                    clearcoat={0.8}
                    clearcoatRoughness={0.2}
                    transparent
                    opacity={0.6}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </Float>
    );
}

export function GhostScene() {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#a78bfa" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4c1d95" />

                <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />

                <GradientSphere />

                {/* Subtle fog for depth */}
                <fog attach="fog" args={['#1e1b4b', 5, 20]} />
            </Canvas>
        </div>
    );
}
