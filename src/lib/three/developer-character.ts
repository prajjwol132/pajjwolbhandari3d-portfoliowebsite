import {
  BoxGeometry, BufferGeometry, CapsuleGeometry, CatmullRomCurve3, CanvasTexture, ExtrudeGeometry, Float32BufferAttribute, Group,
  LatheGeometry, Mesh, MeshStandardMaterial, Path, Quaternion, RepeatWrapping, Shape, ShapeGeometry, SRGBColorSpace,
  SphereGeometry, TubeGeometry, Vector2, Vector3,
  type Material,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type Point = [number, number, number];

export interface DeveloperRig {
  root: Group;
  head: Group;
  eyes: Group[];
  dispose: () => void;
}

/** A complete, independently articulated model, not a camera-facing photograph. */
export function createDeveloperCharacter(): DeveloperRig {
  const root = new Group();
  root.name = "Prajjwol character";
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const geometry = <T extends BufferGeometry>(value: T) => { geometries.add(value); return value; };
  const material = (color: string, roughness = 0.65, metalness = 0) => {
    const value = new MeshStandardMaterial({ color, roughness, metalness });
    materials.add(value);
    return value;
  };
  const skin = material("#ad7353", 0.66);
  const skinLight = material("#b47a59", 0.66);
  const earInner = material("#9e5939");
  const hair = material("#171617", 0.52);
  const hairHighlight = material("#252326", 0.57);
  const jacket = material("#ffffff", 0.93);
  const lapel = material("#d1c8b8", 0.93);
  const fabric = document.createElement("canvas");
  fabric.width = fabric.height = 256;
  const brush = fabric.getContext("2d");
  if (brush) {
    brush.fillStyle = "#756c55"; brush.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 256; i += 64) {
      brush.fillStyle = "#867761";
      brush.fillRect(i, 0, 22, 256); brush.fillRect(0, i, 256, 22);
      brush.fillStyle = "#9f896e";
      brush.fillRect(i + 7, 0, 3, 256); brush.fillRect(0, i + 7, 256, 3);
      brush.fillStyle = "#544f43";
      brush.fillRect(i + 30, 0, 2, 256); brush.fillRect(0, i + 30, 256, 2);
    }
  }
  const plaid = new CanvasTexture(fabric);
  plaid.colorSpace = SRGBColorSpace;
  plaid.wrapS = plaid.wrapT = RepeatWrapping;
  plaid.repeat.set(2, 2);
  jacket.map = lapel.map = plaid;
  const white = material("#ffffff", 0.78);
  const trousers = material("#ecece7", 0.85);
  const yellow = material("#ffd60a", 0.4);
  yellow.toneMapped = false;
  const sole = material("#493c31", 0.8);
  const leather = material("#8f5732", 0.63);
  const frame = material("#222324", 0.3, 0.3);
  const iris = material("#3f261c", 0.38);
  const black = material("#111113", 0.42);
  const mouth = material("#6a352d", 0.68);
  const silver = material("#c4c6c7", 0.25, 0.8);
  const lens = material("#332b36", 0.24, 0.2);
  const sphere = geometry(new SphereGeometry(1, 32, 24));
  const box = geometry(new RoundedBoxGeometry(1, 1, 1, 3, 0.13));
  const cube = geometry(new BoxGeometry(1, 1, 1));

  function mesh(parent: Group, geo: BufferGeometry, mat: Material, position: Point, scale: Point = [1, 1, 1]) {
    const item = new Mesh(geo, mat);
    item.position.set(...position);
    item.scale.set(...scale);
    item.castShadow = true;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }
  const ellipsoid = (parent: Group, mat: Material, position: Point, scale: Point) => mesh(parent, sphere, mat, position, scale);
  const rounded = (parent: Group, mat: Material, position: Point, scale: Point) => mesh(parent, box, mat, position, scale);
  function limb(parent: Group, mat: Material, a: Point, b: Point, radius: number, depth = 1) {
    const from = new Vector3(...a), to = new Vector3(...b);
    const length = from.distanceTo(to);
    const part = mesh(parent, geometry(new CapsuleGeometry(radius, Math.max(0.001, length - radius * 2), 6, 16)), mat,
      from.add(to).multiplyScalar(0.5).toArray() as Point, [1, 1, depth]);
    part.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...b).sub(new Vector3(...a)).normalize());
    return part;
  }
  function curve(parent: Group, mat: Material, points: Point[], radius: number) {
    return mesh(parent, geometry(new TubeGeometry(new CatmullRomCurve3(points.map(p => new Vector3(...p))), 20, radius, 8, false)), mat, [0, 0, 0]);
  }

  // The chair and pose are built in full 3D so side and rear views remain complete.
  rounded(root, yellow, [0, 1.02, 0.15], [1.3, 0.22, 1.18]);
  const chairBack = rounded(root, yellow, [0, 1.48, -0.32], [1.27, 1.1, 0.2]);
  chairBack.rotation.x = -0.13;
  for (const side of [-1, 1]) {
    rounded(root, yellow, [side * 0.6, 1.3, 0.17], [0.13, 0.46, 0.96]);
    limb(root, frame, [side * 0.44, 0.98, -0.25], [side * 0.64, 0.06, -0.43], 0.047);
    limb(root, frame, [side * 0.43, 0.98, 0.52], [side * 0.63, 0.06, 0.72], 0.047);
    limb(root, frame, [side * 0.55, 0.24, 0.59], [-side * 0.45, 0.82, -0.2], 0.013);
  }
  ellipsoid(root, jacket, [0, 1.48, 0], [0.46, 0.6, 0.27]);
  rounded(root, trousers, [0, 1.12, 0.21], [0.8, 0.29, 0.68]);
  ellipsoid(root, white, [0, 1.53, 0.231], [0.258, 0.47, 0.06]);
  limb(root, skin, [0, 1.94, 0.01], [0, 2.28, 0.015], 0.16);
  for (const side of [-1, 1]) {
    const collar = rounded(root, lapel, [side * 0.21, 1.88, 0.25], [0.19, 0.37, 0.065]);
    collar.rotation.z = side * -0.4;
    const front = rounded(root, jacket, [side * 0.30, 1.47, 0.255], [0.19, 0.7, 0.07]);
    front.rotation.z = side * -0.1;
    rounded(root, lapel, [side * 0.34, 1.64, 0.303], [0.13, 0.02, 0.016]);
    ellipsoid(root, jacket, [side * 0.4, 1.83, -0.01], [0.2, 0.22, 0.23]);
  }
  for (let i = 0; i < 3; i++) ellipsoid(root, silver, [0.25, 1.7 - i * 0.18, 0.30], [0.012, 0.012, 0.009]);
  limb(root, jacket, [-0.39, 1.85, 0], [-0.53, 1.43, 0.28], 0.175);
  limb(root, jacket, [-0.53, 1.43, 0.28], [-0.3, 1.27, 0.6], 0.146);
  limb(root, jacket, [0.39, 1.85, 0], [0.63, 1.57, 0.1], 0.17);
  limb(root, jacket, [0.63, 1.57, 0.1], [0.61, 1.47, 0.54], 0.148);

  function hand(position: Point, angle: number) {
    const group = new Group(); group.position.set(...position); group.rotation.z = angle; root.add(group);
    ellipsoid(group, skin, [0, 0, 0], [0.12, 0.14, 0.065]);
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 0.054;
      limb(group, skin, [x, -0.05, 0.01], [x * 1.03, -0.24 + Math.abs(i - 1.4) * 0.025, 0.044], 0.028);
    }
    limb(group, skin, [-0.09, 0.045, 0], [-0.15, -0.075, 0.035], 0.035);
  }
  hand([-0.22, 1.23, 0.65], 0.8);
  hand([0.61, 1.34, 0.59], -0.12);
  rounded(root, black, [0.605, 1.48, 0.54], [0.24, 0.10, 0.15]);
  ellipsoid(root, silver, [0.608, 1.52, 0.589], [0.082, 0.04, 0.075]);
  ellipsoid(root, black, [0.608, 1.539, 0.6], [0.067, 0.024, 0.06]);
  limb(root, white, [0.609, 1.562, 0.58], [0.641, 1.562, 0.611], 0.006);

  limb(root, trousers, [-0.23, 1.1, 0.17], [-0.28, 0.91, 0.83], 0.2);
  limb(root, trousers, [-0.28, 0.93, 0.83], [-0.3, 0.23, 1.04], 0.15);
  limb(root, trousers, [0.23, 1.11, 0.17], [0.26, 1.17, 0.87], 0.2);
  limb(root, trousers, [0.26, 1.17, 0.87], [-0.5, 0.65, 1.1], 0.155);
  function shoe(position: Point, rotation: Point) {
    const group = new Group(); group.position.set(...position); group.rotation.set(...rotation); root.add(group);
    rounded(group, sole, [0, -0.055, 0.05], [0.34, 0.09, 0.61]);
    rounded(group, leather, [0, 0.032, 0.035], [0.32, 0.16, 0.59]);
    ellipsoid(group, leather, [0, 0.12, -0.1], [0.145, 0.16, 0.18]);
    rounded(group, leather, [0, 0.245, -0.045], [0.13, 0.026, 0.11]);
    for (let i = 0; i < 4; i++) rounded(group, trousers, [0, 0.157 - i * 0.015, i * 0.055], [0.19, 0.02, 0.025]);
  }
  shoe([-0.3, 0.12, 1.13], [0, -0.08, 0]);
  shoe([-0.57, 0.57, 1.17], [0.1, -0.42, -0.6]);

  const head = new Group(); head.name = "Head look-at pivot"; head.position.set(0, 2.13, 0.02); root.add(head);
  head.scale.set(0.88, 0.91, 0.91);
  const face = new Group(); face.position.y = 0.43; head.add(face);
  const profile: [number, number][] = [
    [0, -0.54], [0.19, -0.51], [0.32, -0.39], [0.40, -0.2], [0.455, 0.05],
    [0.465, 0.28], [0.425, 0.45], [0.29, 0.57], [0, 0.61],
  ];
  const smoothProfile = new CatmullRomCurve3(profile.map(([radius, y]) => new Vector3(radius, y, 0)))
    .getPoints(64).map(point => new Vector2(Math.max(0, point.x), point.y));
  mesh(face, geometry(new LatheGeometry(smoothProfile, 48)), skin, [0, 0, 0], [1, 1, 0.82]);
  for (const side of [-1, 1]) {
    ellipsoid(face, skin, [side * 0.472, -0.02, 0], [0.105, 0.19, 0.095]);
    ellipsoid(face, earInner, [side * 0.505, -0.015, 0.07], [0.05, 0.115, 0.025]);
    ellipsoid(face, skinLight, [side * 0.49, -0.05, 0.09], [0.033, 0.065, 0.02]);
  }
  ellipsoid(face, skinLight, [0, -0.07, 0.4], [0.072, 0.14, 0.11]);
  ellipsoid(face, skinLight, [0, -0.14, 0.45], [0.087, 0.059, 0.075]);
  for (const side of [-1, 1]) ellipsoid(face, earInner, [side * 0.058, -0.177, 0.483], [0.022, 0.012, 0.019]);

  // Rounded rectangular frames have genuine holes, with separately articulated pupils.
  function roundedPath(path: Shape | Path, x: number, y: number, w: number, h: number, r: number) {
    path.moveTo(x + r, y); path.lineTo(x + w - r, y); path.quadraticCurveTo(x + w, y, x + w, y + r);
    path.lineTo(x + w, y + h - r); path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    path.lineTo(x + r, y + h); path.quadraticCurveTo(x, y + h, x, y + h - r);
    path.lineTo(x, y + r); path.quadraticCurveTo(x, y, x + r, y);
  }
  const spectacle = new Shape(); roundedPath(spectacle, -0.183, -0.141, 0.366, 0.282, 0.086);
  const opening = new Path(); roundedPath(opening, -0.175, -0.133, 0.35, 0.266, 0.08); spectacle.holes.push(opening);
  const glass = new Shape(); roundedPath(glass, -0.175, -0.133, 0.35, 0.266, 0.08);
  const lensGeometry = geometry(new ShapeGeometry(glass, 16));
  const spectacleGeometry = geometry(new ExtrudeGeometry(spectacle, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2, steps: 1, curveSegments: 16 }));
  const eyes: Group[] = [];
  for (const side of [-1, 1]) {
    const x = side * 0.222;
    const eye = new Group(); eye.position.set(x, 0.065, 0.398); face.add(eye); eyes.push(eye);
    ellipsoid(eye, white, [0, 0, -0.05], [0.133, 0.077, 0.058]);
    ellipsoid(eye, iris, [0, 0, 0], [0.048, 0.053, 0.019]);
    ellipsoid(eye, black, [0, 0, 0.015], [0.025, 0.031, 0.01]);
    ellipsoid(eye, white, [-0.014, 0.022, 0.025], [0.012, 0.013, 0.007]);
    curve(face, hair, [[x - 0.13, 0.20, 0.35], [x, 0.25, 0.371], [x + 0.12, 0.215, 0.35]], 0.03);
    mesh(face, spectacleGeometry, silver, [x, 0.066, 0.423]);
    mesh(face, lensGeometry, lens, [x, 0.066, 0.428]);
    curve(face, silver, [[side * 0.405, 0.115, 0.441], [side * 0.48, 0.13, 0.22], [side * 0.48, 0.055, -0.11]], 0.008);
    curve(face, hair, [[side * 0.024, -0.224, 0.375], [side * 0.076, -0.22, 0.391], [side * 0.14, -0.245, 0.353]], 0.011);
  }
  curve(face, silver, [[-0.045, 0.085, 0.454], [0, 0.11, 0.47], [0.045, 0.085, 0.454]], 0.008);
  curve(face, mouth, [[-0.17, -0.28, 0.355], [-0.08, -0.325, 0.391], [0.035, -0.331, 0.395], [0.17, -0.277, 0.355]], 0.02);
  curve(face, white, [[-0.14, -0.283, 0.375], [-0.07, -0.308, 0.41], [0.05, -0.308, 0.41], [0.14, -0.282, 0.375]], 0.016);
  curve(face, hairHighlight, [[-0.16, -0.437, 0.199], [-0.08, -0.48, 0.192], [0, -0.49, 0.198], [0.08, -0.48, 0.192], [0.16, -0.437, 0.199]], 0.025);

  // The hairline is higher at the forehead and extends down the nape at the back.
  const positions: number[] = [], indices: number[] = [];
  const rings = 24, segments = 64;
  for (let row = 0; row <= rings; row++) {
    for (let col = 0; col <= segments; col++) {
      const phi = col / segments * Math.PI * 2;
      const limit = 1.03 + (1 - Math.cos(phi)) * 0.7;
      const theta = row / rings * limit;
      positions.push(Math.sin(theta) * Math.sin(phi) * 0.51, Math.cos(theta) * 0.66 + 0.065, Math.sin(theta) * Math.cos(phi) * 0.49 - 0.025);
      if (row < rings && col < segments) {
        const a = row * (segments + 1) + col, b = a + segments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const hairCap = geometry(new BufferGeometry());
  hairCap.setAttribute("position", new Float32BufferAttribute(positions, 3));
  hairCap.setIndex(indices); hairCap.computeVertexNormals();
  mesh(face, hairCap, hair, [0, 0, 0]);
  // Swept, tapered locks create a readable silhouette from all four sides.
  for (let i = 0; i < 9; i++) {
    const lock = ellipsoid(face, i % 3 === 0 ? hairHighlight : hair,
      [-0.30 + i * 0.073, 0.44 + Math.sin(i / 8 * Math.PI) * 0.12, 0.23 - i * 0.016],
      [0.125, 0.12 + (8 - i) * 0.009, 0.22]);
    lock.quaternion.copy(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -0.9));
    lock.rotation.x = -0.2;
  }
  // Keep the shirt's back and seam visible when visitors rotate the character.
  mesh(root, cube, lapel, [0, 1.6, -0.269], [0.62, 0.018, 0.018]);

  return { root, head, eyes, dispose: () => {
    geometries.forEach(value => value.dispose());
    materials.forEach(value => value.dispose());
    plaid.dispose();
  } };
}
