"use strict";
const Scene = function(gl) {
  this.vsQuad = new Shader(gl, gl.VERTEX_SHADER, "quad_vs.essl");
  this.fsTrace = new Shader(gl, gl.FRAGMENT_SHADER, "trace_fs.glsl");
  this.traceProgram = new TexturedProgram(gl, this.vsQuad, this.fsTrace);

  this.texturedQuadGeometry = new TexturedQuadGeometry(gl);  

  // ground zero
  // this.planeGeometry = new PlaneGeometry(gl);
  // this.planeMaterial = new Material(gl, this.planeProgram);
  // this.planeMaterial.colorTexture.set(new Texture2D(gl, "media/water.jpg"));
  // this.planeMesh = new Mesh(this.planeGeometry, this.planeMaterial);
  // this.plane = new GameObject(this.planeMesh);
  // this.plane.position.set(0, 0, 0);

  this.timeAtFirstFrame = new Date().getTime();
  this.timeAtLastFrame = this.timeAtFirstFrame;

  this.traceMaterial = new Material(gl, this.traceProgram);
  this.traceMaterial.envmap.set(new TextureCube(gl, [
    "media/posx.jpg",
    "media/negx.jpg",
    "media/posy.jpg",
    "media/negy.jpg",
    "media/posz.jpg",
    "media/negz.jpg",]
  	));

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
  // this.gameObjects.push(new GameObject(this.slowpokeMesh));

  this.traceMesh = new Mesh(this.texturedQuadGeometry, this.traceMaterial);

  this.gameObjects = [];
  this.gameObjects.push(new GameObject(this.traceMesh));

  this.camera = new PerspectiveCamera();
  this.camera.position.set({x:0, y:3, z:40});

  
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

  // UNIFORMS:

  // directional light:
  Uniforms.lights.position.at(0).set(5.0, 5.0, 0.0, 0.0);
  Uniforms.lights.powerDensity.at(0).set(0.5, 0.5, 0.5, 1.0);

  // point light:
  Uniforms.lights.position.at(1).set(0.0, 20.0, -8.0, 1.0);
  Uniforms.lights.powerDensity.at(1).set(1000.0, 2000.0, 9000.0, 1.0);

  Uniforms.scene.kds.at(0).set(0.855, 0.647, 0.125); // some yellow - beach
  Uniforms.scene.kds.at(1).set(0.86, 0.08, 0.24); // crimson - parasol cylinder
  Uniforms.scene.kds.at(2).set(0.25, 0.88, 0.82); // turquoise - parasol clipped sphere
  Uniforms.scene.kds.at(3).set(1.00, 0.30, 0.65); // some red - beach ball
  Uniforms.scene.kds.at(4).set(0.20, 0.33, 1.00); // ultramarine - ocean
  Uniforms.scene.kds.at(5).set(0.25, 0.00, 0.50); // indigo
  Uniforms.scene.kds.at(6).set(0.00, 0.70, 0.00); // islamic green

  // (1,1,1) reflects 100% of the light, represents rgb
  Uniforms.scene.reflectances.at(0).set(0.00, 0.00, 0.00); // beach
  Uniforms.scene.reflectances.at(1).set(0.00, 0.00, 0.00); // parasol cylinder
  Uniforms.scene.reflectances.at(2).set(0.00, 0.00, 0.00); // parasol clipped sphere 
  Uniforms.scene.reflectances.at(3).set(0.00, 0.00, 0.00); // beach ball
  Uniforms.scene.reflectances.at(4).set(0.00, 0.00, 0.00); // ocean



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


