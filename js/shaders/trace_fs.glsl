Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es 
  precision highp float;

  out vec4 fragmentColor;

  in vec3 rayDir;

  uniform struct {
    vec3 position;
    mat4 viewProjMatrix;
  } camera;

  uniform struct {
    mat4 surfaces[16];
    mat4 clippers[16];
    vec4 kds[16]; // rgb is surface color
    vec4 kss[16]; // rgb is spec highlight color, w is shininess
    vec3 reflectances[16];
    mat4 modelMatrixInverse[16];
  } scene;

  uniform struct {
    vec4 position[8]; // xyz is the direction, w is 0 for direction light, 1 for point light
    vec4 powerDensity[8]; // w is ignored
  } lights;

  uniform samplerCube envmap;

  float intersectQuadric(mat4 A, vec4 e, vec4 d){
    float a = dot(d * A, d);
    float b = dot(d * A, e) + dot(e * A, d);
    float c = dot(e * A, e);

    float discriminant = b*b-4.0*a*c;
    if (discriminant < 0.0){
      return -1.0; // no intersection
    }
    float t1 = (-b + sqrt(discriminant)) / (2.0*a);
    float t2 = (-b - sqrt(discriminant)) / (2.0*a);
    
    return (t1<0.0)?t2:((t2<0.0)?t1:min(t1, t2));
  }

  float intersectClippedQuadric(mat4 B, mat4 A, vec4 e, vec4 d){
    float a = dot(d * A, d);
    float b = dot(d * A, e) + dot(e * A, d);
    float c = dot(e * A, e);

    float discriminant = b*b-4.0*a*c;
    if (discriminant < 0.0){
      return -1.0; // no intersection
    }
    float t1 = (-b + sqrt(discriminant)) / (2.0*a);
    float t2 = (-b - sqrt(discriminant)) / (2.0*a);
    
    vec4 r1 = e + d * t1;
    vec4 r2 = e + d * t2;
    
    float p1 = dot(r1 * B, r1);
    float p2 = dot(r2 * B, r2);

    if (p1 > 0.0){ // t1 not a good intersection point, it's outside of B
      t1 = -1.0;
    } 
    if (p2 > 0.0){ // t2 not a good intersection point
      t2 = -1.0;
    }

    // return the lesser positive of t1, t2
    return (t1<0.0)?t2:((t2<0.0)?t1:min(t1, t2));
  }

  bool findBestHit(vec4 e, vec4 d, out float bestT, out int bestIndex){
    bestT = 9001.0;
    bestIndex = -1;

    for(int index = 0; index <= 16; index++){
      float currentT = intersectClippedQuadric(scene.clippers[index], scene.surfaces[index], e, d);
      if (currentT < bestT && currentT > 0.0){
        bestT = currentT;
        bestIndex = index;
      }
    }
    return (bestT < 9000.0)?true:false; 
  }

  ////////////////////////////////
  // MAIN
  ////////////////////////////////
  void main(void) {
  	vec4 e = vec4(camera.position, 1);		//< ray origin
  	vec4 d = vec4(normalize(rayDir), 0);	//< ray direction   
    
    float bestT;
    int bestIndex;

    vec3 w = vec3(1.0, 1.0, 1.0); // product of reflectances so far
    vec4 outColor = vec4(0.0, 0.0, 0.0, 0.0);

    for(int j=0; j<= 5; j++){ // how many reflections do we want to follow
      if( findBestHit(e, d, bestT, bestIndex) ){
        // computing depth from world space hit coordinates 
        // vec4 ndcHit = hit * camera.viewProjMatrix;
        // gl_FragDepth = ndcHit.z / ndcHit.w * 0.5 + 0.5;

        vec4 hit = e + d * bestT; // worldPosition
        vec3 worldNormal = (hit * scene.surfaces[bestIndex] + scene.surfaces[bestIndex] * hit).xyz;
        vec3 normal = normalize(worldNormal);
        
        // flip normal towards incoming ray
        if(dot(normal, d.xyz) > 0.0){
          normal = -normal;
        }
        
        vec3 position = hit.xyz / hit.w;
        vec3 viewDir = normalize(camera.position - position);

        if(bestIndex < 3){
        // Lambertian shading - Diffuse 
          outColor.rgb += lights.powerDensity[bestIndex].rgb * max(0.0, dot(worldNormal, lights.position[bestIndex].xyz))* scene.kds[bestIndex].xyz * w;// * texture(colorTexture, texCoord).rgb; // TODO: we don't have colorTexture anymore, is scene.kds[bestIndex].xyz the substitute?
          outColor.a = 1.0;
        }
        if(bestIndex == 3){
          // Procedural Texturing
          vec3 modelPosition = (hit * scene.modelMatrixInverse[bestIndex]).xyz;

          if(fract(atan(modelPosition.z, modelPosition.x) * 0.5) < 0.5){
            outColor.rgb = scene.kds[bestIndex].xyz * w;
          } else{
            outColor.rgb = vec3(1.0, 1.0, 1.0) * w;
          }
        }
        if(bestIndex > 2){
          // Phong-Blinn shading
          outColor.rgb += lights.powerDensity[bestIndex].rgb * dot(worldNormal, lights.position[bestIndex].xyz) + lights.powerDensity[bestIndex].rgb * vec3(10.0,10.0,10.0) * pow(dot(normal, normalize(viewDir + lights.position[bestIndex].xyz)), 20.0) * scene.kds[bestIndex].xyz * w;// * texture(colorTexture, texCoord).rgb ; // TODO: we don't have colorTexture anymore
          outColor.a = 1.0;
        }

        // Shadow rays
        float bestShadowT;
        int bestShadowIndex;

        // find shading color
        for(int i=0; i<1; i++){
          vec4 shadowE = hit; // ray origin
          shadowE.xyz += normal * 0.01; // to offset from the surface
          vec4 shadowD = lights.position[i]; // ray direction
          
          //directional light 
          if(lights.position[i].w == 0.0){
            // add to fragment color if there is a shadow casted to it
            if( !findBestHit(shadowE, shadowD, bestShadowT, bestShadowIndex)){
              outColor.rgb += max(0.0, dot(normal, lights.position[i].xyz)) * lights.powerDensity[i].xyz * scene.kds[bestIndex].xyz * w;
            } 
          } 

          //else{
            // point light 
            // need to check the length
            //if(length(hit.xyz - lights.position[i].xyz) * lights.position[i].xyz < bestShadowT){

            //} else{

            //}
          //}

        }

        // update w with the reflectances
        w *= scene.reflectances[bestIndex]; 

        // if w is close to 0
        if(length(w) < 0.01){
          break;
        }

        // Compute reflected ray - update origin e and dir d
        e = hit; // ray origin
        e.xyz += normal * 0.01;
        d.xyz = reflect(d.xyz, normal); // ray direction


      } else{
        // primary ray does not intersect anything, show environment
        outColor.rgb += texture(envmap, d.xyz).rgb * w; // background color
        break;
        // gl_FragDepth = 0.9999999; 
      }
    }
    fragmentColor = outColor;
  }
`;