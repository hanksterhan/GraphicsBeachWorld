"use strict";
const Scene = function(gl) {
  this.vsQuad = new Shader(gl, gl.VERTEX_SHADER, "quad_vs.essl");
  this.fsTrace = new Shader(gl, gl.FRAGMENT_SHADER, "trace_fs.glsl");
  this.traceProgram = new TexturedProgram(gl, this.vsQuad, this.fsTrace);

  this.texturedQuadGeometry = new TexturedQuadGeometry(gl);  

  this.timeAtFirstFrame = new Date().getTime();
  this.timeAtLastFrame = this.timeAtFirstFrame;

  this.traceMaterial = new Material(gl, this.traceProgram);
  this.traceMaterial.envmap.set(new TextureCube(gl, [
    "media/hw_alps/alps_rt.jpg",
    "media/hw_alps/alps_lf.jpg",
    "media/hw_alps/alps_up.jpg",
    "media/hw_alps/alps_dn.jpg",
    "media/hw_alps/alps_bk.jpg",
    "media/hw_alps/alps_ft.jpg",
  ]));

  // incrementally rendered object to demonstrate combining the incremental rendering and ray casting
  this.vsTrafo = new Shader(gl, gl.VERTEX_SHADER, "trafo_vs.essl");
  this.fsTextured = new Shader(gl, gl.FRAGMENT_SHADER, "textured_fs.essl");
  this.texturedProgram = new TexturedProgram(gl, this.vsTrafo, this.fsTextured);
  this.slowpokeMaterials = [
    new Material(gl, this.texturedProgram),
    new Material(gl, this.texturedProgram),
    ];
  this.slowpokeMaterials[0].colorTexture.set(
    new Texture2D(gl, 'media/slowpoke/YadonDh.png'));
  this.slowpokeMaterials[1].colorTexture.set(
    new Texture2D(gl, 'media/slowpoke/YadonEyeDh.png'));  

  this.slowpokeMesh = new MultiMesh(
    gl,
    'media/slowpoke/Slowpoke.json',
    this.slowpokeMaterials
    );

  this.traceMesh = new Mesh(this.texturedQuadGeometry, this.traceMaterial);

  this.gameObjects = [];
  this.gameObjects.push(new GameObject(this.traceMesh));

  this.camera = new PerspectiveCamera();
  this.camera.position.set({x:0, y:15, z:40});

  
  // Beach Uniform index 0
  Uniforms.scene.surfaces.at(0).set(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0, 
    0.0, 0.0, 0.0,-9.0 
  );
  Uniforms.scene.clippers.at(0).set(
    1.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0, 
    0.0, 0.0, 0.0,-5.0
  );
  const beach = new ClippedQuadric(
    Uniforms.scene.surfaces.at(0),
    Uniforms.scene.clippers.at(0),
  );
  beach.transform(new Mat4().translate(new Vec3(0.0, -1.80, -3.0)).scale(new Vec3(20.0, 5.0, 8.0)));
  Uniforms.scene.modelMatrixInverse.at(0).set(beach.modelMatrixInverse);


  // Parasol Uniform index 1 and 2
  const para_cylinder = new ClippedQuadric(
    Uniforms.scene.surfaces.at(1),
    Uniforms.scene.clippers.at(1)
  );
  para_cylinder.setUnitCylinder();
  para_cylinder.transform(new Mat4().translate(new Vec3(0.0, 0.5, -12.0)).scale(new Vec3(0.5, 15.0 ,1.0)).rotate(0.3));
  Uniforms.scene.modelMatrixInverse.at(1).set(para_cylinder.modelMatrixInverse);
  Uniforms.scene.surfaces.at(2).set(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0, 
    0.0, 0.0, 0.0, -9.0 
  );
  Uniforms.scene.clippers.at(2).set(
    1.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0, 
    0.0, -2.0, 0.0,-4.0
  );
  const para_sphere = new ClippedQuadric(
    Uniforms.scene.surfaces.at(2),
    Uniforms.scene.clippers.at(2)
  );
  para_sphere.transform(new Mat4().scale(5.0).translate(new Vec3(0.0, 10.0, -12.0)).rotate(0.3));
  Uniforms.scene.modelMatrixInverse.at(2).set(para_sphere.modelMatrixInverse);
  
  
  // Beach Ball Uniform index 3
  const beach_ball = new ClippedQuadric(
    Uniforms.scene.surfaces.at(3),
    Uniforms.scene.clippers.at(3)
  );
  beach_ball.setUnitSphere();
  beach_ball.transform(new Mat4().scale(4.0).translate(new Vec3(8.0, 7.0, -12.0)));
  Uniforms.scene.modelMatrixInverse.at(3).set(beach_ball.modelMatrixInverse);

  // Ocean Uniform index 4
  Uniforms.scene.surfaces.at(4).set(
    0.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0, 
    0.0, 0.0, 0.0, -1.0 
  );  
  Uniforms.scene.clippers.at(4).set(
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0, 
    0.0, 0.0, 0.0, -1.0
  );
  const ocean = new ClippedQuadric(
    Uniforms.scene.surfaces.at(4),
    Uniforms.scene.clippers.at(4)
  );
  Uniforms.scene.modelMatrixInverse.at(4).set(ocean.modelMatrixInverse);


  // sand castle base 1, index 5
  const sand_castle_1 = new ClippedQuadric(
    Uniforms.scene.surfaces.at(5),
    Uniforms.scene.clippers.at(5)
  );
  sand_castle_1.setUnitCylinder();
  sand_castle_1.transform(new Mat4().scale(2).translate(new Vec3(25.0, 5.0, -15.0)));
  Uniforms.scene.modelMatrixInverse.at(5).set(sand_castle_1.modelMatrixInverse);

  // sand castle base 2, index 6
  const sand_castle_2 = new ClippedQuadric(
    Uniforms.scene.surfaces.at(6),
    Uniforms.scene.clippers.at(6)
  );
  sand_castle_2.setUnitCone();
  sand_castle_2.transform(new Mat4().scale(new Vec3(3.0, 5.0, 2.0)).translate(new Vec3(25.0, 12.0, -15.0)));
  Uniforms.scene.modelMatrixInverse.at(6).set(sand_castle_2.modelMatrixInverse);
  
  // sand castle base 3, index 7
  const sand_castle_3 = new ClippedQuadric(
    Uniforms.scene.surfaces.at(7),
    Uniforms.scene.clippers.at(7)
  );
  sand_castle_3.setUnitCylinder();
  sand_castle_3.transform(new Mat4().scale(new Vec3(2.0, 9.0, 1.0)).translate(new Vec3(32.0, 10.0, -15.0)));
  Uniforms.scene.modelMatrixInverse.at(7).set(sand_castle_3.modelMatrixInverse);

  // sand castle base 4, index 8
  const sand_castle_4 = new ClippedQuadric(
    Uniforms.scene.surfaces.at(8),
    Uniforms.scene.clippers.at(8)
  );
  sand_castle_4.setUnitCone();
  sand_castle_4.transform(new Mat4().scale(new Vec3(3.0, 4.0, 2.0)).translate(new Vec3(32.0, 23.0, -15.0)));
  Uniforms.scene.modelMatrixInverse.at(8).set(sand_castle_4.modelMatrixInverse);

  // palm tree trunk, index 9
  Uniforms.scene.surfaces.at(9).set(
    1.0, 0.0, 0.0, 0.0,
    0.0,-1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0, 
    0.0, 0.0, 0.0, 0.0 
  );  
  Uniforms.scene.clippers.at(9).set(
    0.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.5,
    0.0, 0.0, 0.0, 0.0, 
    0.0, 0.5, 0.0, 0.0
  );
  const palm = new ClippedQuadric(
    Uniforms.scene.surfaces.at(9),
    Uniforms.scene.clippers.at(9),
  );
  palm.transform(new Mat4().scale(new Vec3(2.0, 35.0, 2.0)).translate(new Vec3(-20.0, 35.0, -15.0)));
  Uniforms.scene.modelMatrixInverse.at(9).set(palm.modelMatrixInverse);

  //palm tree leaves, index 10
  Uniforms.scene.surfaces.at(10).set(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0, 
    0.0, 0.0, 0.0,-1.0 
  );  
  Uniforms.scene.clippers.at(10).set(
    0.0, 0.0, 8.0, 0.0,
    0.0, 1.0, 0.0,-1.8,
    8.0, 0.0, 0.0, 0.0, 
    0.0,-1.8, 0.0,-1.0
  );
  const leaves1 = new ClippedQuadric(
    Uniforms.scene.surfaces.at(10),
    Uniforms.scene.clippers.at(10),
  );
  leaves1.transform(new Mat4().scale(new Vec3(15.0, 10.0, 5.0)).translate(new Vec3(-20.0, 25.0, -15.0)));
  Uniforms.scene.modelMatrixInverse.at(10).set(leaves1.modelMatrixInverse);

  // Box, index 11
  Uniforms.scene.surfaces.at(11).set(
    1.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0, 
    0.0, 0.0, 0.0, -1.0 
  );  
  Uniforms.scene.clippers.at(11).set(
    0.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 0.0, 0.0, 
    0.0, 0.0, 0.0, -1.0
  );
  Uniforms.scene.clippers2.at(0).set(
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 1.0, 
    0.0, 0.0, 0.0, -1.0
  );
  const box1 = new ClippedQuadric(
    Uniforms.scene.surfaces.at(11),
    Uniforms.scene.clippers.at(11),
  );
  box1.transform(new Mat4().translate(new Vec3(-0.5, 3, 3.0)));
  Uniforms.scene.modelMatrixInverse.at(11).set(box1.modelMatrixInverse);

  // Box, index 12
  Uniforms.scene.surfaces.at(12).set(
    0.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0, 
    0.0, 0.0, 0.0, -1.0 
  );  
  Uniforms.scene.clippers.at(12).set(
    1.0, 0.0, 0.0, 1.0,
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0, 
    0.0, 0.0, 0.0, -1.0
  );
  Uniforms.scene.clippers2.at(1).set(
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 1.0, 
    0.0, 0.0, 0.0, -1.0
  );
  const box2 = new ClippedQuadric(
    Uniforms.scene.surfaces.at(12),
    Uniforms.scene.clippers.at(12),
  );
  box2.transform(new Mat4().translate(new Vec3(0, 2.5, 3.0)));
  Uniforms.scene.modelMatrixInverse.at(12).set(box2.modelMatrixInverse);

  // Box, index 13
  Uniforms.scene.surfaces.at(13).set(
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0, 
    0.0, 0.0, 0.0, -1.0 
  );  
  Uniforms.scene.clippers.at(13).set(
    0.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 0.0, 0.0, 
    0.0, 0.0, 0.0, -1.0
  );
  const box3 = new ClippedQuadric(
    Uniforms.scene.surfaces.at(13),
    Uniforms.scene.clippers.at(13),
  );
  var clipper22 = new Mat4(
    1.0, 0.0, 0.0, 1.0,
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0, 
    0.0, 0.0, 0.0, -1.0
  );
  Uniforms.scene.clippers2.at(2).set(clipper22);

  var T = new Mat4().translate(new Vec3(-5.0, 3.0, -0.5));
  box3.transform(T);
  T = T.invert()
  clipper22 = clipper22.premul(T);
  T = T.transpose();
  clipper22 = clipper22.mul(T);
  
  Uniforms.scene.modelMatrixInverse.at(13).set(box3.modelMatrixInverse);

  // UNIFORMS:

  // directional light:
  Uniforms.lights.position.at(0).set(0.0, 1.0, 1.0, 0.0);
  Uniforms.lights.powerDensity.at(0).set(1.0, 1.0, 1.0, 1.0);

  // point light: RED
  Uniforms.lights.position.at(1).set(5.0, 30.0, -8.0, 1.0);
  Uniforms.lights.powerDensity.at(1).set(100.0, 0.0, 0.0, 1.0);

  Uniforms.scene.kds.at(0).set(0.855, 0.647, 0.125); // some yellow - beach
  Uniforms.scene.kds.at(1).set(0.86, 0.08, 0.24); // crimson - parasol cylinder
  Uniforms.scene.kds.at(2).set(0.25, 0.88, 0.82); // turquoise - parasol clipped sphere
  Uniforms.scene.kds.at(3).set(1.00, 0.30, 0.65); // some red - beach ball
  Uniforms.scene.kds.at(4).set(0.20, 0.33, 1.00); // ultramarine - ocean
  Uniforms.scene.kds.at(5).set(0.855, 0.647, 0.125); // some yellow - sand castle
  Uniforms.scene.kds.at(6).set(0.855, 0.647, 0.125); // some yellow - sand castle
  Uniforms.scene.kds.at(7).set(0.855, 0.647, 0.125); // some yellow - sand castle
  Uniforms.scene.kds.at(8).set(0.855, 0.647, 0.125); // some yellow - sand castle
  Uniforms.scene.kds.at(9).set(0.55, 0.27, 0.007); // saddle brown - palm tree
  Uniforms.scene.kds.at(10).set(0.00, 0.70, 0.00); // islamic green - palm tree leaves
  Uniforms.scene.kds.at(11).set(0.87, 0.72, 0.52); // burlywood - box
  Uniforms.scene.kds.at(12).set(0.87, 0.72, 0.52); // burlywood - box
  Uniforms.scene.kds.at(13).set(0.87, 0.72, 0.52); // burlywood - box


  // (1,1,1) reflects 100% of the light, represents rgb
  Uniforms.scene.reflectances.at(0).set(0.00, 0.00, 0.00); // beach
  Uniforms.scene.reflectances.at(1).set(0.00, 0.00, 0.00); // parasol cylinder
  Uniforms.scene.reflectances.at(2).set(0.00, 0.00, 0.00); // parasol clipped sphere 
  Uniforms.scene.reflectances.at(3).set(0.00, 0.00, 0.00); // beach ball
  Uniforms.scene.reflectances.at(4).set(1.00, 1.00, 1.00); // ocean
  Uniforms.scene.reflectances.at(5).set(0.00, 0.00, 0.00); // sand castle
  Uniforms.scene.reflectances.at(6).set(0.00, 0.00, 0.00); // sand castle
  Uniforms.scene.reflectances.at(7).set(0.00, 0.00, 0.00); // sand castle
  Uniforms.scene.reflectances.at(8).set(0.00, 0.00, 0.00); // sand castle
  Uniforms.scene.reflectances.at(9).set(0.00, 0.00, 0.00); // palm tree 
  Uniforms.scene.reflectances.at(10).set(0.00, 0.00, 0.00); // palm tree leaves
  Uniforms.scene.reflectances.at(11).set(0.00, 0.00, 0.00); // box
  Uniforms.scene.reflectances.at(12).set(0.00, 0.00, 0.00); // box
  Uniforms.scene.reflectances.at(13).set(0.00, 0.00, 0.00); // box







  gl.enable(gl.DEPTH_TEST);
};

Scene.prototype.update = function(gl, keysPressed) {
  //jshint bitwise:false
  //jshint unused:false
  const timeAtThisFrame = new Date().getTime();
  const dt = (timeAtThisFrame - this.timeAtLastFrame) / 1000.0;
  const t = (timeAtThisFrame - this.timeAtFirstFrame) / 1000.0; 
  this.timeAtLastFrame = timeAtThisFrame;

  // clear the screen
  gl.clearColor(0.3, 0.0, 0.3, 1.0);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  this.camera.move(dt, keysPressed);

  Uniforms.camera.position.set(this.camera.position);
  Uniforms.camera.viewProjMatrix.set(this.camera.viewProjMatrix);  
  Uniforms.trafo.rayDirMatrix.set(this.camera.rayDirMatrix);

  for(let i=0; i<this.gameObjects.length; i++){
    this.gameObjects[i].draw(this.camera);
  }
};


