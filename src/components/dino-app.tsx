import { useFrame, useThree } from "@react-three/fiber";
import { useBox, usePlane } from "@react-three/cannon";
import * as React from "react";
import * as THREE from "three";
import { Obstacle } from "./obstacle";
import { useGLTF } from "@react-three/drei";

type TObstacle = {
  id: number;
  x: number;
  y: number;
};

const GAME_SPEED = 0.05;
const JUMP_VELOCITY = 7.5;

export default function DinoApp({
  onPointsChange,
  points,
}: {
  onPointsChange: React.Dispatch<React.SetStateAction<number>>;
  points: number;
}) {
  const gl = useThree();
  const { scene: dino, animations } = useGLTF("/baby_dino.glb");

  dino.scale.set(0.003, 0.003, 0.003);
  dino.rotation.set(0, -1, 0);

  const [obstacles, setObstacles] = React.useState<TObstacle[]>([]);

  const [gameOver, setGameOver] = React.useState(false);
  const [isJumping, setIsJumping] = React.useState(false);

  const memoizedDino = React.useMemo(() => dino, [dino]);
  const mixerRef = React.useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = React.useRef<THREE.AnimationAction[]>([]);

  const obstacleIdRef = React.useRef(0);

  const [dinoRef, dinoApi] = useBox(() => ({
    mass: 1,
    position: [-5, 1, 0],
    args: [0.8, 1.2, 0.8],
  }));

  const [groundRef] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -2, 0],
    material: { friction: 0.5 },
  }));

  const handleJump = () => {
    if (!isJumping && !gameOver) {
      dinoApi.velocity.set(0, JUMP_VELOCITY, 0);

      setIsJumping(true);
    }
  };

  React.useEffect(() => {
    if (animations && animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(dino);

      actionsRef.current = animations.map((clip) => {
        const action = mixerRef.current!.clipAction(clip);
        return action;
      });

      if (actionsRef.current[0]) {
        actionsRef.current[0].play();
      }
    }
  }, [animations, dino]);

  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        if (gameOver) {
          setGameOver(false);
          setIsJumping(false);
          onPointsChange(0);
          setObstacles([]);
        } else {
          handleJump();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isJumping, gameOver]);

  useFrame(() => {
    if (gameOver) {
      actionsRef.current[0].stop();
      return;
    }

    dinoApi.position.subscribe((position) => {
      if (position[1] <= 0.6) {
        setIsJumping(false);
        dinoApi.rotation.set(0, 0, 0);
      }
    });

    setObstacles((prevObstacles) => {
      const updatedObstacles = prevObstacles
        .map((obstacle) => ({
          ...obstacle,
          x: obstacle.x - GAME_SPEED,
        }))
        .filter((obstacle) => obstacle.x > -10);

      return updatedObstacles;
    });

    onPointsChange((prev) => prev + 1);
  });

  React.useEffect(() => {
    gl.scene.background = new THREE.Color(0x87ceeb);
  }, [gl.scene]);

  const spawnObstacle = React.useCallback(() => {
    if (gameOver) return;

    const newObstacle: TObstacle = {
      id: obstacleIdRef.current++,
      x: 15,
      y: 0,
    };

    setObstacles((prev) => [...prev, newObstacle]);
    console.log("Adding obstacle", newObstacle);
  }, [gameOver]);

  React.useEffect(() => {
    if (gameOver) return;

    spawnObstacle();

    const interval = setInterval(spawnObstacle, 2000);

    return () => clearInterval(interval);
  }, [gameOver, spawnObstacle]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <mesh ref={groundRef} receiveShadow>
        <planeGeometry args={[50, 10]} />
        <meshStandardMaterial color={0x8fbc8f} />
      </mesh>

      <mesh ref={dinoRef} castShadow onClick={handleJump}>
        <primitive object={memoizedDino} scale={0.01} />
      </mesh>
      {obstacles.map((obstacle) => (
        <Obstacle
          key={obstacle.id}
          position={[obstacle.x, obstacle.y, 0]}
          onCollide={() => {
            if (!gameOver) {
              setGameOver(true);
              console.log("Game Over! Score:", points);
            }
          }}
        />
      ))}
    </>
  );
}
