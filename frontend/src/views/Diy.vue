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
    import {SVGRenderer, SVGObject } from 'three/addons/renderers/SVGRenderer.js';

    const container = ref();
    const mainRenderer = new SVGRenderer();
    mainRenderer.setSize(window.innerWidth, window.innerHeight);
    mainRenderer.setQuality('high');

    const scene2 = new THREE.Scene();

    const offscreenRenderer = new THREE.WebGLRenderer({
        antialias:true
    });
    const width = 1200, height = 1200;
    offscreenRenderer.setSize(width, height);

    const scene1 = new THREE.Scene();
    const camera1 = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const distance = (width/2) / Math.tan(THREE.MathUtils.degToRad(75 / 2));
    camera1.position.z = distance;
    //lookAt和OrbitControls二选一，二者都没有时不显示渲染结果
    camera1.lookAt(0,0,0);

    const fileLoader = new THREE.FileLoader();

    const helper = new THREE.GridHelper( width, 3, 0x8d8d8d, 0xc1c1c1 );
    helper.position.set(0,0,0);
    helper.rotation.x = Math.PI / 2;
    helper.scale.set(0.1,0.1,0.1);
    scene2.add( helper );

    scene1.add( helper );

    const stats = new Stats();
    document.body.appendChild(stats.domElement);

    //const controls = new OrbitControls(camera1, mainRenderer.domElement);
    const controls = new OrbitControls(camera1, offscreenRenderer.domElement);
    // 如果使用animate方法时，将此函数删除
    // controls.addEventListener('change', offscreenRenderer.render(camera1, scene1));
    // 使动画循环使用时阻尼或自传，意思是否有惯性
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
    posFolder.add(camera1.position, "x", -100, 100);
    posFolder.add(camera1.position, "y", -100, 100);
    posFolder.add(camera1.position, "z", -5000, 5000, 10);

    let svgElement;
    const svg_url = 'src\\assets\\svg.svg';
    const sucai_url = 'src\\assets\\hellokitty.png';
    const group_id = "组 5";
    // 控制点数组(threejs坐标原点在canvas正中间，x轴正方向向左，y轴正方向向上)
    const controlPoints = new Array(4);

    const fileload = () => {
        return new Promise((resolve, reject) => {
            fileLoader.load( svg_url, function ( svg ) {
                console.log('begin load svg!')
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
                    data_points[i] = new THREE.Vector3(parseFloat(xCoords[i]) - width/2, -parseFloat(yCoords[i]) + height/2, 1);
                }

                const scale_rotation_matrix3 =  trans_matrix3.transpose();
                for (let i = 0; i < 16; i++){
                    data_points[i].applyMatrix3(scale_rotation_matrix3);
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

                data_BoundingRect[0] = data_BoundingRect[0] - width/2;
                data_BoundingRect[1] = -data_BoundingRect[1] + height/2;

                const translate_matrix3 = new THREE.Matrix3().makeTranslation(new THREE.Vector2(data_BoundingRect[0] - left, data_BoundingRect[1] - top));

                for (let i = 0; i < 16; i++){
                    data_points[i].applyMatrix3(translate_matrix3);
                }

                
                for (let i = 0; i < 4; i++) {
                    controlPoints[i] = new Array(4);
                    for (let j = 0; j < 4; j++) {
                        controlPoints[i][j] = data_points[i*4 + j];
                    }
                }

                const axes = new THREE.AxesHelper(100);
                scene1.add(axes);

                console.log('begin construct geometry!')
                // 创建贝塞尔曲面的几何体
                const geometry = new ParametricGeometry(bezierSurface, 20, 20);

                const uvs = geometry.attributes.uv.array;

                // 创建纹理
                const texLoader = new THREE.TextureLoader();
                texLoader.load(sucai_url,(texture) => {
                    const scale = Math.min(width / texture.image.width, height / texture.image.height);
                    const offsetX = (width - texture.image.width * scale) /2 / width;
                    const offsetY = (height - texture.image.height * scale) /2 / height;
                    
                    // 旋转纹理
                    texture.rotation = Math.PI / 2; // 90度
                    texture.center.set(0.5, 0.5);  // 设置中心为纹理的中心
                    texture.minFilter = THREE.NearestFilter;
                    texture.magFilter = THREE.NearestFilter;
                    texture.updateMatrix();
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
                    scene1.add(bezierSurfaceMesh);

                    offscreenRenderer.render(scene1, camera1);

                    resolve('load complete!');
                });
            });
        });
    }

    const offscreenRender = () => {
        return new Promise(function (resolve, reject){
            console.log('begin render!');
            console.log(svgElement);
            offscreenRenderer.render(scene1, camera1);

            // 将 canvas 内容导出为 base64 编码的 PNG 图像
            const dataURL = offscreenRenderer.domElement.toDataURL('image/png');

            const sucaiDiy = document.createElementNS('http://www.w3.org/2000/svg',"image");
            sucaiDiy.setAttribute("crossOrigin", "anonymous");
            sucaiDiy.setAttribute("id", "hellokitty");
            sucaiDiy.setAttribute("width", "1200");
            sucaiDiy.setAttribute("height", "1200");
            sucaiDiy.setAttribute("xlink:href", dataURL);
            sucaiDiy.setAttribute("href", dataURL);
            svgElement.getElementsByTagName("defs")[0].appendChild(sucaiDiy);

            const sucai5 = svgElement.getElementById(group_id).childNodes[1];
            sucai5.setAttribute("xlink:href", "#hellokitty");
            sucai5.setAttribute("href", "#hellokitty");

            // const a = document.createElement('a');
            // a.href = dataURL;
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

            const node = document.createElementNS( 'http://www.w3.org/2000/svg','g');
            node.appendChild(svgElement);
            const object = new SVGObject(node);
            object.position.set(0,0,0);
            scene2.add( object );
            resolve('begin animate');
        })
    }


    function animate(){
        //mainRenderer.render(scene2, camera1);
        controls.update();
        offscreenRenderer.render(scene1, camera1);
        
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
            vec2 tem = vec2(vUv3.x + 0.5, vUv3.y + 0.5);
            vec4 texColor = texture2D(img_texture, tem);
            gl_FragColor = texColor;
        }
    `

    fileload().then(() => {
        console.log('文件加载完毕!');
        offscreenRender().then(animate());
    });
    
    //挂载完毕获取dom  
    onMounted(()=>{
        if ( WebGL.isWebGL2Available() ) {
            container.value.appendChild(offscreenRenderer.domElement);
            // Initiate function or other initializations here
            console.log('开始挂载!');
        } else {
            console.log('WebGL2 is not Available!');
            const warning = WebGL.getWebGL2ErrorMessage();
            document.body.appendChild( warning );
        }
    })

</script>