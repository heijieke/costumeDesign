<style scoped>
.container {
  display: flex;
  justify-content: left; 
  align-items: left;
  width: 100vw; /* 占满整个浏览器宽度 */
  height: 100vh; /* 占满整个浏览器高度 */
  background-color: #ffffff; /* 背景色 */
  overflow: hidden; /* 隐藏溢出的内容 */
  position: relative;
}
.sucai-container {
  display: flex;
  flex-direction: column;
  width: 20vw; /* 占满整个浏览器宽度 */
  height: 100vh; /* 占满整个浏览器高度 */
  background-color: #ffffff; /* 背景色 */
  overflow: hidden; /* 隐藏溢出的内容 */
  position: relative;
}
.svg-container {
  display: flex;
  justify-content: center; /* 水平方向居中 */
  align-items: center; /* 垂直方向居中 */
  width: 70vw; /* 占满整个浏览器宽度 */
  height: 100vh; /* 占满整个浏览器高度 */
  background-color: #202020; /* 背景色 */
  overflow: hidden; /* 隐藏溢出的内容 */
  position: relative;
}
</style>
<template>
    <div class="container">
        <div class="sucai-container">
            <div>素材</div>
            <div>
                <img class="margin: auto;" src="@//assets//hellokitty.png" width="200" height="200"></img>
                <el-button @click="changeSucai(1)">切换素材1</el-button>
            </div>
            <div>
                <img class="margin: auto;" src="@//assets//sucai2.png" width="200" height="200"></img>
                <button @click="changeSucai(2)">切换素材2</button>
            </div>
            <div>产品</div>
            <div>
                <object type="image/svg+xml" data="src/assets/image (1).svg" width="200" height="200"></object>
                <button @click="changeProduct(3)">切换产品3</button>
            </div>
            <div>
                <object type="image/svg+xml" data="src/assets/svg.svg" width="200" height="200"></object>
                <button @click="changeProduct(1)">切换产品1</button>
            </div>
            <div>
                <object type="image/svg+xml" data="src/assets/model1.svg" width="200" height="200"></object>
                <button @click="changeProduct(2)">切换产品2</button>
            </div>
        </div>
        <!-- <button @click="viewBigPicture()">大图预览</button> -->
        <div class="svg-container" ref="container"></div>
    </div>
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

    //外部参数
    //let svg_url = 'src\\assets\\model1.svg';
    let svg_url = 'src\\assets\\image (1).svg';
    let sucai_url = 'src\\assets\\hellokitty.png';
    //const sucai_id = '771b1cae-fca6-6147-994d-5263a3e90c1e';
    let sucai_id = '4f2ccf10-5568-644f-8c9c-0bf74edb542f';
    let offsetX = 0;
    let offsetY = 0;

    const container = ref();
    const mainRenderer = new SVGRenderer();
    mainRenderer.setSize(window.innerWidth, window.innerHeight);
    mainRenderer.setQuality('high');

    const camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera2.position.z = (window.innerWidth/2) / Math.tan(THREE.MathUtils.degToRad(75 / 2));
    camera2.position.x = 0;
    camera2.position.y = 0;
    camera2.lookAt(0,0,0);
    // const camera2 = new THREE.OrthographicCamera(-window.innerWidth / 2, window.innerWidth / 2, window.innerHeight / 2, -window.innerHeight / 2, 0.1, 1000);
    // camera2.position.z = 1000; // 确保相机处于合适的距离
    // camera2.position.x = -100;
    // camera2.position.y = -100;

    const scene2 = new THREE.Scene();
    //const scene1 = new THREE.Scene();
    const offscreenRenderer = new THREE.WebGLRenderer({
        antialias:true
    });
    const width = 1200, height = 1200;
    offscreenRenderer.setSize(width, height);
    const camera1 = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    const distance = (width/2) / Math.tan(THREE.MathUtils.degToRad(75 / 2));
    camera1.position.z = distance;
    //lookAt和OrbitControls二选一，二者都没有时不显示渲染结果
    //camera1.lookAt(0,0,0);

    const fileLoader = new THREE.FileLoader();

    //scene1.add( helper );
    // const stats = new Stats();
    // document.body.appendChild(stats.domElement);

    const controls = new OrbitControls(camera1, offscreenRenderer.domElement);
    //const controls = new OrbitControls(camera2, mainRenderer.domElement);
    // 如果使用animate方法时，将此函数删除
    // controls.addEventListener('change', offscreenRenderer.render(camera1, scene1));
    // 使动画循环使用时阻尼或自传，意思是否有惯性
    controls.enableDamping = true;
    // 动态阻尼系数，就是鼠标拖拽旋转的灵敏度
    controls.dampingFactor = 0.25
    // 是否可以缩放
    controls.enableZoom = false;
    // 是否自动旋转
    //controls.enableRotate = true;
    //controls.autoRotate = false;
    // 设置相机距离原点的最近距离
    //controls.minDistance = 1;
    // 设置相机距离原点的最远距离
    //controls.maxDistance = 10000;
    // 是否开启右键拖拽
    controls.enablePan = true;

    // const gui = new dat.GUI();
    // const posFolder = gui.addFolder("相机位置");
    // posFolder.add(camera1.position, "x", -100, 100);
    // posFolder.add(camera1.position, "y", -100, 100);
    // posFolder.add(camera1.position, "z", -5000, 5000, 10);

    let svgElement;
    // 控制点数组(threejs坐标原点在canvas正中间，x轴正方向向左，y轴正方向向上)
    const controlPoints = new Array(4);

    const fileload = () => {
        return new Promise((resolve, reject) => {
            fileLoader.load( svg_url, function ( svg ) {
                const texLoader = new THREE.TextureLoader();
                const parser = new DOMParser();
                svgElement = parser.parseFromString( svg, 'image/svg+xml' ).documentElement;
                const groups = svgElement.getElementsByTagName('g');
                for(let i = 0; i < groups.length; i++) {
                    const smartObject = groups[i].querySelector('use');
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

                    //辅助边框
                    if (0)
                    {
                        for (let i = 0; i < 4; i++){
                            control_rect[i].applyMatrix3(translate_matrix3);
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
                        scene1.add(plane);

                        const box2 = new THREE.BufferGeometry();
                        box2.setIndex(indices);
                        box2.setFromPoints(control_rect);
                        const material2 = new THREE.MeshBasicMaterial({color: 0x0000ff, side: THREE.DoubleSide, wireframe: true})
                        const plane2 = new THREE.Mesh(box2, material2);
                        //plane2.position.set((left + right)/2,(top + bottom)/2,0);
                        plane2.scale.set(0.1,0.1,0.1);
                        scene1.add(plane2);

                        const pointGeo = new THREE.BufferGeometry();
                        pointGeo.setFromPoints(data_points);
                        const pointsMaterial = new THREE.PointsMaterial({
                            color: 0xff0000,
                            size: 3.0
                        });
                        const points = new THREE.Points(pointGeo, pointsMaterial);
                        points.scale.set(0.1,0.1,0.1);
                        scene1.add(points);

                        const axes = new THREE.AxesHelper(100);
                        scene1.add(axes);
                    }

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
                        const vertices= new Float32Array([
                            data_points[0].x, data_points[0].y, data_points[0].z,
                            data_points[1].x, data_points[1].y, data_points[1].z,
                            data_points[2].x, data_points[2].y, data_points[2].z,
                            data_points[0].x, data_points[0].y, data_points[0].z,
                            data_points[2].x, data_points[2].y, data_points[2].z,
                            data_points[3].x, data_points[3].y, data_points[3].z,
                        ]);
                        const attribute = new THREE.BufferAttribute(vertices, 3);
                        geometry = new THREE.BufferGeometry();
                        geometry.attributes.position = attribute;
                        const uvs = new Float32Array([
                            1, 1,
                            0, 1,
                            0, 0,
                            1, 1,
                            0, 0,
                            1, 0,
                        ]);
                        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
                    }
                    

                    // 创建纹理
                    texLoader.load(sucai_url,(texture) => {
                        console.log('加载素材！');
                        // 创建材质
                        const material = new THREE.ShaderMaterial({ 
                            uniforms: {
                                img_texture: { type: 't', value: texture},
                                imageWidth: { value: texture.image.width},
                                imageHeight: { value: texture.image.height},
                                planeWidth: { value: width},
                                planeHeight: { value: height},
                                offsetX: { value: offsetX},
                                offsetY: { value: offsetY},
                                backgroundColor: { value: new THREE.Color(0xff00ff)},
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

                        // 旋转纹理
                        // texture.rotation = Math.PI / 2 // 90度
                        // texture.center.set(0.5, 0.5) // 设置中心为纹理的中心
                        // texture.minFilter = THREE.NearestFilter
                        // texture.magFilter = THREE.NearestFilter
                        // const material = new THREE.MeshBasicMaterial({
                        //     map: texture,
                        //     side: THREE.DoubleSide,
                        //     //transparent:false,
                        //     // alphaTest: 0, // 保留透明度小于 0 的像素,
                        //     // transparent: true,
                        //     // opacity: 1, // 1 表示完全不透明
                        // })

                        // 创建mesh并添加到场景中
                        const bezierSurfaceMesh = new THREE.Mesh(geometry, material);
                        //bezierSurfaceMesh.scale.set(0.1, 0.1, 0.1);  // 根据需要调整物体的大小
                        const scene1 = new THREE.Scene();
                        scene1.add(bezierSurfaceMesh);
                        offscreenRenderer.render(scene1, camera1);
                        const dataURL = offscreenRenderer.domElement.toDataURL('image/png');

                        const image_list = svgElement.getElementsByTagName('image');
                        for(let j = 0; j < image_list.length; j++) {
                            if( image_list[j].id.includes("sucaidiy"+i)){
                                svgElement.getElementsByTagName('defs')[0].removeChild(image_list[j]);
                            }
                        }

                        let sucaiDiy = document.createElementNS('http://www.w3.org/2000/svg',"image");
                        sucaiDiy.setAttribute("crossOrigin", "anonymous");
                        sucaiDiy.setAttribute("width", "1200");
                        sucaiDiy.setAttribute("height", "1200");
                        sucaiDiy.setAttribute("id", "sucaidiy"+i);
                        sucaiDiy.setAttribute("xlink:href", dataURL);
                        sucaiDiy.setAttribute("href", dataURL);

                        svgElement.getElementsByTagName('defs')[0].appendChild(sucaiDiy);
                        smartObject.setAttribute('href', '#'+"sucaidiy"+i);
                        smartObject.setAttribute('xlink:href', '#'+"sucaidiy"+i);
                        groups[i].setAttribute('style', smartObject.getAttribute('style'));

                        svgElement.setAttribute('viewBox', "0 0 1200 1200");
                        svgElement.setAttribute('width', "600");
                        svgElement.setAttribute('height', "600");

                        // const a = document.createElement('a');
                        // a.href = dataURL;
                        // a.download = 'sucai5-' + i + '.png';
                        // document.body.appendChild(a);
                        // a.click();
                        // console.log(svgElement);

                        // console.log('素材url:'+sucai_url);

                        if (i == groups.length-1){
                            //offscreenRenderer.dispose();
                            console.log('load complete!')
                            resolve('load complete!');
                        }
                    });
                }
            });
        });
    }

    let object;
    const offscreenRender = () => {
        return new Promise(function (resolve, reject){
            // const sucaiDiy = document.createElementNS('http://www.w3.org/2000/svg',"image");
            // sucaiDiy.setAttribute("crossOrigin", "anonymous");
            // sucaiDiy.setAttribute("id", "hellokitty");
            // sucaiDiy.setAttribute("width", "1200");
            // sucaiDiy.setAttribute("height", "1200");
            // sucaiDiy.setAttribute("xlink:href", dataURL);
            // sucaiDiy.setAttribute("href", dataURL);
            // svgElement.getElementsByTagName("defs")[0].appendChild(sucaiDiy);

            // const sucai5 = svgElement.getElementById(sucai_id);
            // sucai5.setAttribute("width", "1200");
            // sucai5.setAttribute("height", "1200");
            // sucai5.setAttribute("xlink:href", dataURL);
            // sucai5.setAttribute("href", dataURL);

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
            object = new SVGObject(node);
            object.position.set(-window.innerWidth/2,window.innerHeight/2,0);
            scene2.add( object );
            // const helper = new THREE.GridHelper( width, 3);
            // helper.position.set(-window.innerWidth/2,-window.innerHeight/2,0);
            // helper.rotation.x = Math.PI / 2;
            // helper.scale.set(0.1,0.1,0.1);
            // scene2.add( helper );

            mainRenderer.render(scene2, camera2);
            resolve('begin animate');

        })
    }


    function animate(){
        requestAnimationFrame(animate);
        controls.update();
        mainRenderer.render(scene2, camera2);
        //offscreenRenderer.render(scene1, camera1);
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

    function changeSucaiId(id) {
        switch(id) {
            case 1:
                sucai_id = 'c1e55387-e453-8a46-933e-059e869ec1c9';
                mainRenderer.clear();
                scene2.remove(object);
                fileload().then(() => {
                    offscreenRender().then(animate());
                });
                break;
            case 2:
                sucai_id = '771b1cae-fca6-6147-994d-5263a3e90c1e';
                mainRenderer.clear();
                scene2.remove(object);
                fileload().then(() => {
                    offscreenRender().then(animate());
                });
                break;
        }
    }

    function changeProduct(productId) {
        switch(productId) {
            case 1:
                svg_url = 'src\\assets\\svg.svg';
                sucai_id = 'c1e55387-e453-8a46-933e-059e869ec1c9';
                mainRenderer.clear();
                scene2.remove(object);
                fileload().then(() => {
                    offscreenRender().then(animate());
                });
                break;
            case 2:
                svg_url = 'src\\assets\\model1.svg';
                sucai_id = '771b1cae-fca6-6147-994d-5263a3e90c1e';
                mainRenderer.clear();
                scene2.remove(object);
                fileload().then(() => {
                    offscreenRender().then(animate());
                });
                break;
            case 3:
                svg_url = 'src\\assets\\image (1).svg';
                sucai_id = '4f2ccf10-5568-644f-8c9c-0bf74edb542f';
                mainRenderer.clear();
                scene2.remove(object);
                fileload().then(() => {
                    offscreenRender().then(animate());
                });
                break;
        }
        
    }

    function changeSucai(sucaiId) {
        switch(sucaiId) {
            case 1:
                sucai_url = 'src\\assets\\hellokitty.png';
                mainRenderer.clear();
                scene2.remove(object);
                fileload().then(() => {
                    offscreenRender().then(animate());
                });
                break;
            case 2:
                sucai_url = 'src\\assets\\sucai2.png';
                mainRenderer.clear();
                scene2.remove(object);
                fileload().then(() => {
                    offscreenRender().then(animate());
                });
                break;
        }
        
    }

    function viewBigPicture() {
        const originalSize = mainRenderer.getSize();
        mainRenderer.setSize(2000, 2000);
        mainRenderer.render(scene2, camera2);

        const dataUrl = mainRenderer.domElement.toDataURL("image/png");
        mainRenderer.setSize(originalSize.x, originalSize.y);
    }

    const fragment_shader = 
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

            vec4 texColor = texture2D(img_texture, vUv2);
            gl_FragColor = texColor;
        }
    `

    fileload().then(() => {
        offscreenRender();
        animate();
    });
    
    //挂载完毕获取dom  
    onMounted(()=>{
        if ( WebGL.isWebGL2Available() ) {
            // mainRenderer.domElement.addEventListener('wheel', (event) => {
            //     event.preventDefault(); // 防止默认的滚轮行为
            // });
            container.value.appendChild(mainRenderer.domElement);
        } else {
            console.log('WebGL2 is not Available!');
            const warning = WebGL.getWebGL2ErrorMessage();
            document.body.appendChild( warning );
        }
    })

    // 监听鼠标滚轮事件
    let scaleFactor = 1.1; // 缩放因子
    window.addEventListener('wheel', (event) => {
    // 阻止默认滚动行为
    event.preventDefault();

    if (event.deltaY > 0) {
        // 向下滚动，缩小
        const svg_width = scene2.children[0].node.childNodes[0].getAttribute('width');
        const svg_height = scene2.children[0].node.childNodes[0].getAttribute('height');
        scene2.children[0].node.childNodes[0].setAttribute('width', svg_width * scaleFactor);
        scene2.children[0].node.childNodes[0].setAttribute('height', svg_height * scaleFactor);
    } else {
        // 向上滚动，放大
        const svg_width = scene2.children[0].node.childNodes[0].getAttribute('width');
        const svg_height = scene2.children[0].node.childNodes[0].getAttribute('height');
        scene2.children[0].node.childNodes[0].setAttribute('width', svg_width / scaleFactor);
        scene2.children[0].node.childNodes[0].setAttribute('height', svg_height / scaleFactor);
    }
    }, { passive: false });

</script>