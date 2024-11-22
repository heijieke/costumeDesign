<template>
    <div ref="container"></div>
</template>

<script setup>
import {ref, onMounted} from 'vue';
import * as THREE from 'three';
const container = ref();
// 1. 创建渲染器，并启用 stencil buffer
const renderer = new THREE.WebGLRenderer({
    stencil: true,
});
document.body.appendChild(renderer.domElement);

// 2. 创建场景和相机
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// 3. 创建蒙版几何体（例如一个矩形）
const maskGeometry = new THREE.PlaneGeometry(4, 4); // 这是一个正方形的几何体
const maskMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const mask = new THREE.Mesh(maskGeometry, maskMaterial);
scene.add(mask);

// 4. 设置 stencil buffer 操作
maskMaterial.stencilWrite = true;
maskMaterial.stencilFunc = THREE.AlwaysStencilFunc; // 总是通过 stencil 测试
maskMaterial.stencilFail = THREE.KeepStencilOp; // 如果 stencil 不匹配，保持 stencil buffer 中的值
maskMaterial.stencilZFail = THREE.KeepStencilOp;
maskMaterial.stencilZPass = THREE.ReplaceStencilOp; // 替换 stencil buffer 的值
maskMaterial.stencilRef = 1; // 将 stencil 值设置为 1
maskMaterial.stencilMask = 0xff; // 使用所有的 stencil 位

// 5. 创建其他物体
const geometry = new THREE.PlaneGeometry(3, 3);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
material.stencilWrite = true;
material.stencilFunc = THREE.AlwaysStencilFunc; // 总是通过 stencil 测试
material.stencilFail = THREE.KeepStencilOp; // 如果 stencil 不匹配，保持 stencil buffer 中的值
material.stencilZFail = THREE.KeepStencilOp;
material.stencilFunc = THREE.EqualStencilFunc,
material.stencilZPass = THREE.ReplaceStencilOp; // 替换 stencil buffer 的值
material.stencilRef = 1; // 将 stencil 值设置为 1
material.stencilMask = 0xff; // 使用所有的 stencil 位
const object = new THREE.Mesh(geometry, material);
scene.add(object);


// 6. 设置另一个物体的 stencil 操作来基于 mask 裁剪
const geometry2 = new THREE.PlaneGeometry(2, 2);
const maskMaterialForObject = new THREE.MeshBasicMaterial({
    color: 0x000000,
    stencilWrite: true,
    stencilFunc: THREE.NotEqualStencilFunc, // 只有 stencil 值等于 1 的区域会渲染
    stencilRef: 0,
    stencilMask: 0xff,
    depthTest: false // 禁止深度测试，确保裁剪可以正确应用
});

const objectWithStencil = new THREE.Mesh(geometry2, maskMaterialForObject);
objectWithStencil.position.set(0, 0, -1);
scene.add(objectWithStencil);

// 7. 渲染场景
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}



//挂载完毕获取dom  
onMounted(()=>{
    animate();
})

</script>
