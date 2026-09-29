import {
  Material,
  Mesh,
  Object3D,
  Texture,
  WebGLRenderer,
} from "three";

type DisposableLike = {
  dispose: () => void;
};

function isDisposable(value: unknown): value is DisposableLike {
  return Boolean(
    value &&
      typeof value === "object" &&
      "dispose" in value &&
      typeof (value as DisposableLike).dispose === "function",
  );
}

function isTexture(value: unknown): value is Texture {
  return value instanceof Texture;
}

function disposeSafely(resource: unknown) {
  if (!isDisposable(resource)) {
    return;
  }

  try {
    resource.dispose();
  } catch {
    // Disposal should never break route transitions or modal switches.
  }
}

export function disposeTexture(texture: Texture | null | undefined) {
  if (!texture) {
    return;
  }

  disposeSafely(texture);
}

export function disposeMaterial(material: Material | Material[] | null | undefined) {
  if (!material) {
    return;
  }

  const materials = Array.isArray(material) ? material : [material];

  materials.forEach((entry) => {
    const materialRecord = entry as Material & Record<string, unknown>;

    Object.values(materialRecord).forEach((value) => {
      if (isTexture(value)) {
        disposeTexture(value);
      }
    });

    disposeSafely(entry);
  });
}

export function disposeObject3D(root: Object3D | null | undefined) {
  if (!root) {
    return;
  }

  root.traverse((object) => {
    const mesh = object as Mesh;

    if (!mesh.isMesh) {
      return;
    }

    disposeSafely(mesh.geometry);
    disposeMaterial(mesh.material);
  });
}

export function disposeSceneGraph(root: Object3D | null | undefined) {
  if (!root) {
    return;
  }

  disposeObject3D(root);

  while (root.children.length > 0) {
    root.remove(root.children[0]);
  }
}

export function disposeRenderer(
  renderer: WebGLRenderer | null | undefined,
  options: { forceContextLoss?: boolean } = {},
) {
  if (!renderer) {
    return;
  }

  try {
    renderer.renderLists.dispose();
    renderer.dispose();

    if (options.forceContextLoss) {
      renderer.forceContextLoss();
    }
  } catch {
    // Browsers can throw during context teardown; ignore to avoid unmount crashes.
  }
}
