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
    import {parseSVG, makeAbsolute} from 'svg-path-parser';

    const container = ref();

    const screenRenderer = new THREE.WebGLRenderer({
        antialias:true,
        stencil: true,
        localClippingEnabled: true,
    });

    const scene = new THREE.Scene();
    //lookAt和OrbitControls二选一，二者都没有时不显示渲染结果

    const fileLoader = new THREE.FileLoader();

    const stats = new Stats();
    document.body.appendChild(stats.domElement);

    let controls;
    let camera;
    let points_num = 0;
    const offsetX = 100;
    const offsetY = 0;
    const svg_url = 'src\\assets\\image (1).svg';
    const sucai_url = 'src\\assets\\sucai2.png';
    const group_id = '组 3';
    // 控制点数组(threejs坐标原点在canvas正中间，x轴正方向向左，y轴正方向向上)
    const controlPoints = new Array(4);
    let svgElement;
    //const sucai_id = '771b1cae-fca6-6147-994d-5263a3e90c1e';
    let sucai_id = '4f2ccf10-5568-644f-8c9c-0bf74edb542f';
    const fileload = () => {
        return new Promise((resolve, reject) => {
            fileLoader.load( svg_url, function ( svg ) {
                const texLoader = new THREE.TextureLoader();
                const parser = new DOMParser();
                svgElement = parser.parseFromString( svg, 'image/svg+xml' ).documentElement;
                const width = svgElement.getAttribute('width');
                const height = svgElement.getAttribute('height');
                screenRenderer.setSize(width, height);
                camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
                const distance = (width/2) / Math.tan(THREE.MathUtils.degToRad(75 / 2));
                camera.position.z = distance;

                controls = new OrbitControls(camera, screenRenderer.domElement);
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

                const groups = svgElement.getElementsByTagName('g');
                for(let i = 0; i < groups.length; i++) {
                    const smartObject = groups[i].querySelector('use');
                    const clip_path = groups[i].getAttribute('clip-path').match(/#([^()]+)/)[1]
                    const path_data = svgElement.getElementById(clip_path).querySelector('path').getAttribute('d');
                    const paths = parseSVG(path_data);
                    makeAbsolute(paths);
                    console.log(smartObject);
                    if(smartObject.getAttribute('href') != ('#'+sucai_id)){
                        if (i == groups.length-1){
                            console.log('load complete!');
                            resolve('load complete!');
                        }
                        continue;
                    }

                    // if(i != 7){
                    //     if (i == smartObjects.length-1){
                    //         console.log('load complete!');
                    //         resolve('load complete!');
                    //     }
                    //     continue;
                    // }
                    let warpFlag = true;
                    if(!smartObject.getAttribute('data-points-x').includes(',')){
                        //不用自由形变
                        warpFlag = false;
                    }
                    const xCoords = smartObject.getAttribute('data-points-x').split(',');
                    const yCoords = smartObject.getAttribute('data-points-y').split(',');

                    let data_BoundingRect = smartObject.getAttribute('data-affine').split(',');
                    let data_points;
                    if(warpFlag){
                        data_points = new Array(16).fill(0);
                        // 控制点初始化
                        for (let i = 0; i < 16; i++){
                            //把原点坐标移动到threejs原点
                            data_points[i] = new THREE.Vector3(parseFloat(xCoords[i]) - width/2, -parseFloat(yCoords[i]) + height/2, 1);
                        }
                    }else{
                        data_points = new Array(4).fill(0);
                        //把原点坐标移动到threejs原点
                        data_points[0] = new THREE.Vector3(- width/2, height/2, 1);
                        data_points[1] = new THREE.Vector3(width/2, height/2, 1);
                        data_points[2] = new THREE.Vector3(width/2, -height/2, 1);
                        data_points[3] = new THREE.Vector3(- width/2, -height/2, 1);
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
                    if (warpFlag) {
                        for (let i = 0; i < 16; i++) {
                            data_points[i].applyMatrix3(scale_rotation_matrix3)
                        }
                    } else {
                        for (let i = 0; i < 4; i++) {
                            data_points[i].applyMatrix3(scale_rotation_matrix3)
                        }
                    }

                    const control_rect = new Array(4);
                    control_rect[0] = new THREE.Vector2(left,top);
                    control_rect[1] = new THREE.Vector2(right,top);
                    control_rect[2] = new THREE.Vector2(right,bottom);
                    control_rect[3] = new THREE.Vector2(left,bottom);
                    for (let i = 0; i < 4; i++){
                        control_rect[i].applyMatrix3(scale_rotation_matrix3);
                    }

                    const translate_matrix3 = new THREE.Matrix3().makeTranslation(new THREE.Vector2(data_BoundingRect[0] - control_rect[0].x, data_BoundingRect[1] - control_rect[0].y));

                    const boxGeo1 = new THREE.BufferGeometry();
                    const vertices1= new Float32Array([
                            left, top, 0.0,
                            right, top, 0.0,
                            right, bottom, 0.0,
                            left, bottom, 0.0,
                        ]);
                    const indices1 = [
                        0, 1, 2,
                        2, 3, 0,
                    ];
                    boxGeo1.setIndex(indices1);
                    boxGeo1.setAttribute('position', new THREE.BufferAttribute(vertices1, 3));
                    const material1 = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide,color: 0xff0000, wireframe:true} );
                    const boxMesh1 = new THREE.Mesh(boxGeo1, material1);
                    scene.add(boxMesh1);

                    const boxGeo2 = new THREE.BufferGeometry();
                    const vertices2= new Float32Array([
                            data_BoundingRect[0], data_BoundingRect[1], 0.0,
                            data_BoundingRect[2], data_BoundingRect[3], 0.0,
                            data_BoundingRect[4], data_BoundingRect[5], 0.0,
                            data_BoundingRect[6], data_BoundingRect[7], 0.0,
                        ]);
                    const indices2 = [
                        0, 1, 2,
                        2, 3, 0,
                    ];
                    boxGeo2.setIndex(indices2);
                    boxGeo2.setAttribute('position', new THREE.BufferAttribute(vertices2, 3));

                    const material2 = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide,color: 0x0000ff, wireframe:true} );
                    const boxMesh2 = new THREE.Mesh(boxGeo2, material2);
                    scene.add(boxMesh2);

                    let geometry;
                    if (warpFlag){
                        for (let i = 0; i < 16; i++){
                            data_points[i].applyMatrix3(translate_matrix3);
                        }

                        
                        for (let i = 0; i < 4; i++) {
                            controlPoints[i] = new Array(4);
                            for (let j = 0; j < 4; j++) {
                                controlPoints[i][j] = data_points[i*4 + j];
                            }
                        }
                        // 创建贝塞尔曲面的几何体
                        geometry = new ParametricGeometry(bezierSurface, 20, 20);
                    }else{
                        for (let i = 0; i < 4; i++){
                            data_points[i].applyMatrix3(translate_matrix3);
                        }
                        const vertices= new Float32Array([
                            data_points[0].x, data_points[0].y, data_points[0].z,
                            data_points[1].x, data_points[1].y, data_points[1].z,
                            data_points[2].x, data_points[2].y, data_points[2].z,
                            data_points[3].x, data_points[3].y, data_points[3].z,
                        ]);
                        const indices = [
                            0, 1, 2,
                            2, 3, 0,
                        ];
                        geometry = new THREE.BufferGeometry();
                        geometry.setIndex(indices);
                        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                        const uvs = new Float32Array([
                            0, 0,
                            1, 0,
                            1, 1,
                            0, 1,
                        ]);
                        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
                    }

                const axes = new THREE.AxesHelper(100);
                scene.add(axes);

                const path = new THREE.Path()
                let path_num = 0;
                for (let i = 0; i < paths.length; i++) {
                    switch (paths[i].code) {
                        case 'M':
                            path.moveTo(parseFloat(paths[i].x) - width / 2, -parseFloat(paths[i].y) + height / 2)
                            break
                        case 'C':
                            const p0 = new THREE.Vector2(parseFloat(paths[i].x1) - width / 2, -parseFloat(paths[i].y1) + height / 2)
                            const p1 = new THREE.Vector2(parseFloat(paths[i].x2) - width / 2, -parseFloat(paths[i].y2) + height / 2)
                            const p2 = new THREE.Vector2(parseFloat(paths[i].x) - width / 2, -parseFloat(paths[i].y) + height / 2)
                            path.bezierCurveTo(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y)
                            path_num++;
                            break
                        case 'Z':
                            break
                        default:
                            console.log('未知code:' + paths[i].code)
                    }
                }
                const points = path.getPoints(20);
                console.log(points)
                const pointArray = new Float32Array();
                points_num = 0;
                points.forEach((path) => {
                    path.forEach((point) => {
                        pointArray.add(new THREE.Vector2(point.x, point.y))
                        points_num++
                    })
                })

                // 创建纹理
                texLoader.load(sucai_url,(texture) => {
                    console.log('begin load texture ');
                    // 创建材质
                    const material = new THREE.ShaderMaterial({ 
                        uniforms: {
                            img_texture: { type: 't', value: texture},
                            points: { value: points }, // vec2数组
                            pathNum: { value: points.length }, // 数组长度
                            pathPointNum: { value: 20},
                            screenWidth: { value: width},
                            screenHeight: { value: height},
                        },
                        vertexShader: `
                            varying vec2 vUv;
                            void main() {
                                vUv = uv;  // 将纹理坐标传递到片段着色器
                                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                            }
                        `,
                        fragmentShader: fragment_shader,
                        side:THREE.DoubleSide,
                    });

                    // 旋转纹理
                    // texture.rotation = Math.PI / 2 // 90度
                    // texture.center.set(0.5, 0.5) // 设置中心为纹理的中心
                    // texture.minFilter = THREE.NearestFilter
                    // texture.magFilter = THREE.NearestFilter
                    // console.log(texture);
                    // const material = new THREE.MeshBasicMaterial({
                    //     //color: 0x00ff00,
                    //     map: texture,
                    //     side: THREE.DoubleSide,
                    //     transparent:false,
                    //     alphaTest: 0, // 保留透明度小于 0 的像素,
                    //     transparent: true,
                    //     opacity: 1, // 1 表示完全不透明
                    // })

                    // 创建mesh并添加到场景中
                    const bezierSurfaceMesh = new THREE.Mesh(geometry, material);
                    //bezierSurfaceMesh.scale.set(0.1, 0.1, 0.1);  // 根据需要调整物体的大小
                    scene.add(bezierSurfaceMesh);

                    // const movePoint = new THREE.Vector3();
                    // for (let i = 0; i < paths.length; i++) {
                    //     switch (paths[i].code) {
                    //         case 'M':
                    //             movePoint.x = parseFloat(paths[i].x)  - width/2;
                    //             movePoint.y = -parseFloat(paths[i].y) + height/2;
                    //             movePoint.z = 0;
                    //             break;
                    //         case 'C':
                    //             const p0 = new THREE.Vector2(parseFloat(paths[i].x1)  - width/2, -parseFloat(paths[i].y1) + height/2, 0);
                    //             const p1 = new THREE.Vector2(parseFloat(paths[i].x2)  - width/2, -parseFloat(paths[i].y2) + height/2, 0);
                    //             const p2 = new THREE.Vector2(parseFloat(paths[i].x)  - width/2, -parseFloat(paths[i].y) + height/2, 0);
                    //             const curve = new THREE.CubicBezierCurve3(movePoint, p0, p1, p2);
                    //             const points = curve.getPoints(50);
                    //             const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
                    //             const curveMaterial = new THREE.LineBasicMaterial({color: 0xff0000});
                    //             const curveObject = new THREE.Line(curveGeo, curveMaterial);
                    //             //curveObject.scale.set(0.1,0.1,0.1);
                    //             scene.add(curveObject);
                    //             movePoint.x = p2.x;
                    //             movePoint.y = p2.y;
                    //             break;
                    //         case 'Z':
                    //             break;
                    //         default:
                    //             console.log("未知code:"+paths[i].code);
                    //     }
                    // }


                    // const lineGeometry = new THREE.BufferGeometry().setFromPoints( points );
                    // const lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff } );

                    // const line = new THREE.Line( lineGeometry, lineMaterial );
                    // scene.add( line );

                    // 创建蒙版
                    // const maskMaterial = new THREE.ShaderMaterial({
                    //     uniforms: {
                    //         pathPoints: { value: pointsArray }, // vec2数组
                    //         numPoints: { value: points.length }, // 数组长度
                    //         screenWidth: { value: width},
                    //         screenHeight: { value: height},
                    //     },
                    //     vertexShader: `
                    //         varying vec2 vUv;
                    //         void main() {
                    //             gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    //         }
                    //     `,
                    //     fragmentShader: maskfragment_shader,
                    //     side:THREE.DoubleSide
                    // })
                    //const maskMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00, side: THREE.DoubleSide})
                    //const maskGeometry = new THREE.PlaneGeometry(width, height);

                    

                    // const helper = new THREE.GridHelper( width, 3, 0x8d8d8d, 0xc1c1c1 );
                    // helper.position.set(0,0,0);
                    // helper.rotation.x = Math.PI / 2;
                    //helper.scale.set(0.1,0.1,0.1);
                    // scene.add( helper );

                    // const helperGeo = new THREE.PlaneGeometry(width, height);
                    // const helperMaterial = new THREE.MeshBasicMaterial({color: 0x8d8d8d, side: THREE.DoubleSide});
                    // const helperMesh = new THREE.Mesh(helperGeo, helperMaterial);
                    // scene.add(helperMesh);

                    screenRenderer.render(scene, camera);

                    console.log('load complete!');
                    resolve('load complete!');
                });
                }
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

    // 获取屏幕坐标的转换函数
    function convertToScreenSpace(points, camera, width, height) {
        const clipSpacePoints = points.map((point) => {
            const worldPosition = new THREE.Vector3(point.x, point.y, 0); // 假设 z=0
            return worldPosition.project(camera); // 转换到裁剪坐标
        });

        // 映射到屏幕坐标
        const screenSpacePoints = clipSpacePoints.map((clipPos) => {
            const x = (clipPos.x + 1) * 0.5 * width;
            const y = (1 - clipPos.y) * 0.5 * height; // Y 轴翻转
            return new THREE.Vector2(x, y);
        });

        return screenSpacePoints;
    }

    const fragment_shader = 
    `
        uniform sampler2D img_texture;
        varying vec2 vUv;
        uniform vec2 points[` + points_num + `];
        uniform int pathNum; // 数组长度
        uniform int pathPointNum;
        uniform float screenWidth;
        uniform float screenHeight;

        bool isPointInside(vec2 p) {
            int intersections = 0;
            float maxX = min_float, maxY = min_float, minX = max_float, minY = max_float;
            for (int i = 0; i < pathNum; i++) {
                vec2 v1 = pathPoints[i];
                vec2 v2 = pathPoints[(i + 1) % 100];

                if(v1.x > maxX) maxX = v1.x;
                if(v1.y > maxY) maxY = v1.y;
                if(v1.x < minX) minX = v1.x;
                if(v1.y < minY) minY = v1.y;

                // 判断 p 的射线是否与线段 v1-v2 相交
                // if ((v1.y > p.y) != (v2.y > p.y)) {
                //     float xIntersection = mix(v1.x, v2.x, (p.y - v1.y) / (v2.y - v1.y));
                //     if (xIntersection > p.x) {
                //         intersections++;
                //     }
                // }
            }

            if(p.x > minX && p.x < maxX && p.y > minY && p.y < maxY)
                return true;
            return false;
        }

        void main() {
            vec2 vUv2 = vec2(vUv.x, 1.0 - vUv.y);
            vec4 texColor = texture2D(img_texture, vUv2);
            gl_FragColor = texColor;
        }
    `

    const fragment_shader2 = 
    `
        uniform sampler2D img_texture;
        uniform float imageWidth;
        uniform float imageHeight;
        uniform float planeWidth;
        uniform float planeHeight;
        uniform vec3 backgroundColor;
        uniform float offsetX;
        uniform float offsetY;
        varying vec2 vUv;

        void main() {
            float rad = radians(90.0);
            mat3 rotationMatrix = mat3(cos(rad), -sin(rad), 0.0, sin(rad), cos(rad), 0.0, 0.0, 0.0, 1.0);
            vec3 vUv3 = vec3(vUv.x - 0.5, vUv.y - 0.5, 1.0);
            vUv3 = rotationMatrix * vUv3;
            vec2 vUv2 = vec2(vUv3.x + 0.5, vUv3.y + 0.5);

            // 计算纹理的有效区域偏移
            float scale = min(planeWidth/imageWidth, planeHeight/imageHeight);
            float scaleX = (planeWidth * vUv2.x - offsetX*scale)/imageWidth/scale;
            float scaleY = (planeHeight * vUv2.y - offsetY*scale)/imageHeight/scale;
            
            if (scaleX >= 0.0 && scaleY >= 0.0 && scaleX <= 1.0 && scaleY <=1.0) {
                // 缩放UV坐标
                vUv2.x = scaleX;
                vUv2.y = scaleY;
                vec4 texColor = texture2D(img_texture, vUv2);
                gl_FragColor = texColor;

            } else {
                // 超出有效区域，渲染背景颜色
                gl_FragColor = vec4(backgroundColor, 1.0);
            }
        }
    `

    const maskfragment_shader = 
    `
        uniform vec2 pathPoints[100];
        uniform int pathNum;
        uniform float screenWidth;
        uniform float screenHeight;

        float max_float = 3.402823466e+38;
        float min_float = -3.402823466e+38;
        bool isPointInside(vec2 p) {
            int intersections = 0;
            float maxX = min_float, maxY = min_float, minX = max_float, minY = max_float;
            for (int i = 0; i < pathNum; i++) {
                vec2 v1 = pathPoints[i];
                vec2 v2 = pathPoints[(i + 1) % 100];

                if(v1.x > maxX) maxX = v1.x;
                if(v1.y > maxY) maxY = v1.y;
                if(v1.x < minX) minX = v1.x;
                if(v1.y < minY) minY = v1.y;

                // 判断 p 的射线是否与线段 v1-v2 相交
                // if ((v1.y > p.y) != (v2.y > p.y)) {
                //     float xIntersection = mix(v1.x, v2.x, (p.y - v1.y) / (v2.y - v1.y));
                //     if (xIntersection > p.x) {
                //         intersections++;
                //     }
                // }
            }

            if(p.x > minX && p.x < maxX && p.y > minY && p.y < maxY)
                return true;
            return false;
        }

        void main() {
            vec2 screenPos = vec2(gl_FragCoord.x, gl_FragCoord.y);

            bool flag = false;
            for (int i = 0; i < 100; i++) {
                vec2 point = pathPoints[i];
                float distance = sqrt((screenPos.x - point.x)*(screenPos.x - point.x) + (screenPos.y - point.y)*(screenPos.y - point.y));
                if(distance < 100.0)
                    flag = true;
            }
            //if(screenPos.x < 1000.0 && screenPos.y < 1000.0) flag = true;
            if (flag) {
                gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);  // 显示颜色
            } else {
                //gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
                discard;  // 丢弃该像素
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