<template>
    <!-- <div>
        <img :src="img_url">
    </div> -->
    <div ref="container1" v-show="false"></div>
    <div ref="container2"></div>
</template>

<script setup>
    import {ref, onMounted} from 'vue';
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
    //import {ParametricGeometries} from 'three/addons/geometries/ParametricGeometries.js';
    import * as dat from 'dat.gui';
    import Stats from 'three/addons/libs/stats.module.js';
    import WebGL from 'three/addons/capabilities/WebGL.js';
    import {SVGRenderer, SVGObject } from 'three/addons/renderers/SVGRenderer.js';

    const container1 = ref();
    const container2 = ref();
    let camera1, scene1, renderer1;
    let camera2, scene2, renderer2;
    const width = 1200, height = 1200;
    const fileLoader = new THREE.FileLoader();
    function init1(){
        // 创建一个场景
        scene1 = new THREE.Scene();
        
        // 创建一个相机
        camera1 = new THREE.PerspectiveCamera(75, width / height, 1, 10000);
        const z =  600 + (height/2)/Math.tan(75);
        camera1.position.set(0, 0, z);
        //lookAt和OrbitControls二选一，二者都没有时不显示渲染结果
        camera1.lookAt(0,0,0);

        // 创建一个WebGL渲染器
        renderer1 = new THREE.WebGLRenderer({
            antialias:true,
            //想把canvas画布上内容下载到本地，需要设置为true
            preserveDrawingBuffer:true,
        });
        renderer1.setSize(width, height);
        container1.value.appendChild(renderer1.domElement);
    }


    function initHelper2() {
        const helper = new THREE.GridHelper( width, 3, 0x8d8d8d, 0xc1c1c1 );
        helper.position.set(0,0,0);
        helper.rotation.x = Math.PI / 2;
        scene2.add( helper );
    }

    function initHelper1() {
        const helper = new THREE.GridHelper( width, 3, 0x8d8d8d, 0xc1c1c1 );
        helper.position.set(0,0,0);
        helper.rotation.x = Math.PI / 2;
        scene1.add( helper );
    }

    let stats;
    function initStats(){
        stats = new Stats();
        document.body.appendChild(stats.domElement);
    }
    let controls2;
    function initControls2(){
        controls2 = new OrbitControls(camera2, renderer2.domElement);
        // 如果使用animate方法时，将此函数删除
        //controls.addEventListener('change', renderer.render(camera, scene));
        // 使动画循环使用时阻尼或自传，意思是否有惯性
        controls2.enableDamping = true;
        // 动态阻尼系数，就是鼠标拖拽旋转的灵敏度
        controls2.dampingFactor = 0.25
        // 是否可以缩放
        controls2.enableZoom = true;
        // 是否自动旋转
        controls2.enableRotate = true;
        controls2.autoRotate = false;
        // 设置相机距离原点的最近距离
        controls2.minDistance = 1;
        // 设置相机距离原点的最远距离
        controls2.maxDistance = 1000;
        // 是否开启右键拖拽
        controls2.enablePan = true;
    }

    let controls1;
    function initControls1(){
        controls1 = new OrbitControls(camera1, renderer1.domElement);
        // 如果使用animate方法时，将此函数删除
        //controls.addEventListener('change', renderer.render(camera, scene));
        // 使动画循环使用时阻尼或自传，意思是否有惯性
        controls1.enableDamping = true;
        // 动态阻尼系数，就是鼠标拖拽旋转的灵敏度
        controls1.dampingFactor = 0.25
        // 是否可以缩放
        controls1.enableZoom = true;
        // 是否自动旋转
        controls1.enableRotate = true;
        controls1.autoRotate = false;
        // 设置相机距离原点的最近距离
        controls1.minDistance = 1;
        // 设置相机距离原点的最远距离
        controls1.maxDistance = 1000;
        // 是否开启右键拖拽
        controls1.enablePan = true;
    }

    let gui = new dat.GUI();
    function initGui(){
        const posFolder = gui.addFolder("相机位置");
        posFolder.add(camera1.position, "x", -100, 100);
        posFolder.add(camera1.position, "y", -100, 100);
        posFolder.add(camera1.position, "z", -1000, 1000);
    }

    let svgElement;
    const svg_url = 'src\\assets\\svg.svg';
    const sucai_url = 'src\\assets\\hellokitty.png';
    const group_id = "组 5";
    function viewmode1(){
        // 控制点数组(threejs坐标原点在canvas正中间，x轴正方向向左，y轴正方向向上)
        let controlPoints;

        // 贝塞尔基函数
        function bernstein(t, i, n) {
            const binomial = (factorial(n) / (factorial(i) * factorial(n - i)));
            return binomial * Math.pow(t, i) * Math.pow(1 - t, n - i);
        }

        // 计算贝塞尔曲面上的点
        function bezierSurface(u, v, target) {
            const n = controlPoints.length - 1;
            const m = controlPoints[0].length - 1;
            let point = new THREE.Vector3(0, 0, 0);

            for (let i = 0; i <= n; i++) {
                for (let j = 0; j <= m; j++) {
                const weight = bernstein(u, i, n) * bernstein(v, j, m);
                point.add(controlPoints[i][j].clone().multiplyScalar(weight));
                }
            }
            target.set(point.x, point.y, point.z);
        }

        // 阶乘函数
        function factorial(x) {
            if (x === 0) return 1;
            let f = 1;
            for (let i = 1; i <= x; i++) f *= i;
            return f;
        }

        return new Promise(function (resolve, reject){
            // 控制点数据(ps坐标原点在左上角，x轴正方向向右，y轴正方向向下)
            //异步加载，加载完后需要渲染一次，不然不显示
            fileLoader.load( svg_url, function ( svg ) {

                const node = document.createElementNS( 'http://www.w3.org/2000/svg', 'g' );
                const parser = new DOMParser();
                svgElement = parser.parseFromString( svg, 'image/svg+xml' ).documentElement;
                const smartObject = svgElement.getElementById(group_id).childNodes[1];
                const xCoords = smartObject.getAttribute('data-points-x').split(',');
                const yCoords = smartObject.getAttribute('data-points-y').split(',');
                const data_matrix3 = smartObject.getAttribute('data-matrix3').split(',');
                const trans_matrix3 = new THREE.Matrix3().fromArray(data_matrix3);
                let data_BoundingRect = smartObject.getAttribute('data-BoundingRect').split(',');
                let data_points = new Array(16).fill(0);
                // 控制点初始化
                for (let i = 0; i < 16; i++){
                    //把原点坐标移动到threejs原点
                    data_points[i] = new THREE.Vector3(-parseFloat(xCoords[i]) + width/2, -parseFloat(yCoords[i])+ height/2, 1);
                }

                const scale_rotation_matrix3 =  trans_matrix3.transpose();
                for (let i = 0; i < 16; i++){
                    data_points[i].applyMatrix3(scale_rotation_matrix3);
                }

                // 控制点初始区域左上角角点
                const left = data_points.reduce((currMin, curr) => {
                    return Math.max(currMin, curr.x);
                }, Number.MIN_VALUE);
                const right = data_points.reduce((currMax, curr) => {
                    return Math.min(currMax, curr.x);
                }, Number.MAX_VALUE);
                const top = data_points.reduce((currMax, curr) => {
                    return Math.max(currMax, curr.y);
                }, Number.MIN_VALUE);
                const bottom = data_points.reduce((currMax, curr) => {
                    return Math.min(currMax, curr.y);
                }, Number.MAX_VALUE);

                data_BoundingRect[0] = -data_BoundingRect[0] + width/2;
                data_BoundingRect[1] = -data_BoundingRect[1] + height/2;

                const translate_matrix3 = new THREE.Matrix3().makeTranslation(new THREE.Vector2(data_BoundingRect[0] - left, data_BoundingRect[1] - top));

                for (let i = 0; i < 16; i++){
                    data_points[i].applyMatrix3(translate_matrix3);
                }

                controlPoints = new Array(4);
                for (let i = 0; i < 4; i++) {
                    controlPoints[i] = new Array(4);
                    for (let j = 0; j < 4; j++) {
                        controlPoints[i][j] = data_points[i*4 + j];
                    }
                }
                // 创建贝塞尔曲面的几何体
                const geometry = new ParametricGeometry(bezierSurface, 20, 20);

                // const box1 = new THREE.PlaneGeometry(data_BoundingRect[2], data_BoundingRect[3]);
                // const material1 = new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide, wireframe: true})
                // const plane = new THREE.Mesh(box1, material1);
                // plane.position.set(data_BoundingRect[0] - data_BoundingRect[2]/2,data_BoundingRect[1] - data_BoundingRect[3]/2,0);
                // scene1.add(plane);

                // const box2 = new THREE.PlaneGeometry(left - right, top - bottom);
                // const material2 = new THREE.MeshBasicMaterial({color: 0x0000ff, side: THREE.DoubleSide, wireframe: true})
                // const plane2 = new THREE.Mesh(box2, material2);
                // plane2.position.set((left + right)/2,(top + bottom)/2,0);
                // scene1.add(plane2);

                // initHelper1();
                // const axes = new THREE.AxesHelper(100);
                // scene1.add(axes);


                // 创建一个纹理
                //const texture = new THREE.TextureLoader().load('src\\assets\\hellokitty.png');
                createSucai(sucai_url).then(image => {
                    const texLoader = new THREE.TextureLoader();
                    texLoader.load(image, (texture) => {
                        // 旋转纹理
                        texture.rotation = Math.PI / 2; // 90度
                        texture.center.set(0.5, 0.5);  // 设置中心为纹理的中心
                        texture.minFilter = THREE.NearestFilter;
                        texture.magFilter = THREE.NearestFilter;
                        // 创建材质
                        const material = new THREE.MeshBasicMaterial({ 
                            map:texture,
                            side:THREE.DoubleSide,
                            //transparent:false,
                            alphaTest: 0, // 保留透明度小于 0 的像素,
                            transparent: true,
                            opacity: 1 // 1 表示完全不透明
                        });
                        
                        // 创建网格并添加到场景中
                        const bezierSurfaceMesh = new THREE.Mesh(geometry, material);
                        scene1.add(bezierSurfaceMesh);
                        renderer1.render(scene1, camera1);
                    });
                })

            } );
        });
    }

    function init2() {

        camera2 = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
        //const z =  (window.innerHeight/2)/Math.tan(50);
        const z = 1000;
        console.log(z);
        camera2.position.set( 0, 0, z);

        scene2 = new THREE.Scene();

        let sucaiDiy = document.createElementNS('http://www.w3.org/2000/svg',"image");
        sucaiDiy.setAttribute("crossOrigin", "anonymous");
        sucaiDiy.setAttribute("id", "hellokitty");
        sucaiDiy.setAttribute("width", "1200");
        sucaiDiy.setAttribute("height", "1200");
        sucaiDiy.setAttribute("xlink:href", renderer1.domElement.toDataURL("image/png"));
        sucaiDiy.setAttribute("href", renderer1.domElement.toDataURL("image/png"));
        svgElement.getElementsByTagName("defs")[0].appendChild(sucaiDiy);
        let sucai5 = svgElement.getElementById(group_id).childNodes[1];

        sucai5.setAttribute("xlink:href", "#hellokitty");
        sucai5.setAttribute("href", "#hellokitty");

        // const a = document.createElement('a');
        // a.href = renderer1.domElement.toDataURL("image/png");
        // a.download = "sucai5.png";
        // document.body.appendChild(a);
        // a.click();

        // const svgData = new XMLSerializer().serializeToString(svgElement);
        // const blob = new Blob([svgData], {type:'image/svg+xml'});
        // const url = URL.createObjectURL(blob);
        // const downloadLink = document.createElement('a');
        // downloadLink.href = url;
        // downloadLink.download = 'image.svg';
        // downloadLink.style.display = 'none';
        // document.body.appendChild(downloadLink);
        // downloadLink.click();

        const node = document.createElementNS( 'http://www.w3.org/2000/svg','svg');
        node.appendChild(svgElement);
        const object = new SVGObject(node);
        object.position.set(0,0,0);
        scene2.add( object );

        renderer2 = new SVGRenderer();
        renderer2.setSize( window.innerWidth, window.innerHeight );
        //renderer2.setQuality( 'low' );
        container2.value.appendChild( renderer2.domElement );
    }


    function animate(){
        //controls1.update();
        controls2.update();
        //renderer1.render(scene1, camera1);
        renderer2.render(scene2, camera2);
        stats.update();

        requestAnimationFrame(animate);
    }

    //挂载完毕获取dom  
    onMounted(()=>{
        if ( WebGL.isWebGL2Available() ) {
            
            // Initiate function or other initializations here
            //container.value.appendChild(renderer.domElement);
            initStats();
            init1();            
            //initControls1();
            // animate();
            viewmode1().then(function(){
                init2();
                initControls2();
                initHelper2();
                animate();
            });
            initGui();
            
        } else {
            console.log('WebGL2 is not Available!');
            const warning = WebGL.getWebGL2ErrorMessage();
            document.body.appendChild( warning );
            
        }
    })
    
    function createSucai(imgpath) {
        return new Promise((resolve, rejects) => {
            const canvas = document.createElement('canvas');
            canvas.width = 1000;
            canvas.height = 1000;
            const img = new Image();
            
            img.onload = function() {
                let width = img.width;
                let height = img.height;
                if (width/height > 1){
                    height *= 1000/width;
                    width = 1000;
                }else{
                    width *= 1000/height;
                    height = 1000;
                }

                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF'; // 设置填充颜色为白色
                ctx.fillRect(0,0,1000,1000);
                if(width == 1000){
                    const offset = (1000 - height)/2;
                    ctx.drawImage(img, 0, offset, 1000, height);
                }else{
                    const offset = (1000 - width)/2;
                    ctx.drawImage(img, offset, 0, width, 1000);
                }


                // const a = document.createElement('a');
                // a.href = canvas.toDataURL('image/jpeg');
                // a.download = "sucai.jpg";
                // document.body.appendChild(a);
                // a.click();

                resolve(canvas.toDataURL('image/jpeg'));
            }
            img.onerror = () => rejects(new Error('Could not load image at ' + imgpath));

            img.src = imgpath;
        });
        }
</script>