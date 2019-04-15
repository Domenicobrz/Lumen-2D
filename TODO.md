• if(previousPixel[0] == px && previousPixel[1] == py || px >= canvasSize || py >= canvasSize || px < 0 || py < 0) {
    there needs to be an intersection test between the ray and the world scene, and only draw samples inside that area otherwise we can waste a lot of cpu cycles for nothing 

• give an option to use to dot( wi, normal ) as an absorption factor for Dielectric materials since it looked cool on some renders 