<template>
    <div ref="container"></div>
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

    const container = ref();

    const screenRenderer = new THREE.WebGLRenderer({
        antialias:true
    });
    const width = 1200, height = 1200;
    screenRenderer.setSize(width, height);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const distance = (width/2) / Math.tan(THREE.MathUtils.degToRad(75 / 2));
    camera.position.z = distance;
    //lookAt和OrbitControls二选一，二者都没有时不显示渲染结果

    const fileLoader = new THREE.FileLoader();

    const helper = new THREE.GridHelper( width, 3, 0x8d8d8d, 0xc1c1c1 );
    helper.position.set(0,0,0);
    helper.rotation.x = Math.PI / 2;
    helper.scale.set(0.1,0.1,0.1);
    scene.add( helper );

    const stats = new Stats();
    document.body.appendChild(stats.domElement);

    const controls = new OrbitControls(camera, screenRenderer.domElement);
    controls.enableDamping = true;
    // 动态阻尼系数，就是鼠标拖拽旋转的灵敏度
    controls.dampingFactor = 0.25
    // 是否可以缩放
    controls.enableZoom = true;
    // 是否自动旋转
    controls.enableRotate = true;
    controls.autoRotate = false;
    // 设置相机距离原点的最近距离
    controls.minDistance = 1;
    // 设置相机距离原点的最远距离
    controls.maxDistance = 10000;
    // 是否开启右键拖拽
    controls.enablePan = true;

    const gui = new dat.GUI();
    const posFolder = gui.addFolder("相机位置");
    posFolder.add(camera.position, "x", -100, 100);
    posFolder.add(camera.position, "y", -100, 100);
    posFolder.add(camera.position, "z", -5000, 5000, 10);

    const svg_url = 'src\\assets\\svg.svg';
    const sucai_url = 'src\\assets\\hellokitty.png';
    const group_id = '组 5';
    // 控制点数组(threejs坐标原点在canvas正中间，x轴正方向向左，y轴正方向向上)
    const controlPoints = new Array(4);

    const fileload = () => {
        return new Promise((resolve, reject) => {
            fileLoader.load( svg_url, function ( svg ) {
                console.log('begin load svg!')
                const texLoader = new THREE.TextureLoader();
                const parser = new DOMParser();
                const svgElement = parser.parseFromString( svg, 'image/svg+xml' ).documentElement;
                const smartObjects = svgElement.getElementById(group_id).childNodes[1];

                const xCoords = smartObjects.getAttribute('data-points-x').split(',');
                const yCoords = smartObjects.getAttribute('data-points-y').split(',');
                const data_BoundingRect = smartObjects.getAttribute('data-affine').split(',');
                // const data_matrix3 = smartObjects.getAttribute('data-matrix3').split(',');
                // const trans_matrix3 = new THREE.Matrix3().fromArray(data_matrix3);

                // const yCoords = [142.62429494546905, 10.73386288361805, 610.5627168082913, -572.3664771005331, 739.3203361084458, 10.552130891512547, 331.6144603206903, -217.7844850507654, 689.7839034684949, 557.5613843021978, 657.2315947051209, 809.9755341699324, 1007.1745805387861, 1015.5852705885048, 1000.3606209192009, 1031.5970152904126]
                // const xCoords = [-457.467770633978, 264.36957547169516, 893.5363017944867, 295.1463987112641, -101.87633855907785, -114.52123826102039, 746.6537080426476, 1061.3335490928798, -26.839697666995278, 155.43910694244227, 611.4338449416769, 1270.7087312291578, -268.61150638648314, 217.02452117222688, 594.4581450014324, 838.6661758759734]
                // const data_BoundingRect = [-292.43043756707436, 769.3929679424937, 1032.806581544981, -700.3214131612715, 2399.194778734156, 531.7466979454346, 1073.9577596221006, 2001.4610790491997]
                

                
                let data_points = new Array(16).fill(0);
                // 控制点初始化
                for (let i = 0; i < 16; i++){
                    //把原点坐标移动到threejs原点
                    data_points[i] = new THREE.Vector3(parseFloat(xCoords[i]) - width/2, -parseFloat(yCoords[i]) + height/2, 1);
                }
                for(let i = 0; i < 8; i += 2) {
                    data_BoundingRect[i] = parseFloat(data_BoundingRect[i]) - width/2;
                    data_BoundingRect[i+1] = -parseFloat(data_BoundingRect[i+1]) + height/2;
                }

                // 控制点初始区域左上角角点
                const left = data_points.reduce((currMin, curr) => {
                    return Math.min(currMin, curr.x);
                }, Number.MAX_VALUE);
                const right = data_points.reduce((currMax, curr) => {
                    return Math.max(currMax, curr.x);
                }, Number.MIN_VALUE);
                const top = data_points.reduce((currMax, curr) => {
                    return Math.max(currMax, curr.y);
                }, Number.MIN_VALUE);
                const bottom = data_points.reduce((currMax, curr) => {
                    return Math.min(currMax, curr.y);
                }, Number.MAX_VALUE);
                const control_rect = new Array(4);
                control_rect[0] = new THREE.Vector2(left,top);
                control_rect[1] = new THREE.Vector2(right,top);
                control_rect[2] = new THREE.Vector2(right,bottom);
                control_rect[3] = new THREE.Vector2(left,bottom);

                
                //计算旋转缩放矩阵
                // transform_box边长
                const box_width = Math.sqrt(Math.pow(data_BoundingRect[2] - data_BoundingRect[0],2)+Math.pow(data_BoundingRect[3] - data_BoundingRect[1],2));
                const box_height = Math.sqrt(Math.pow(data_BoundingRect[6] - data_BoundingRect[0],2)+Math.pow(data_BoundingRect[7] - data_BoundingRect[1],2));

                const rotation = Math.atan((data_BoundingRect[3] - data_BoundingRect[1])/(data_BoundingRect[2] - data_BoundingRect[0]))

                const sx = box_width / (right - left)
                const sy = box_height / (top - bottom)

                const trans_matrix3 = new THREE.Matrix3();
                trans_matrix3.set(
                    sx * Math.cos(rotation), sx * Math.sin(rotation), 0,
                    -sy * Math.sin(rotation), sy * Math.cos(rotation), 0,
                    0, 0, 1
                );

                const scale_rotation_matrix3 =  trans_matrix3.transpose();
                console.log(scale_rotation_matrix3);
                for (let i = 0; i < 16; i++){
                    data_points[i].applyMatrix3(scale_rotation_matrix3);
                }
                
                for (let i = 0; i < 4; i++){
                    control_rect[i].applyMatrix3(scale_rotation_matrix3);
                }

                const translate_matrix3 = new THREE.Matrix3().makeTranslation(new THREE.Vector2(data_BoundingRect[0] - control_rect[0].x, data_BoundingRect[1] - control_rect[0].y));

                for (let i = 0; i < 16; i++){
                    data_points[i].applyMatrix3(translate_matrix3);
                }

                
                for (let i = 0; i < 4; i++){
                    control_rect[i].applyMatrix3(translate_matrix3);
                }

                for (let i = 0; i < 4; i++) {
                    controlPoints[i] = new Array(4);
                    for (let j = 0; j < 4; j++) {
                        controlPoints[i][j] = data_points[i*4 + j];
                    }
                }

                const box1 = new THREE.BufferGeometry();
                const vertices = new Float32Array([
                    data_BoundingRect[0], data_BoundingRect[1], 0, //顶点1坐标
                    data_BoundingRect[2], data_BoundingRect[3], 0, //顶点2坐标
                    data_BoundingRect[4], data_BoundingRect[5], 0, //顶点3坐标
                    data_BoundingRect[6], data_BoundingRect[7], 0, //顶点4坐标
                ]);

                const indices = [
                    0, 1, 2,
                    2, 3, 0,
                ]

                box1.setIndex(indices);
                box1.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

                const material1 = new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide, wireframe:true});
                const plane = new THREE.Mesh(box1, material1);
                //plane.position.set((data_BoundingRect[0] + data_BoundingRect[4])/2,(data_BoundingRect[1] - data_BoundingRect[5])/2,0);
                plane.scale.set(0.1,0.1,0.1);
                scene.add(plane);

                const box2 = new THREE.BufferGeometry();
                box2.setIndex(indices);
                box2.setFromPoints(control_rect);
                console.log(box2.attributes.position);
                const material2 = new THREE.MeshBasicMaterial({color: 0x0000ff, side: THREE.DoubleSide, wireframe: true})
                const plane2 = new THREE.Mesh(box2, material2);
                //plane2.position.set((left + right)/2,(top + bottom)/2,0);
                plane2.scale.set(0.1,0.1,0.1);
                scene.add(plane2);

                const pointGeo = new THREE.BufferGeometry();
                pointGeo.setFromPoints(data_points);
                const pointsMaterial = new THREE.PointsMaterial({
                    color: 0xff0000,
                    size: 3.0
                });
                const points = new THREE.Points(pointGeo, pointsMaterial);
                points.scale.set(0.1,0.1,0.1);
                scene.add(points);

                const axes = new THREE.AxesHelper(100);
                scene.add(axes);

                // 创建贝塞尔曲面的几何体
                const geometry = new ParametricGeometry(bezierSurface, 20, 20);

                // 创建纹理
                texLoader.load(sucai_url,(texture) => {
                    console.log('begin load texture ');
                    // 创建材质
                    const material = new THREE.ShaderMaterial({ 
                        uniforms: {
                            img_texture: { type: 't', value: texture},
                            imageWidth: { value: texture.image.width},
                            imageHeight: { value: texture.image.height},
                            planeWidth: { value: width},
                            planeHeight: { value: height},
                            backgroundColor: { value: new THREE.Color(0xffffff)},
                        },
                        vertexShader: `
                            varying vec2 vUv;
                            void main() {
                                vUv = uv;  // 将纹理坐标传递到片段着色器
                                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                            }
                        `,
                        fragmentShader: fragment_shader,
                        side:THREE.DoubleSide
                    });

                    // 创建mesh并添加到场景中
                    const bezierSurfaceMesh = new THREE.Mesh(geometry, material);
                    bezierSurfaceMesh.scale.set(0.1, 0.1, 0.1);  // 根据需要调整物体的大小
                    scene.add(bezierSurfaceMesh);
                    
                    screenRenderer.render(scene, camera);

                    console.log('load complete!');
                    resolve('load complete!');
                });
            });
        });
    }

    function animate(){
        screenRenderer.render(scene, camera);
        controls.update();
        
        requestAnimationFrame(animate);
    }

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


    const fragment_shader = 
    `
        uniform sampler2D img_texture;
        uniform float imageWidth;
        uniform float imageHeight;
        uniform float planeWidth;
        uniform float planeHeight;
        uniform vec3 backgroundColor;
        varying vec2 vUv;

        void main() {
            float rad = radians(90.0);
            mat3 rotationMatrix = mat3(cos(rad), -sin(rad), 0.0, sin(rad), cos(rad), 0.0, 0.0, 0.0, 1.0);
            vec3 vUv3 = vec3(vUv.x - 0.5, vUv.y - 0.5, 1.0);
            vUv3 = rotationMatrix * vUv3;
            vec2 vUv2 = vec2(vUv3.x + 0.5, vUv3.y + 0.5);

            // 计算纹理的有效区域偏移
            float scaleX = planeWidth / imageWidth;
            float scaleY = planeHeight / imageHeight;
            float scale = min(scaleX, scaleY);

            // 计算纹理坐标的偏移量，使图片居中
            float offsetX = (planeWidth - imageWidth * scale) / 2.0;
            float offsetY = (planeHeight - imageHeight * scale) / 2.0;

            // 缩放并偏移UV坐标
            vec2 uvScaled = vUv2 * vec2(planeWidth, planeHeight);  // 转换为平面上的像素坐标

            // 判断该像素是否在有效的纹理区域内
            if (uvScaled.x >= offsetX && uvScaled.x <= offsetX + imageWidth * scale &&
                uvScaled.y >= offsetY && uvScaled.y <= offsetY + imageHeight * scale) {
                // 在有效区域，采样纹理
                vec4 texColor = texture2D(img_texture, vUv2);
                gl_FragColor = texColor;
            } else {
                // 超出有效区域，渲染背景颜色
                gl_FragColor = vec4(backgroundColor, 1.0);
            }
        }
    `

    fileload().then(() => {
        console.log('文件加载完毕!');
        animate();
    });
    
    //挂载完毕获取dom  
    onMounted(()=>{
        if ( WebGL.isWebGL2Available() ) {
            container.value.appendChild(screenRenderer.domElement);
            // Initiate function or other initializations here
            console.log('开始挂载!');
        } else {
            console.log('WebGL2 is not Available!');
            const warning = WebGL.getWebGL2ErrorMessage();
            document.body.appendChild( warning );
        }
    })

</script>