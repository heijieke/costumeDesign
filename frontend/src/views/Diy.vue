<template>
    <!-- <div>
        <img :src="img_url">
    </div> -->
    <div ref="container"></div>
</template>

<script setup>
    // 引入Three.js
    import * as THREE from 'three';
    import { onMounted } from 'vue';
    
    // 场景
    const scene = new THREE.Scene();
    
    // 相机
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // 渲染器
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // 创建一系列贝塞尔曲线的点
    const points = [];
    points.push(new THREE.Vector2(0, 0));
    points.push(new THREE.Vector2(0.5, 0.5));
    points.push(new THREE.Vector2(1, 0));
    points.push(new THREE.Vector2(1, 1));
    points.push(new THREE.Vector2(0, 1));
    
    // 创建贝塞尔曲面几何体
    const geometry = new THREE.LatheGeometry(points, 20);
    
    // 创建材质
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    
    // 创建网格对象
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    // 设置相机位置并指向场景
    camera.position.z = 5;
    
    // 渲染场景
    function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    }

    //挂载完毕获取dom  
    onMounted(()=>{  
        animate();
    })
</script>