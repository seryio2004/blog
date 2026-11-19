import {
  AmbientLight,
  Box3,
  DirectionalLight,
  EdgesGeometry,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Sphere,
  WebGLRenderer,
} from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Loaded on demand by PostBody when a [data-stl-viewer] figure scrolls into view,
// so three.js never ships with pages that have no 3D models.
export function mountStlViewer(figure: HTMLElement): () => void {
  const container = figure.querySelector<HTMLElement>("[data-stl-canvas]");
  const status = figure.querySelector<HTMLElement>("[data-stl-status]");
  const src = figure.dataset.src;
  const errorText = figure.dataset.error ?? "Error";
  if (!container || !src) return () => {};

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    if (status) status.textContent = errorText;
    return () => {};
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.prepend(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 1000);
  // Low ambient light plus a raking key light so that slots, holes and
  // embossed text cast visible shading.
  scene.add(new AmbientLight(0xffffff, 0.35));
  scene.add(new HemisphereLight(0xfbfaf4, 0x5e2750, 0.9));
  const key = new DirectionalLight(0xffffff, 2.6);
  key.position.set(-1.2, 1.6, 0.6);
  const fill = new DirectionalLight(0xffffff, 0.6);
  fill.position.set(1.4, 0.6, 1.2);
  scene.add(key, fill);

  const controls = new OrbitControls(camera, renderer.domElement);
  const render = () => renderer.render(scene, camera);
  // Render on demand: no animation loop while the reader is not interacting.
  controls.addEventListener("change", render);

  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);

  // Light mauve body with dark plum CAD outlines: a mid-light tone shows
  // shading best, and the outlines make every relief edge readable.
  const styles = getComputedStyle(figure);
  const partColor = styles.getPropertyValue("--stl-part").trim() || "#d2a8ca";
  const edgeColor = styles.getPropertyValue("--terminal").trim() || "#300a24";
  const material = new MeshStandardMaterial({
    color: partColor, roughness: 0.8, metalness: 0,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  const edgeMaterial = new LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.55 });
  let edges: EdgesGeometry | null = null;
  let mesh: Mesh | null = null;
  let disposed = false;

  new STLLoader().load(
    src,
    (geometry) => {
      if (disposed) { geometry.dispose(); return; }
      geometry.computeVertexNormals();
      geometry.center();
      mesh = new Mesh(geometry, material);
      edges = new EdgesGeometry(geometry, 25);
      mesh.add(new LineSegments(edges, edgeMaterial));
      // Slicers and CAD tools export Z-up; three.js is Y-up.
      mesh.rotation.x = -Math.PI / 2;
      scene.add(mesh);

      const sphere = new Box3().setFromObject(mesh).getBoundingSphere(new Sphere());
      const distance = sphere.radius / Math.sin((camera.fov * Math.PI) / 360) * 0.95;
      camera.near = distance / 100;
      camera.far = distance * 100;
      camera.position.set(distance * 0.55, distance * 0.6, distance * 0.6);
      camera.updateProjectionMatrix();
      controls.target.copy(sphere.center);
      controls.minDistance = sphere.radius * 0.6;
      controls.maxDistance = distance * 3;
      controls.update();
      status?.remove();
      figure.dataset.state = "ready";
      resize();
    },
    undefined,
    () => {
      if (status) status.textContent = errorText;
      figure.dataset.state = "error";
    },
  );

  return () => {
    disposed = true;
    observer.disconnect();
    controls.removeEventListener("change", render);
    controls.dispose();
    mesh?.geometry.dispose();
    edges?.dispose();
    material.dispose();
    edgeMaterial.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
