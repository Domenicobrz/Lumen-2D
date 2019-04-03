• if(previousPixel[0] == px && previousPixel[1] == py || px >= canvasSize || py >= canvasSize || px < 0 || py < 0) {
    there needs to be an intersection test between the ray and the world scene, and only draw samples inside that area otherwise we can waste A LOT of cpu cycles for nothing 

• give an option to use to dot( wi, normal ) as an absorption factor for Dielectric materials since it looked cool on some renders 


• Is this code inside LambertMaterial:
    // Compute contribution BEFORE CHANGING THE RAY.O ARRAY!
    let dot = Math.abs(  vec2.dot(ray.d, input_normal)  );
    let absorbtionDifference = 1 - dot;
    let opacityDot = dot + absorbtionDifference * (1 - this.opacity);
    contribution *= opacityDot;

    actually correct? it doesn't seem so because when a light ray passes the opacity test it should be free to pass through unchanged, without the dot of
    the ray direction & normal affecting it at all
