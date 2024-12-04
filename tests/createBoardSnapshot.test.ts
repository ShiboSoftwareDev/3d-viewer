// src/tests/createBoardSnapshot.test.ts

import { expect, test } from "bun:test"
import * as THREE from 'three';
import { SVGRenderer, SVGMesh } from 'three-svg-renderer';
import fs from 'fs';
import { createBoardGeomFromSoup } from '../src/soup-to-3d';
import type { AnySoupElement } from "@tscircuit/soup";
import type { Geom3 } from "@jscad/modeling/src/geometries/types";
import { geom3 } from '@jscad/modeling/src/geometries';

// Helper function to convert JSCAD CSG geometry to Three.js geometry
function jscadToThreeGeometry(jscadGeom: Geom3): THREE.BufferGeometry {
  const threeGeom = new THREE.BufferGeometry();

  const polygons = geom3.toPolygons(jscadGeom);
  const vertices: number[] = [];

  polygons.forEach(polygon => {
    // Triangulate the polygon
    for (let i = 2; i < polygon.vertices.length; i++) {
      vertices.push(
        ...polygon.vertices[0],
        ...polygon.vertices[i - 1],
        ...polygon.vertices[i]
      );
    }
  });

  threeGeom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  threeGeom.computeVertexNormals();
  return threeGeom;
}

// Function to create an SVGMesh from a Three.js Mesh
function createSVGMesh(mesh: THREE.Mesh): SVGMesh {
  const svgMesh = mesh as SVGMesh;
  svgMesh.updateMorphGeometry = () => { };
  svgMesh.updateBVH = () => { };
  svgMesh.updateHES = () => { };
  svgMesh.computeBoundingBox = () => {
    if (!mesh.geometry.boundingBox) {
      mesh.geometry.computeBoundingBox();
    }
  };
  svgMesh.computeBoundingSphere = () => {
    if (!mesh.geometry.boundingSphere) {
      mesh.geometry.computeBoundingSphere();
    }
  };
  return svgMesh;
}

test("create board snapshot", async () => {
  const mockSoup: AnySoupElement[] = [
    {
      type: "pcb_board",
      width: 100,
      height: 80,
      center: { x: 0, y: 0 }
    }
  ];

  const boardGeom: Geom3[] = createBoardGeomFromSoup(mockSoup);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 100;

  const meshes: SVGMesh[] = [];

  boardGeom.forEach(geom => {
    const threeGeom = jscadToThreeGeometry(geom);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide // Ensure both sides of the geometry are visible
    });
    const mesh = new THREE.Mesh(threeGeom, material);
    const svgMesh = createSVGMesh(mesh);
    meshes.push(svgMesh);
    scene.add(svgMesh);
  });

  // Add some light to the scene
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  const renderer = new SVGRenderer();
  const width = 800;
  const height = 600;

  try {
    const svgObject = await renderer.generateSVG(meshes, camera, { w: width, h: height });
    const svgString = svgObject.svg();

    const outputPath = './board-snapshot.svg';
    fs.writeFileSync(outputPath, svgString);

    await expect(svgString).toMatchSvgSnapshot(import.meta.path, "board-snapshot")

    fs.unlinkSync(outputPath);
  } catch (error) {
    console.error("Error generating SVG:", error);
    throw error;
  }
});
