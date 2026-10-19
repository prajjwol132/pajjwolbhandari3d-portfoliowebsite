import { Vector2, type Texture } from "three";

export const PORTRAIT_ROOM = "/media/character/room-body.webp";
export const PORTRAIT_HEADS = "/media/character/head-views.webp";
export const PORTRAIT_POSTER = "/media/character/room-poster.webp";
export const ROOM_SIZE = [1672, 941] as const;
export const HEAD_SIZE = 244;
export const HEAD_ANCHOR = [943, 285] as const;
export const HEAD_CENTER_OFFSET = (398 - 209) * HEAD_SIZE / 418;

export function createPortraitUniforms() {
  return {
    uAtlas: { value: null as Texture | null },
    uHead: { value: new Vector2() },
    uEyes: { value: new Vector2() },
  };
}

// One continuous relief surface, not a switch or crossfade between photographs.
// The collar is pinned while the face and hair rotate around a neck pivot.
export const portraitVertexShader = /* glsl */ `
  uniform vec2 uHead;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec2 pixel = vec2(uv.x, 1.0 - uv.y) * 418.0 + vec2(5.0, -9.0);
    vec2 face = (pixel - vec2(210.0, 220.0)) / vec2(155.0, 198.0);
    float dome = sqrt(max(0.0, 1.0 - dot(face, face)));
    vec2 nose = (pixel - vec2(209.0, 265.0)) / vec2(32.0, 42.0);
    float depth = dome * 43.0 + exp(-dot(nose, nose) * 1.8) * 11.0;
    float neckWeight = smoothstep(0.0, 46.0, position.y);
    vec3 point = vec3(position.xy, depth * neckWeight);
    vec3 pivot = vec3(0.0, 48.0, 0.0);
    vec3 relative = point - pivot;

    float yaw = uHead.x * 0.36;
    float pitch = -uHead.y * 0.22;
    float roll = -uHead.x * 0.025;
    vec3 turn = vec3(
      cos(yaw) * relative.x + sin(yaw) * relative.z,
      relative.y,
      -sin(yaw) * relative.x + cos(yaw) * relative.z
    );
    turn = vec3(turn.x, cos(pitch) * turn.y - sin(pitch) * turn.z,
      sin(pitch) * turn.y + cos(pitch) * turn.z);
    turn.xy = mat2(cos(roll), sin(roll), -sin(roll), cos(roll)) * turn.xy;
    point = mix(point, turn + pivot, neckWeight);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(point, 1.0);
  }
`;

export const portraitFragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform vec2 uEyes;
  varying vec2 vUv;

  float eyeMask(vec2 pixel, vec2 center) {
    vec2 distance = (pixel - center) / vec2(23.0, 11.0);
    return 1.0 - smoothstep(0.3, 1.0, dot(distance, distance));
  }

  void main() {
    vec2 pixel = vec2(vUv.x, 1.0 - vUv.y) * 418.0 + vec2(5.0, -9.0);
    if (pixel.x < 1.0 || pixel.y < 1.0 || pixel.x > 417.0 || pixel.y > 417.0) discard;
    // Move iris detail inside each aperture; glasses, brows and lids stay put.
    float eyes = max(eyeMask(pixel, vec2(158.0, 213.0)), eyeMask(pixel, vec2(249.0, 208.0)));
    vec2 samplePixel = pixel - vec2(uEyes.x * 6.0, -uEyes.y * 3.5) * eyes;
    vec2 atlasUv = (vec2(1.0) + samplePixel / 418.0) / 3.0;
    vec4 color = texture2D(uAtlas, vec2(atlasUv.x, 1.0 - atlasUv.y));
    color.a = smoothstep(0.15, 0.65, color.a);
    color.a *= 1.0 - smoothstep(387.0, 399.0, pixel.y);
    if (color.a < 0.005) discard;
    gl_FragColor = color;
    #include <colorspace_fragment>
  }
`;
