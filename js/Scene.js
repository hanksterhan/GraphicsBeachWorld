"use strict";
const Scene = function(gl) {
  this.vsQuad = new Shader(gl, gl.VERTEX_SHADER, "quad_vs.essl");
  this.fsTrace = new Shader(gl, gl.FRAGMENT_SHADER, "trace_fs.essl");
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
  this.camera.position.set({x:0, y:3, z:15});

  const orange = new ClippedQuadric(
    Uniforms.scene.surfaces.at(0),
    Uniforms.scene.clippers.at(0)
  );
  
  orange.setUnitCylinder();
  orange.transform(new Mat4().rotate(0).translate(2));
  // orange.transformClipper(new Mat4().rotate(5).translate(2));

  const yellow = new ClippedQuadric(
    Uniforms.scene.surfaces.at(1),
    Uniforms.scene.clippers.at(1),
  );
  yellow.setUnitSphere();
  yellow.transform(new Mat4().rotate(0).translate(-2).scale(5));


  // Uniforms.scene.surfaces.at(0).set(
  //   1.0, 0.0, 0.0, 0.0,
  //   0.0, 1.0, 0.0, 0.0,
  //   0.0, 0.0, 1.0, 0.0, 
  //   0.0, 0.0, 0.0,-9.0 
  // );

  // Uniforms.scene.clippers.at(0).set(
  //   1.0, 0.0, 0.0, 0.0,
  //   0.0, 0.0, 0.0, 0.0,
  //   0.0, 0.0, 0.0, 0.0, 
  //   0.0, 0.0, 0.0,-4.0 
  // );

  // directional light:
  Uniforms.lights.position.at(0).set(5.0, 0.0, 0.0, 0.0);
  Uniforms.lights.powerDensity.at(0).set(1.0, 1.0, 1.0, 1.0);


  // point light:
  Uniforms.lights.position.at(1).set(0.0, 20.0, -8.0, 1.0);
  Uniforms.lights.powerDensity.at(1).set(1000.0, 2000.0, 9000.0, 1.0);

  Uniforms.scene.kds.at(0).set(0.25, 0.88, 0.82);
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


