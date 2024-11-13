<template>
    <div ref="container1" v-show="false"></div>
    <div ref="container2" v-show="true"></div>
</template>

<script setup>
    import {ref, onMounted} from 'vue';
    import * as THREE from 'three';
    import WebGL from 'three/addons/capabilities/WebGL.js';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  

    const container1 = ref();
    let camera1, scene1, renderer1;
    const container2 = ref();
    let camera2, scene2, renderer2;


    function init1(){
        // 创建一个场景
        scene1 = new THREE.Scene();
        
        // 创建一个相机
        camera1 = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera1.position.set(0,0,10);

        // 创建一个WebGL渲染器
        renderer1 = new THREE.WebGLRenderer({
            antialias:true
        });
        renderer1.setSize(window.innerWidth, window.innerHeight);
        container1.value.appendChild(renderer1.domElement);
        const controls = new OrbitControls(camera1, renderer1.domElement);
        const axes = new THREE.AxesHelper();
        scene1.add(axes);
    }

    function viewmode1(){
        const material = new THREE.LineBasicMaterial({color: 0xff00ff});
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        vertices.push(-0.75, -0.75, -0.75);
        vertices.push(0.75, 0.75, 0.75);
        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(vertices, 3));
        let line = new THREE.Line(geometry, material);
        scene1.add(line);
        renderer1.render(scene1, camera1);
    }

    function init2(){
        // 创建一个场景
        scene2 = new THREE.Scene();
        
        // 创建一个相机
        camera2 = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera2.position.set(0,0,10);

        // 创建一个WebGL渲染器
        renderer2 = new THREE.WebGLRenderer({
            antialias:true
        });
        renderer2.setSize(window.innerWidth, window.innerHeight);
        container2.value.appendChild(renderer2.domElement);
        const controls = new OrbitControls(camera2, renderer2.domElement);
        const axes = new THREE.AxesHelper();
        scene2.add(axes);
    }

    function computeCoonsBicubicSurface() {
        setupFourPoints();
        surfacePoints.length = 0;
        let uVal, wVal;

        for (let j = 0; j <= noDivisions; ++j) {
            wVal = j * step;

            for (let i = 0; i <= noDivisions; ++i) {
            uVal = i * step;
            let pt = computePointOnSurface(uVal, wVal);
            surfacePoints.push(pt.xVal, pt.yVal, pt.zVal);
            }
        }
        renderCoonsBicubicSurface();
        handleUWValue();
    }

    function renderCoonsBicubicSurface() {
        scene.remove(surfaceMesh);
        scene.remove(lineWire);

        let material = new THREE.MeshStandardMaterial({
            side: THREE.DoubleSide,
            color: 0x00ffff,
            emissive: 0x111111,
            dithering: true,
            flatShading: false,
            roughness: 1,
            metalness: 0.15,
            skinning: true,
        });

        let materialLine = new THREE.LineBasicMaterial({
            color: 0x00ffff,
        });

        let geometry = new THREE.BufferGeometry();
        const indices = [];
        indices.length = 0;

        for (let i = 0; i < noDivisions; i++) {
            for (let j = 0; j < noDivisions; j++) {
                const a = i * (noDivisions + 1) + (j + 1);
                const b = i * (noDivisions + 1) + j;
                const c = (i + 1) * (noDivisions + 1) + j;
                const d = (i + 1) * (noDivisions + 1) + (j + 1);

                // generate two faces (triangles) per iteration

                indices.push(a, b, d); // face one
                indices.push(b, c, d); // face two
            }
        }

        geometry.setIndex(indices);
        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(surfacePoints, 3).onUpload(disposeArray)
        );
        geometry.computeVertexNormals();

        surfaceMesh = new THREE.Mesh(geometry, material);
        scene.add(surfaceMesh);

        let surfaceWire = new THREE.WireframeGeometry(geometry);
        lineWire = new THREE.LineSegments(surfaceWire, materialLine);
        scene.add(lineWire);
        render();
    }

    function viewmodel2(){
        scene2.add(new THREE.HemisphereLight(0x606060, 0x404040));

        // White directional light at 0.65 intensity shining from the top.
        let directionalLight = new THREE.DirectionalLight(0xffffff, 0.65);
        scene2.add(directionalLight);
    }

    function animate(){
        renderer1.render(scene1, camera1);
        renderer2.render(scene2, camera2);
        requestAnimationFrame(animate);
    }

    //挂载完毕获取dom  
    onMounted(()=>{
        if ( WebGL.isWebGL2Available() ) {
            
            init1();
            viewmode1();
            animate();
            
        } else {
            console.log('WebGL2 is not Available!');
            const warning = WebGL.getWebGL2ErrorMessage();
            document.body.appendChild( warning );
            
        }
    })
</script>