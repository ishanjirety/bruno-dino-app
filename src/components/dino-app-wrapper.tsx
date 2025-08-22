import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import * as React from "react";
import * as THREE from "three";
import DinoApp from "./dino-app";

export default function DinoAppWrapper() {
  const [points, setPoints] = React.useState(0);
  const [contextLost, setContextLost] = React.useState(false);
  const [key, setKey] = React.useState(0); // Force re-render on context loss

  const handleCanvasCreated = (state: { gl: THREE.WebGLRenderer }) => {
    const gl = state.gl;

    // Handle WebGL context loss
    const handleContextLoss = (event: Event) => {
      event.preventDefault();
      console.log("WebGL context lost. Attempting to restore...");
      setContextLost(true);
    };

    // Handle WebGL context restoration
    const handleContextRestored = () => {
      console.log("WebGL context restored successfully");
      setContextLost(false);
      // Force re-render to ensure everything is properly initialized
      setKey((prev) => prev + 1);
    };

    gl.domElement.addEventListener("webglcontextlost", handleContextLoss);
    gl.domElement.addEventListener(
      "webglcontextrestored",
      handleContextRestored
    );

    // Cleanup listeners when component unmounts
    return () => {
      gl.domElement.removeEventListener("webglcontextlost", handleContextLoss);
      gl.domElement.removeEventListener(
        "webglcontextrestored",
        handleContextRestored
      );
    };
  };

  const handleCanvasError = (event: React.SyntheticEvent) => {
    console.error("Canvas error:", event);
    setContextLost(true);
  };

  // Reset game state when context is restored
  React.useEffect(() => {
    if (!contextLost) {
      setPoints(0);
    }
  }, [contextLost]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{}}>
        <h1>Points: {points}</h1>
        {contextLost && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(0,0,0,0.8)",
              color: "white",
              padding: "20px",
              borderRadius: "8px",
              zIndex: 1000,
              textAlign: "center",
            }}
          >
            <p>WebGL context lost.</p>
            <button
              onClick={() => {
                setContextLost(false);
                setKey((prev) => prev + 1);
              }}
              style={{
                background: "#4CAF50",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "10px",
              }}
            >
              Restart Game
            </button>
          </div>
        )}
      </div>
      <React.Suspense fallback={<div>Loading...</div>}>
        <Canvas
          key={key} // Force re-render when context is restored
          gl={{
            preserveDrawingBuffer: false, // Changed to false for better performance
            powerPreference: "high-performance",
            antialias: true,
            alpha: false,
            failIfMajorPerformanceCaveat: false,
            stencil: false,
            depth: true,
          }}
          style={{
            width: window.innerWidth / 2,
            height: window.innerHeight / 2,
          }}
          onCreated={handleCanvasCreated}
          onError={handleCanvasError}
        >
          <Physics gravity={[0, -9.81, 0]}>
            <DinoApp points={points} onPointsChange={setPoints} />
          </Physics>
        </Canvas>
      </React.Suspense>
    </div>
  );
}
