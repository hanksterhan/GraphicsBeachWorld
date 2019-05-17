"use strict"; 
const ClippedQuadric = function(A, B) {
      this.A = A;
      this.B = B;
      this.modelMatrixInverse = new Mat4();
}

ClippedQuadric.prototype.setUnitSphere = function(){
      this.A.set(	1, 0, 0, 0,
                  0, 1, 0, 0,
                  0, 0, 1, 0,
                  0, 0, 0, -1);
      this.B.set(	0, 0, 0, 0,
                  0, 1, 0, 0,
                  0, 0, 0, 0,
                  0, 0, 0, -1);
}

ClippedQuadric.prototype.setUnitCylinder = function(){
      this.A.set(	1, 0, 0, 0,
                  0, 0, 0, 0,
                  0, 0, 1, 0,
                  0, 0, 0, -1);
      this.B.set(	0, 0, 0, 0,
                  0, 1, 0, 0,
                  0, 0, 0, 0,
                  0, 0, 0, -1);
}

ClippedQuadric.prototype.setUnitCone = function(){
      this.A.set(	1, 0, 0, 0,
                  0, -1, 0, 0,
                  0, 0, 1, 0,
                  0, 0, 0, 0);
      this.B.set(	0, 0, 0, 0,
                  0, 1, 0, 0.5,
                  0, 0, 0, 0,
                  0,0.5, 0, 0);
}

ClippedQuadric.prototype.transform = function(T){
      this.modelMatrixInverse.mul(T.clone().invert());
      T = T.invert();
      this.A.premul(T);
      this.B.premul(T);
      T.transpose();
      this.A.mul(T);
      this.B.mul(T);
}

ClippedQuadric.prototype.transformClipper = function(T){
      T = T.invert()
      this.B.premul(T);
      T.transpose();
      this.B.mul(T);
}

