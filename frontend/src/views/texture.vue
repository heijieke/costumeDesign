<template>
    <!-- <div>
        <img :src="img_url">
    </div> -->
    <div ref="container"></div>
</template>

<script setup>
    import {ref, onMounted} from 'vue';
    import * as THREE from 'three';

    const container = ref();

    // 创建一个场景
    const scene = new THREE.Scene();

    // 创建一个相机
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 1000;

    // 创建一个WebGL渲染器
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 你的控制点数据
    const xCoords = [-457.467770633978, 256.55179341167457, 746.1414821568675, 170.47770918834146, -101.876338559077, 312.18810503717515, 872.1224836791565, 1352.5551628943558, -26.839697666995704, 386.59546934542766, 713.5107056801374, 1436.037451273834, -268.61150638648314, 217.53066406973784, 614.7038609018675, 938.6693567841761];
    const yCoords = [142.62429494546905, -192.86087710643994, 154.78238593280463, -488.9965390090355, 739.3203361084459, 240.7254408594843, 296.3436062529165, 252.0659232517857, 689.7839034684949, 729.7138865061265, 691.8106944786886, 734.879962840519, 1007.1745805387861, 1015.3638252384974, 991.5028069189308, 987.8440761364434];

    // 创建一个纹理
    const texture = new THREE.TextureLoader().load('src\\assets\\hellokitty.jpg');

    // 创建一个几何体（PlaneGeometry）
    const geometry = new THREE.PlaneGeometry(1200, 1200, 4, 4);

    // 顶点变形（通过控制点修改PlaneGeometry的顶点）
    //九宫格，18个面元
    // const uvs = new Float32Array(32);
    const max_x = Math.max(...xCoords);
    const min_x = Math.min(...xCoords);
    const max_y = Math.max(...yCoords);
    const min_y = Math.min(...yCoords);
    // console.log(max_x,min_x,max_y,min_y);
    // for(let i = 0; i < xCoords.length; i++){
    //     uvs[i] = (xCoords[i] - min_x)/(max_x - min_x);
    //     uvs[i+1] = (yCoords[i] - min_y)/(max_y - min_y);
    // }

    // 将九宫格的控制点映射到纹理坐标上
    const uvMapping = [
    [0, 0], [0.33, 0], [0.66, 0], [1, 0], // 第一行
    [0, 0.33], [0.33, 0.33], [0.66, 0.33], [1, 0.33], // 第二行
    [0, 0.66], [0.33, 0.66], [0.66, 0.66], [1, 0.66], // 第三行
    [0, 1], [0.33, 1], [0.66, 1], [1, 1]  // 第四行
    ];

    // 变形处理：将控制点映射到平面的顶点上
    const vertices = geometry.attributes.position.array;
    const uvs = geometry.attributes.uv.array;

    // 假设你有一个16个控制点，修改平面的顶点和纹理坐标
    for (let i = 0; i < xCoords.length; i++) {
        // 控制点的x，y坐标映射到geometry的顶点
        vertices[i * 3] = xCoords[i];    // 修改x坐标
        vertices[i * 3 + 1] = yCoords[i]; // 修改y坐标

        // 设置纹理坐标（uv坐标映射到控制点的变化）
        uvs[i * 2] = (xCoords[i] - min_x)/(max_x - min_x);  // 调整为0-1的范围
        uvs[i * 2 + 1] = (yCoords[i] - min_y)/(max_y - min_y); // 调整为0-1的范围
    }


    geometry.attributes.uv = new THREE.BufferAttribute(uvs, 2);
    // 创建一个材质，并将纹理应用到该材质
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1.0
    });

    // 创建网格对象（Mesh）
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 渲染循环
    function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    }


    //挂载完毕获取dom  
    onMounted(()=>{
        container.value.appendChild(renderer.domElement);
        // 调用动画函数
        animate();
    })
</script>