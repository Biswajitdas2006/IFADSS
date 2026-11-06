import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * FabricCanvas — Interactive Physical Soft Fabric Motion Scroll Experience
 * 
 * Simulates a continuous, large soft cloth sheet lying across the background.
 * When the user scrolls, the fabric bends, stretches, ripples, and settles
 * using second-order spring-damper physical inertia and custom GLSL vertex/fragment shaders.
 */
export default function FabricCanvas() {
  const mountRef = useRef(null);
  const [hasWebGL] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!hasWebGL) return;

    const container = mountRef.current;
    if (!container) return;

    // 2. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    // Perspective camera with subtle elevation angle for viewing fabric drape
    const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    camera.position.set(0, -0.15, 2.7);
    camera.lookAt(0, 0, 0);

    const fovRad = (camera.fov * Math.PI) / 180;
    const frustumHeight = 2.0 * camera.position.z * Math.tan(fovRad / 2);
    const frustumWidth = frustumHeight * aspect;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // Canvas styling
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100vw';
    renderer.domElement.style.height = '100vh';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.zIndex = '0';

    container.appendChild(renderer.domElement);

    // 3. High-resolution Fabric Plane Geometry (dynamically sized to frustum)
    const planeWidth = Math.max(6.0, frustumWidth * 1.4);
    const planeHeight = Math.max(4.5, frustumHeight * 1.4);
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 160, 160);

    // 4. Custom GLSL Shader for Physical Cloth Motion
    const vertexShader = `
      uniform float uTime;
      uniform float uScrollProgress;
      uniform float uVelocity;
      uniform float uTension;
      uniform float uWavePhase;
      uniform float uAspect;
      uniform float uReducedMotion;
      uniform vec2 uPointer;
      uniform float uPointerSpeed;
      uniform float uPointerActive;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vElevation;
      varying float vSheen;

      // Soft non-linear fold profile: creates smooth cloth creases with flat troughs
      float clothFold(float p, float sharpness) {
        float s = sin(p);
        return sign(s) * pow(abs(s), sharpness);
      }

      // Height evaluation function for any (x, y) point on the cloth
      float getFabricHeight(vec2 p, vec2 rawPos) {
        if (uReducedMotion > 0.5) {
          // Static serene drape when user prefers reduced motion
          return sin(p.x * 2.0 + p.y * 1.5) * 0.06 + cos(p.x * 3.2 - p.y * 2.0) * 0.03;
        }

        // 1. Resting elegant drape: large, heavy soft diagonal folds
        float restFold1 = sin(p.x * 2.2 + p.y * 1.3 + uTime * 0.2) * 0.07;
        float restFold2 = cos(p.x * 3.5 - p.y * 1.9 + 1.1) * 0.04;
        float restFold3 = sin(p.y * 2.8 - uTime * 0.15) * 0.03;
        float restingDrape = (restFold1 + restFold2 + restFold3) * (1.0 - uTension * 0.5);

        // 2. Dynamic Scroll Drag Waves:
        // Physical ripples travel along the pull vector (Y axis)
        float dragFreqY = 4.2 + uTension * 3.0;
        float dragFreqX = 2.4;

        // Organic curved wave fronts across the cloth
        float waveOffset = sin(p.x * dragFreqX + uWavePhase * 0.35) * 0.42;
        float primaryWave = clothFold(p.y * dragFreqY + uWavePhase + waveOffset, 1.25);

        // Secondary harmonic: fine soft ripples along fold edges
        float microFold = sin((p.y * 7.5 - p.x * 3.5) + uWavePhase * 1.4) * 0.28;

        // Velocity & tension modulate wave amplitude
        float dynamicAmplitude = (abs(uVelocity) * 0.032 + uTension * 0.075);
        dynamicAmplitude = min(0.28, dynamicAmplitude);

        float dynamicWaves = (primaryWave + microFold * (0.35 + uTension * 0.45)) * dynamicAmplitude;

        // 3. Longitudinal Stretching & Lateral Tension (Poisson's effect in cloth)
        float stretchDip = -uTension * 0.055 * (1.0 - min(1.0, p.x * p.x * 0.6));

        // 4. Interactive Cursor Drag & Ripple Effect (identical physical behavior to scrolling)
        float pointerDist = length(rawPos - uPointer);
        float cursorDent = exp(-pointerDist * pointerDist * 2.5) * (0.04 + uPointerSpeed * 0.08);
        float cursorWave = sin(pointerDist * 9.0 - uTime * 4.5) * exp(-pointerDist * 1.5) * (uPointerSpeed * 0.1);
        cursorWave = clamp(cursorWave, -0.15, 0.15);
        float cursorDeformation = (-cursorDent + cursorWave) * uPointerActive;

        return restingDrape + dynamicWaves + stretchDip + cursorDeformation;
      }

      void main() {
        vUv = uv;
        vec3 pos = position;

        vec2 p = vec2(pos.x * uAspect, pos.y);

        // Calculate height
        float z = getFabricHeight(p, pos.xy);
        pos.z = z;
        vElevation = z;

        // Analytical Normal Calculation via finite differences
        float eps = 0.015;
        float zRight = getFabricHeight(vec2((pos.x + eps) * uAspect, pos.y), vec2(pos.x + eps, pos.y));
        float zUp    = getFabricHeight(vec2(pos.x * uAspect, pos.y + eps), vec2(pos.x, pos.y + eps));

        vec3 tangentX = vec3(eps, 0.0, zRight - z);
        vec3 tangentY = vec3(0.0, eps, zUp - z);
        vec3 computedNormal = normalize(cross(tangentX, tangentY));

        vNormal = normalize(normalMatrix * computedNormal);

        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;

        // View direction for Fresnel fiber sheen
        vec3 viewDir = normalize(cameraPosition - worldPos.xyz);
        vSheen = 1.0 - max(0.0, dot(vNormal, viewDir));

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

    const fragmentShader = `
      uniform vec3 uColorDark;
      uniform vec3 uColorForest;
      uniform vec3 uColorEmerald;
      uniform vec3 uColorSage;
      uniform vec3 uColorMint;
      uniform float uTension;
      uniform float uVelocity;
      uniform vec2 uResolution;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vElevation;
      varying float vSheen;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);

        // Directional Key Light from upper right
        vec3 lightDir = normalize(vec3(0.45, 0.65, 0.75));
        vec3 fillLightDir = normalize(vec3(-0.45, -0.3, 0.5));

        // Diffuse Lighting with soft wrap (subsurface light transmission in textile fibers)
        float wrap = 0.35;
        float diffKey = max(0.0, (dot(normal, lightDir) + wrap) / (1.0 + wrap));
        float diffFill = max(0.0, (dot(normal, fillLightDir) + wrap) / (1.0 + wrap));

        // Ambient Occlusion in the fold creases / valleys
        float ao = smoothstep(-0.22, 0.14, vElevation);
        ao = mix(0.58, 1.0, ao);

        // Specular Charlie / Sheen falloff (mimics fine microfiber / silk reflection)
        float sheenFresnel = pow(vSheen, 2.3);

        vec3 halfVec = normalize(lightDir + viewDir);
        float NdotH = max(0.0, dot(normal, halfVec));
        float specularSheen = pow(NdotH, 16.0) * (0.35 + uTension * 0.45);

        // IFAADS Palette Gradation:
        // Deep forest base
        vec3 baseColor = mix(uColorDark, uColorForest, diffKey);
        // Emerald vibrancy along illuminated fold slopes
        baseColor = mix(baseColor, uColorEmerald, diffKey * 0.7 + diffFill * 0.2);
        // Pool shadow in fold valleys
        baseColor *= ao;

        // Soft Sage highlight at grazing edges
        vec3 clothColor = mix(baseColor, uColorSage, sheenFresnel * 0.42);

        // Mint luminous sheen on fold peaks
        clothColor += uColorMint * (specularSheen * 0.65 + sheenFresnel * 0.16);

        // Micro-weave texture: ultra-fine thread matrix for authentic fabric feel
        float microWeave = sin(gl_FragCoord.x * 0.8) * cos(gl_FragCoord.y * 0.8) * 0.022;
        clothColor += microWeave;

        // Edge vignette: gently frames content in the center
        vec2 screenUv = gl_FragCoord.xy / uResolution;
        float vignette = smoothstep(1.35, 0.45, length((screenUv - 0.5) * vec2(1.2, 1.0)));
        clothColor = mix(uColorDark * 0.8, clothColor, vignette);

        gl_FragColor = vec4(clothColor, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uScrollProgress: { value: 0 },
        uVelocity: { value: 0 },
        uTension: { value: 0 },
        uWavePhase: { value: 0 },
        uAspect: { value: aspect },
        uResolution: { value: new THREE.Vector2(width, height) },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uPointerSpeed: { value: 0 },
        uPointerActive: { value: 0 },
        uReducedMotion: {
          value: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1.0 : 0.0,
        },
        uColorDark: { value: new THREE.Color('#031813') },
        uColorForest: { value: new THREE.Color('#075b48') },
        uColorEmerald: { value: new THREE.Color('#16856b') },
        uColorSage: { value: new THREE.Color('#a9cfc1') },
        uColorMint: { value: new THREE.Color('#e8f3ee') },
      },
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 5. Physics & Spring-Damper Inertia Engine (Scroll + Cursor Drag)
    let scrollVelocity = 0;
    let smoothedVelocity = 0;
    let fabricTension = 0;
    let wavePhase = 0;
    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();
    let scrollProgress = 0;

    // Interactive pointer state
    let pointerPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let lastPointerTime = performance.now();
    let pointerVelocity = { x: 0, y: 0 };
    let smoothedPointerSpeed = 0;
    let pointerActive = 0;

    const handleScroll = () => {
      const now = performance.now();
      const currentScrollY = window.scrollY;
      const dt = Math.max(8, Math.min(64, now - lastScrollTime)) / 1000;

      const rawDeltaY = currentScrollY - lastScrollY;
      const instantVelocity = rawDeltaY / (dt * 1000); // px per ms

      // Inject directional velocity impulse into the fabric cloth
      scrollVelocity += instantVelocity * 0.42;
      // Clamp maximum impulse to maintain physical believability
      scrollVelocity = Math.max(-10, Math.min(10, scrollVelocity));

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = docHeight > 0 ? Math.min(1, Math.max(0, currentScrollY / docHeight)) : 0;

      lastScrollY = currentScrollY;
      lastScrollTime = now;
    };

    const handlePointerMove = (e) => {
      pointerActive = 1;
      const now = performance.now();
      const dt = Math.max(8, Math.min(64, now - lastPointerTime)) / 1000;

      const dx = e.clientX - pointerPos.x;
      const dy = e.clientY - pointerPos.y;
      const instantSpeed = Math.min(10, Math.sqrt(dx * dx + dy * dy) / (dt * 1000));

      // Moving cursor also excites the fabric waves and spring-damper motion
      scrollVelocity += (dy * 0.12) + (Math.sign(dy || dx) * instantSpeed * 0.16);
      scrollVelocity = Math.max(-10, Math.min(10, scrollVelocity));

      pointerVelocity.x = dx;
      pointerVelocity.y = dy;

      // Project screen coordinates into Three.js plane world coordinates at z=0
      const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;

      const fovRad = (camera.fov * Math.PI) / 180;
      const frustumH = 2.0 * camera.position.z * Math.tan(fovRad / 2);
      const frustumW = frustumH * (window.innerWidth / window.innerHeight);

      material.uniforms.uPointer.value.set(
        (ndcX * frustumW) / 2,
        (ndcY * frustumH) / 2
      );

      pointerPos.x = e.clientX;
      pointerPos.y = e.clientY;
      lastPointerTime = now;
    };

    const handlePointerLeave = () => {
      pointerActive = 0;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);

    // Handle Reduced Motion changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e) => {
      material.uniforms.uReducedMotion.value = e.matches ? 1.0 : 0.0;
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    // Resize Handler
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      const newAspect = newWidth / newHeight;

      camera.aspect = newAspect;
      camera.updateProjectionMatrix();

      renderer.setSize(newWidth, newHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      material.uniforms.uAspect.value = newAspect;
      material.uniforms.uResolution.value.set(newWidth, newHeight);

      const newFrustumHeight = 2.0 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
      const newFrustumWidth = newFrustumHeight * newAspect;
      mesh.scale.set(
        Math.max(1.0, (newFrustumWidth * 1.4) / planeWidth),
        Math.max(1.0, (newFrustumHeight * 1.4) / planeHeight),
        1
      );
    };

    window.addEventListener('resize', handleResize);

    // 6. Animation & Physical ODE Update Loop
    let animationFrameId = null;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Second-order spring-damper physical integration:
      // High-velocity drag causes traveling waves; when scroll/cursor stops,
      // damper smoothly bleeds energy and fabric settles gently back to rest.
      const dampingFactor = 0.89; // Energy dissipation
      scrollVelocity *= dampingFactor;

      // Smoothed velocity follows with spring response
      smoothedVelocity += (scrollVelocity - smoothedVelocity) * 0.16;

      // Tension stretches cloth when pulled vigorously
      const targetTension = Math.min(1.0, Math.abs(smoothedVelocity) * 0.14);
      fabricTension += (targetTension - fabricTension) * 0.12;

      // Wave phase travels along the fabric proportional to velocity
      wavePhase += smoothedVelocity * 0.016;

      // Pointer velocity spring-damper decay
      const targetSpeed = pointerActive * Math.min(1.0, Math.sqrt(pointerVelocity.x * pointerVelocity.x + pointerVelocity.y * pointerVelocity.y) * 0.06);
      smoothedPointerSpeed += (targetSpeed - smoothedPointerSpeed) * 0.18;
      smoothedPointerSpeed *= 0.92;
      pointerVelocity.x *= 0.88;
      pointerVelocity.y *= 0.88;

      // Feed into GPU Shader Uniforms
      material.uniforms.uTime.value = elapsedTime;
      material.uniforms.uScrollProgress.value = scrollProgress;
      material.uniforms.uVelocity.value = smoothedVelocity;
      material.uniforms.uTension.value = fabricTension;
      material.uniforms.uWavePhase.value = wavePhase;
      material.uniforms.uPointerSpeed.value = smoothedPointerSpeed;
      material.uniforms.uPointerActive.value = pointerActive;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 7. Cleanup on unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', handleMotionChange);

      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (!hasWebGL) {
    // Graceful static CSS fabric fallback if WebGL is unavailable
    return (
      <div
        className="fabric-static-fallback"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 20%, #0e6e56 0%, #075b48 40%, #031813 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        aria-hidden="true"
      />
    );
  }

  return <div ref={mountRef} className="fabric-motion-container" aria-hidden="true" />;
}
