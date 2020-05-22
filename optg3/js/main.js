var container;
var camera, scene, renderer;
var clock = new THREE.Clock();
var imagedata, geometry, sphere;
var spotlight = new THREE.PointLight(0xffffff);
var keyboard = new THREEx.KeyboardState();

var parrotPath;
var flamingoPath;

var xx = 0;
var zz = 0;
var yy = 0;

var p=0;
var v=0;
var l=0;

var N = 256;
var mixers, vertices, morphs = [];  //массив анимированных объектов

init();
animate();

function init()
{
    container = document.getElementById("container");
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000); 
    camera.position.set(N*2, 100, N);
    camera.lookAt(new THREE.Vector3( N/2, 0, N/2));
    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x0000ff, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild( renderer.domElement );
    window.addEventListener("resize", onWindowResize, false );
    mixers = new THREE.AnimationMixer( scene );  
    spotlight.position.set(N, N*2, N/2);
    scene.add( spotlight );
    var light = new THREE.DirectionalLight(0xffff00);
    light.position.set( -N, N*2, 0 );   
    light.target = new THREE.Object3D();
    light.target.position.set( 0, 0, 0 );
    scene.add(light.target);
    light.castShadow = true;
    light.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 45, 1, 1, 2500 ) );
    light.shadow.bias = 0.0001;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    scene.add( light );
    addSky();
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    var img = new Image();
    img.onload = function()
    {    
        canvas.width = img.width;    
        canvas.height = img.height;    
        context.drawImage(img, 0, 0 );    
        imagedata = context.getImageData(0, 0, img.width, img.height);
       
        CreateTerrain();

    
    }
    img.src = "inv/plateau.jpg";
    loadModel('tree/',"Tree.obj", "Tree.mtl");
    loadModel('palma/',"Palma001.obj", "Palma001.mtl");        
    parrotPath = addParrotT();
    flamingoPath = addFlamigoT();
    loadAnimatedModel('Parrot.glb', parrotPath);
    loadAnimatedModel('Flamingo.glb', flamingoPath);
}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

var a = 0;
var t = 0;
var T = 10;

function animate()
{
    xx+=l*2.0;
    zz+=p;
    yy+=v*2.0;
    a += 0.001;
    sphere.rotation.y = a;


    camera.position.x = N/2 + 260 * Math.cos(xx);
    camera.position.z = N/2 + 260 * Math.sin(xx);
    
    camera.position.y = N/2 + 120 * Math.cos(yy);
    
    camera.lookAt(new THREE.Vector3( N/2, 0, N/2));
    var delta = clock.getDelta();
    mixers.update( delta );
    for ( var i = 0; i < morphs.length; i++ )
    {
        var morph = morphs[ i ];
        var pos = new THREE.Vector3();
        
        if ( t >= T) 
            t = 0.0;
        
        pos.copy(morph.route.getPointAt(t/T));
        morph.mesh.position.copy(pos);
        t += 0.015

        if ( t >= T) 
            t = 0.0;

        var nextPoint = new THREE.Vector3();
        nextPoint.copy(morph.route.getPointAt((t)/T));
        morph.mesh.lookAt(nextPoint);
    }

    requestAnimationFrame( animate );
    render();
}

function render()
{        
    renderer.render( scene, camera );
}


function loadModel(path, oname, mname)
{
    //функция, выполняемая в процессе загрузки модели  
    var onProgress = function ( xhr ) {
        if ( xhr.lengthComputable ) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log( Math.round(percentComplete, 2) + "% downloaded" );
        }
    };

    //функция, выполняющая обработку ошибок, возникших в процессе загрузки 
    var onError = function ( xhr ) { console.log(xhr); };

    var mtlLoader = new THREE.MTLLoader();
    //mtlLoader.setBaseUrl( path ); 
    mtlLoader.setPath( path );
    //функция загрузки материала 
    mtlLoader.load ( mname, function( materials )
    {
        materials.preload();
        
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials ( materials );
        objLoader.setPath( path );

        //функция загрузки модели       
        objLoader.load ( oname, function ( object )
        {
            
            object.castShadow = true;
            object.traverse( function ( child )
            {
                if ( child instanceof THREE.Mesh )
                {
                    child.castShadow = true;
                }
            } );


            for(var i = 0; i < 5; i++){
                var x = Math.random()*N;
                var z = Math.random()*N;
                var y = geometry.vertices[Math.round(x) + Math.round(z)*N].y;

                object.position.x = x;
                object.position.y = y;
                object.position.z = z;
                

                var s = (Math.random() * 0.2) + 0.1;
                object.scale.set(s, s, s);
                scene.add( object.clone());
            }
        }, onProgress, onError ); 
    });
}

