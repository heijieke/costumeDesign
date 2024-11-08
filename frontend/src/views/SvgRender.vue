<template>
    <!-- <div>
        <img :src="img_url">
    </div> -->
    <div ref="container"></div>
</template>

<script setup>
    import {ref, onMounted} from 'vue';
    import * as THREE from 'three';

    import Stats from 'three/addons/libs/stats.module.js';

    import { SVGRenderer, SVGObject } from '@/utils/SVGRenderer.js';

    THREE.ColorManagement.enabled = false;

    let camera, scene, renderer, stats;
    const container = ref();

    function init() {

        camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
        camera.position.set( 0, 0, 100 );

        scene = new THREE.Scene();
        scene.background = new THREE.Color( 0x000000 );

        // const helper = new THREE.GridHelper( 160, 10, 0x8d8d8d, 0xc1c1c1 );
        // helper.rotation.x = Math.PI / 2;
        // scene.add( helper );

        // CUSTOM FROM FILE

        const fileLoader = new THREE.FileLoader();
        //异步加载，加载完后需要渲染一次，不然不显示
        fileLoader.load( 'src\\assets\\svg.svg', function ( svg ) {

            const node = document.createElementNS( 'http://www.w3.org/2000/svg', 'g' );
            const parser = new DOMParser();
            const doc = parser.parseFromString( svg, 'image/svg+xml' );

            node.appendChild( doc.documentElement );

            const object = new SVGObject( node );
            object.position.x = -15;
            object.position.y = 15;
            scene.add( object );
            render();
        } );

        renderer = new SVGRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setQuality( 'low' );
        container.value.appendChild( renderer.domElement );

        //

        window.addEventListener( 'resize', onWindowResize );
        render();
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