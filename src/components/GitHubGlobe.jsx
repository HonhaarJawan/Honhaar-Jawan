"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useThree, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";
import ThreeGlobe from "three-globe";

extend({ ThreeGlobe });

// Helper functions
const hexToRgb = (hex) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Generate random arc data with consistent color
const generateRandomArc = (color) => {
  const startLat = (Math.random() - 0.5) * 180;
  const startLng = (Math.random() - 0.5) * 360;
  const endLat = (Math.random() - 0.5) * 180;
  const endLng = (Math.random() - 0.5) * 360;

  return {
    order: Math.random(),
    startLat,
    startLng,
    endLat,
    endLng,
    arcAlt: Math.random() * 0.5 + 0.1,
    color,
  };
};

// Globe constants
const RING_PROPAGATION_SPEED = 3;
const cameraZ = 300;
const EARTH_TEXTURE_URL =
  "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";
const EARTH_BUMP_URL =
  "https://threejs.org/examples/textures/planets/earth_normal_2048.jpg";

// Globe Core Component
const GlobeCore = ({ globeConfig, data }) => {
  const globeRef = useRef(null);
  const groupRef = useRef();
  const [isInitialized, setIsInitialized] = useState(false);
  const [texture, setTexture] = useState(null);
  const [bumpMap, setBumpMap] = useState(null);

  const defaultProps = useMemo(
    () => ({
      pointSize: 1,
      atmosphereColor: "#ffffff",
      showAtmosphere: true,
      atmosphereAltitude: 0.1,
      globeColor: "#062056",
      emissive: "#062056",
      emissiveIntensity: 0.1,
      shininess: 0.9,
      arcTime: 1000,
      arcLength: 0.9,
      rings: 1,
      maxRings: 3,
      ...globeConfig,
    }),
    [globeConfig]
  );

  // Load Earth texture
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(EARTH_TEXTURE_URL, setTexture);
    loader.load(EARTH_BUMP_URL, setBumpMap);
  }, []);

  useEffect(() => {
    if (!globeRef.current && groupRef.current) {
      const globe = new ThreeGlobe();
      globeRef.current = globe;
      groupRef.current.add(globe);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!globeRef.current || !isInitialized || !texture || !bumpMap) return;

    const globeMaterial = globeRef.current.globeMaterial();
    globeMaterial.map = texture;
    globeMaterial.bumpMap = bumpMap;
    globeMaterial.bumpScale = 0.05;
    globeMaterial.specular = new THREE.Color(0x333333);
    globeMaterial.shininess = 5;
    globeMaterial.needsUpdate = true;
  }, [isInitialized, texture, bumpMap]);

  useEffect(() => {
    if (!globeRef.current || !isInitialized || !data) return;

    const points = data.flatMap((arc) => [
      {
        size: defaultProps.pointSize,
        order: arc.order,
        color: arc.color,
        lat: arc.startLat,
        lng: arc.startLng,
      },
      {
        size: defaultProps.pointSize,
        order: arc.order,
        color: arc.color,
        lat: arc.endLat,
        lng: arc.endLng,
      },
    ]);

    const filteredPoints = points.filter(
      (v, i, a) =>
        a.findIndex((v2) => v2.lat === v.lat && v2.lng === v.lng) === i
    );

    // Globe configuration
    globeRef.current
      .showAtmosphere(defaultProps.showAtmosphere)
      .atmosphereColor(defaultProps.atmosphereColor)
      .atmosphereAltitude(defaultProps.atmosphereAltitude);

    // Arcs configuration
    globeRef.current
      .arcsData(data)
      .arcStartLat((d) => d.startLat)
      .arcStartLng((d) => d.startLng)
      .arcEndLat((d) => d.endLat)
      .arcEndLng((d) => d.endLng)
      .arcColor((e) => e.color)
      .arcAltitude((e) => e.arcAlt || 0.1)
      .arcDashLength(defaultProps.arcLength)
      .arcDashInitialGap((e) => e.order)
      .arcDashGap(15)
      .arcDashAnimateTime(() => defaultProps.arcTime);

    // Points configuration
    globeRef.current
      .pointsData(filteredPoints)
      .pointColor((e) => e.color)
      .pointsMerge(true)
      .pointAltitude(0.0)
      .pointRadius(2);

    // Rings configuration
    globeRef.current
      .ringsData([])
      .ringColor((e) => e.color)
      .ringMaxRadius(defaultProps.maxRings)
      .ringPropagationSpeed(RING_PROPAGATION_SPEED)
      .ringRepeatPeriod(
        (defaultProps.arcTime * defaultProps.arcLength) / defaultProps.rings
      );
  }, [isInitialized, data, defaultProps]);

  useEffect(() => {
    if (!globeRef.current || !isInitialized || !data) return;

    const interval = setInterval(() => {
      if (data.length === 0) return;

      // Select random points for rings
      const ringCount = Math.min(3, data.length);
      const ringsData = [];

      for (let i = 0; i < ringCount; i++) {
        const idx = Math.floor(Math.random() * data.length);
        ringsData.push({
          lat: data[idx].startLat,
          lng: data[idx].startLng,
          color: data[idx].color,
        });
      }

      globeRef.current.ringsData(ringsData);
    }, 2000);

    return () => clearInterval(interval);
  }, [isInitialized, data]);

  return <group ref={groupRef} />;
};