function addSky()
{
    var loader = new THREE.TextureLoader();
    var geometry = new THREE.SphereGeometry( 1000, 32, 32 );
    var tex = loader.load( "inv/sky2.jpg" );
    
    tex.minFilter = THREE.NearestFilter;

    var material = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide
    });

    sphere = new THREE.Mesh( geometry, material );

    scene.add( sphere );
}

function loadAnimatedModel(path, route)
{
    var loader = new THREE.GLTFLoader();

    loader.load( path, function ( gltf ) 
    {
        var mesh = gltf.scene.children[ 0 ];
        var clip = gltf.animations[ 0 ];

        mixers.clipAction( clip, mesh ).setDuration( 1 ).startAt( 0 ).play();
        
        mesh.position.set(N/2, 50, N/2);
        mesh.rotation.y = Math.PI / 8;
        mesh.scale.set( 0.1, 0.1, 0.1 );

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add( mesh );

        model = {};
        model.mesh = mesh;
        model.route = route;

        morphs.push( model );
    });
}

function CreateTerrain()
{
    geometry = new THREE.Geometry();
 
    for (var i=0; i < N; i++)
        for (var j=0; j < N; j++)
        {
            var position = getPixel( imagedata, i, j );
            geometry.vertices.push(new THREE.Vector3( i, position/10.0, j));
        }

    for(var i = 0; i < N - 1; i++){
        for(var j = 0; j < N - 1; j++){
            var vertex1 =  i + j * N;
            var vertex2 = (i + 1) + j * N;
            var vertex3 = i + (j + 1) * N;
            var vertex4 = (i + 1) + (j + 1) * N;

            geometry.faces.push(new THREE.Face3(vertex1, vertex2, vertex4));
            geometry.faces.push(new THREE.Face3(vertex1, vertex4, vertex3));

            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(i/(N-1), j/(N-1)),
                new THREE.Vector2((i+1)/(N-1), j/(N-1)),
                new THREE.Vector2((i+1)/(N-1), (j+1)/(N-1))
            ]);

            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(i/(N-1), j/(N-1)),
                new THREE.Vector2((i+1)/(N-1), (j+1)/(N-1)),
                new THREE.Vector2(i/(N-1), (j+1)/(N-1))
            ]);
        } 
    }
        
    geometry.computeFaceNormals();  
    geometry.computeVertexNormals();

    var loader = new THREE.TextureLoader();
    var tex = loader.load( "inv/grasstile.jpg" );
        
    var mat = new THREE.MeshLambertMaterial({    
        map: tex,    
        wireframe: false,    
        side: THREE.DoubleSide 
    });
 
    var matMesh = new THREE.Mesh(geometry, mat); 
    
    matMesh.receiveShadow = true;
    scene.add(matMesh);
}

function getPixel( imagedata, x, y )  
{    
    var position = ( x + imagedata.width * y ) * 4, data = imagedata.data;    
    return data[ position ];
}

function addParrotT()
{    
    var curve1 = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 30, 50, 128 ), 
        new THREE.Vector3( 30, 50, 0 ),
        new THREE.Vector3( 226, 50, 0 ),
        new THREE.Vector3( 226, 50, 128)  
    );

    var curve2 = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 226, 50, 128),
        new THREE.Vector3( 226, 50, 256 ),
        new THREE.Vector3( 30, 50, 256 ),        
        new THREE.Vector3( 30, 50, 128 )
    );

    vertices = curve1.getPoints( 20 );
    vertices = vertices.concat(curve2.getPoints( 20 ))
    var path = new THREE.CatmullRomCurve3(vertices);
    path.closed = true;

    return path;
}

function addFlamigoT()
{
    var curve1 = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 226, 100, 128), 
        new THREE.Vector3( 226, 100, 0 ),
        new THREE.Vector3( 30, 100, 0 ),
        new THREE.Vector3( 30, 100, 128 )         
    );

    var curve2 = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 30, 100, 128 ),
        new THREE.Vector3( 30, 100, 256 ),
        new THREE.Vector3( 226, 100, 256 ),
        new THREE.Vector3( 226, 100, 128)    
    );

    vertices = curve1.getPoints( 20 );
    vertices = vertices.concat(curve2.getPoints( 20 ))
    var path = new THREE.CatmullRomCurve3(vertices);
    path.closed = true;

    return path;
}




