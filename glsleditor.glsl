uniform sampler2D img_texture;
uniform float imageWidth;
uniform float imageHeight;
uniform float planeWidth;
uniform float planeHeight;
uniform vec3 backgroundColor;
varying vec2 vUv;

void main() {
    // 计算纹理的有效区域偏移
    float scaleX = planeWidth / imageWidth;
    float scaleY = planeHeight / imageHeight;
    float scale = min(scaleX, scaleY);

    // 计算纹理坐标的偏移量，使图片居中
    float offsetX = (planeWidth - imageWidth * scale) / 2.0 / planeWidth;
    float offsetY = (planeHeight - imageHeight * scale) / 2.0 / planeHeight;

    // 缩放并偏移UV坐标
    vec2 uvScaled = vUv * vec2(planeWidth, planeHeight);  // 转换为平面上的像素坐标
    uvScaled = (uvScaled - vec2(planeWidth / 2.0, planeHeight / 2.0)) / scale + vec2(planeWidth / 2.0, planeHeight / 2.0);

    // 判断该像素是否在有效的纹理区域内
    if (uvScaled.x >= offsetX && uvScaled.x <= offsetX + imageWidth * scale / planeWidth &&
        uvScaled.y >= offsetY && uvScaled.y <= offsetY + imageHeight * scale / planeHeight) {
        // 在有效区域，采样纹理
        vec4 texColor = texture2D(img_texture, vUv);
        gl_FragColor = texColor;
    } else {
        // 超出有效区域，渲染背景颜色
        gl_FragColor = vec4(backgroundColor, 1.0);
    }
}