// WebGL Renderer Configuration
const WebGLRendererConfig = () => {
  const { gl, size } = useThree();

  useEffect(() => {
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio
    gl.setSize(size.width, size.height);
    gl.setClearColor(0x000011, 1);
  }, [gl, size]);

  return null;
};

// World Component (Canvas Wrapper)
const World = ({ globeConfig, data }) => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000022, 400, 2000);

  return (
    <Canvas
      scene={scene}
      camera={new THREE.PerspectiveCamera(50, 1.2, 180, 1800)}
      gl={{ antialias: false }} // Disable antialias for performance
    >
      <WebGLRendererConfig />
      <ambientLight color={globeConfig.ambientLight} intensity={0.6} />
      <directionalLight
        color={globeConfig.directionalLeftLight}
        position={new THREE.Vector3(-400, 100, 400)}
        intensity={0.8}
      />
      <directionalLight
        color={globeConfig.directionalTopLight}
        position={new THREE.Vector3(-200, 500, 200)}
        intensity={0.5}
      />
      <pointLight
        color={globeConfig.pointLight}
        position={new THREE.Vector3(-200, 500, 200)}
        intensity={0.4}
        distance={1000}
      />
      <GlobeCore globeConfig={globeConfig} data={data} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minDistance={cameraZ}
        maxDistance={cameraZ}
        autoRotateSpeed={0.8}
        autoRotate={true}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI - Math.PI / 3}
      />
    </Canvas>
  );
};

// Main GitHub Globe Component
export const GitHubGlobe = () => {
  const [mounted, setMounted] = useState(false);
  const [arcs, setArcs] = useState([]);

  // Consistent color for all arcs
  const arcColor = "#9c9cff";

  useEffect(() => {
    setMounted(true);

    // Initial arcs
    const initialArcs = Array(10)
      .fill()
      .map(() => generateRandomArc(arcColor));
    setArcs(initialArcs);

    // Generate new arcs every 5 seconds
    const interval = setInterval(() => {
      setArcs((prev) => {
        const newArcs = Array(5)
          .fill()
          .map(() => generateRandomArc(arcColor));
        // Keep only last 30 arcs for performance
        return [...prev.slice(-25), ...newArcs];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Globe configuration
  const globeConfig = useMemo(
    () => ({
      pointSize: 2,
      globeColor: "#062056",
      showAtmosphere: true,
      atmosphereColor: "#FFFFFF",
      atmosphereAltitude: 0.15,
      emissive: "#062056",
      emissiveIntensity: 0.1,
      shininess: 0.9,
      ambientLight: "#38bdf8",
      directionalLeftLight: "#ffffff",
      directionalTopLight: "#ffffff",
      pointLight: "#ffffff",
      arcTime: 1500,
      arcLength: 0.85,
      rings: 1,
      maxRings: 2.5,
      autoRotate: true,
      autoRotateSpeed: 0.6,
    }),
    []
  );

  return (
    <div className="flex flex-row items-center justify-center py-20 h-screen md:h-auto dark:bg-black bg-white relative w-full">
      <div className="max-w-7xl mx-auto w-full relative overflow-hidden h-full md:h-[40rem] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-50"
        >
          <h2 className="text-center text-xl md:text-4xl font-bold text-black dark:text-white">
            Global Connections
          </h2>
          <p className="text-center text-base md:text-lg font-normal text-neutral-700 dark:text-neutral-200 max-w-md mt-2 mx-auto">
            Interactive visualization of worldwide connections
          </p>
        </motion.div>

        <div className="absolute w-full bottom-0 inset-x-0 h-40 bg-gradient-to-b pointer-events-none select-none from-transparent dark:to-black to-white z-40" />

        <div className="absolute w-full -bottom-20 h-72 md:h-full z-10">
          {mounted && <World globeConfig={globeConfig} data={arcs} />}
        </div>
      </div>
    </div>
  );
};
