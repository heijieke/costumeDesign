<template>
    <!-- <div>
        <img :src="img_url">
    </div> -->
    <div ref="container"></div>
</template>

<script setup>
    import * as THREE from 'three';
    import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
    import {SVGLoader} from 'three/addons/loaders/SVGLoader.js'
    import {ref, onMounted} from 'vue';
    import { GUI } from 'dat.gui';

    let renderer, scene, camera, gui, guiData;
    const container = ref();
    const img_url = ref("src\\assets\\tiger.svg");
    //

    function init() {
        //
        camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
        camera.position.set( 0, 0, 200 );

        //

        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight);
        container.value.appendChild( renderer.domElement );

        //

        const controls = new OrbitControls( camera, renderer.domElement );
        controls.addEventListener( 'change', render );
        controls.screenSpacePanning = true;

        //

        window.addEventListener( 'resize', onWindowResize );

        guiData = {
            currentURL: 'src\\assets\\tiger.svg',
            drawFillShapes: true,
            drawStrokes: true,
            fillShapesWireframe: false,
            strokesWireframe: false
        };

        loadSVG( guiData.currentURL );

        createGUI();

    }

    function createGUI() {

        if ( gui ) gui.destroy();

        gui = new GUI();

        gui.add( guiData, 'currentURL', {

            'svg': 'src\\assets\\svg.svg',
            'vue': 'src\\assets\\vue.svg',
            'tiger': 'src\\assets\\tiger.svg',
            '123': 'src\\assets\\123.svg'
        } ).name( 'SVG File' ).onChange( update );

        gui.add( guiData, 'drawStrokes' ).name( 'Draw strokes' ).onChange( update );

        gui.add( guiData, 'drawFillShapes' ).name( 'Draw fill shapes' ).onChange( update );

        gui.add( guiData, 'strokesWireframe' ).name( 'Wireframe strokes' ).onChange( update );

        gui.add( guiData, 'fillShapesWireframe' ).name( 'Wireframe fill shapes' ).onChange( update );

        function update() {

            loadSVG( guiData.currentURL );

        }

    }

    function loadSVG( url ) {

        //

        scene = new THREE.Scene();
        scene.background = new THREE.Color( 0x000000 );
        

        //

        const helper = new THREE.GridHelper( 160, 10, 0x8d8d8d, 0xc1c1c1 );
        helper.rotation.x = Math.PI / 2;
        scene.add( helper );

        //

        const loader = new SVGLoader();
        loader.load( url, function ( data ) {
            
            const group = new THREE.Group();
            group.scale.multiplyScalar( 0.25 );
            group.position.x = -70;
            group.position.y = 70;
            group.scale.y *= - 1;

            let renderOrder = 0;
            for ( const path of data.paths ) {

                const fillColor = path.userData.style.fill;

                if ( guiData.drawFillShapes && fillColor !== undefined && fillColor !== 'none' ) {

                    const material = new THREE.MeshBasicMaterial( {
                        color: new THREE.Color().setStyle( fillColor ),
                        opacity: path.userData.style.fillOpacity,
                        transparent: true,
                        side: THREE.DoubleSide,
                        depthWrite: false,
                        wireframe: guiData.fillShapesWireframe
                    } );

                    const shapes = SVGLoader.createShapes( path );

                    for ( const shape of shapes ) {

                        const geometry = new THREE.ShapeGeometry( shape );
                        const mesh = new THREE.Mesh( geometry, material );
                        mesh.renderOrder = renderOrder ++;

                        group.add( mesh );

                    }

                }

                const strokeColor = path.userData.style.stroke;

                if ( guiData.drawStrokes && strokeColor !== undefined && strokeColor !== 'none' ) {

                    const material = new THREE.MeshBasicMaterial( {
                        color: new THREE.Color().setStyle( strokeColor ),
                        opacity: path.userData.style.strokeOpacity,
                        transparent: true,
                        side: THREE.DoubleSide,
                        depthWrite: false,
                        wireframe: guiData.strokesWireframe
                    } );

                    for ( const subPath of path.subPaths ) {

                        const geometry = SVGLoader.pointsToStroke( subPath.getPoints(), path.userData.style );

                        if ( geometry ) {

                            const mesh = new THREE.Mesh( geometry, material );
                            mesh.renderOrder = renderOrder ++;

                            group.add( mesh );

                        }

                    }

                }

            }

            const worldPosition = new THREE.Vector3();
            group.getWorldPosition(worldPosition);
            console.log('世界坐标',worldPosition);
            console.log('本地坐标',group.position);

            scene.add( group );

            render();

        } );

    }

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );
        render();

    }

    function render() {

        renderer.render( scene, camera );

    }

    //挂载完毕获取dom  
    onMounted(()=>{  
        init();
    })
</script>