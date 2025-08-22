import { useCylinder } from "@react-three/cannon";
import React from "react";

export function Obstacle({
  position,
  onCollide,
}: {
  position: [number, number, number];
  onCollide: () => void;
}) {
  const [ref, api] = useCylinder(() => ({
    mass: 0,
    position,
    args: [0.3, 0.3, 3, 8],
    material: { friction: 0.1 },
    onCollide,
  }));

  React.useEffect(() => {
    api.position.set(position[0], position[1], position[2]);
  }, [position, api]);

  return (
    <mesh ref={ref} castShadow>
      <cylinderGeometry args={[0.3, 0.3, 3, 8]} />
      <meshStandardMaterial color={0x228b22} />
    </mesh>
  );
}
