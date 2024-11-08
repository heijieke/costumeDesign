/*
* @copyright Copyright (c) 2020 泉州市三七信息科技有限公司    
* @author：SQKJ
*/
function svgbat(path, weight) {
  return new Promise(function (resolve, reject) {
    //双线性插值
    function segmentsIntr(a, b, c, d) {
      //a,b竖线,c,d横线
      var denominator = (b[1] - a[1]) * (d[0] - c[0]) - (a[0] - b[0]) * (c[1] - d[1]);
      if (denominator == 0) {
        return false;
      }
      var x =
        ((b[0] - a[0]) * (d[0] - c[0]) * (c[1] - a[1]) + (b[1] - a[1]) * (d[0] - c[0]) * a[0] - (d[1] - c[1]) * (b[0] - a[0]) * c[0]) /
        denominator;
      var y =
        -((b[1] - a[1]) * (d[1] - c[1]) * (c[0] - a[0]) + (b[0] - a[0]) * (d[1] - c[1]) * a[1] - (d[0] - c[0]) * (b[1] - a[1]) * c[1]) /
        denominator;
      return [x, y];
    }
    var axios = require("axios");
    var agPsd = require("./dist/bundle-node.js");
    var jsdom = require("jsdom");
    var PerspT = require("perspective-transform"); //perspective.js库
    var JSDOM = jsdom.JSDOM;
    var document = new JSDOM().window.document;
    var sharp = require("sharp"); //sharp.js
    var { createCanvas } = require("canvas");
    console.log("svgbat:" + path);
    //canvas处理为svg中base64表示的图片
    async function processImage(canvas) {
      return new Promise((resolve, reject) => {
        sharp(canvas.toBuffer())
          .toFormat(sharp.format.webp, { quality: weight })
          .toBuffer(function (error, webpbuffer) {
            if (error) {
              reject(error);
            } else {
              const webpDataURL = "data:image/webp;base64," + webpbuffer.toString("base64");
              resolve(webpDataURL);
            }
          });
      });
    }
    axios
      .get(path, { responseType: "arraybuffer" })
      .then(async response => {
        const psd = agPsd.readPsd(response.data);
        var SVG = "";
        //如果psd含有链接文件
        if (psd.hasOwnProperty("linkedFiles")) {
          const psdC = psd.children;//psd的所有子节点
          const sucaip = psd.linkedFiles;
          const promises0 = [];
          const promises1 = [];
          const startsvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 ${psd.width} ${psd.height}" width="${psd.width}" height="${psd.height}"><defs>`;
          // console.log(startsvg);
          SVG += startsvg;
          var sucaiimage = "";
          //获取素材图片
          sucaip.forEach((sucai, index) => {
            var onlyone = 0;
            psdC.forEach((psdc, index) => {
              if (psdc.hidden == false) {
                //如果有遮罩，取子节点的放置层id，没有就取本节点的放置层id
                if (psdc.hasOwnProperty("mask")) {
                  if (sucai.id == psdc.children[0].placedLayer.id && onlyone == 0) {
                    onlyone = 1;
                    sucaiimage += `<image crossOrigin="anonymous" id="${sucai.id}" href="https://www.didaplan.cn/3D/${psdc.children[0].name}.png" xlink:href="https://www.didaplan.cn/3D/${psdc.children[0].name}.png" width="${psdc.children[0].placedLayer.width}" height="${psdc.children[0].placedLayer.height}" />`;
                  }
                } else if (psdc.hasOwnProperty("placedLayer")) {
                  if (sucai.id == psdc.placedLayer.id) {
                    const promise = (async () => {
                      const canvas = createCanvas(psdc.imageData.width, psdc.imageData.height);
                      const cavansCtx = canvas.getContext("2d");
                      cavansCtx.putImageData(psdc.imageData, 0, 0);
                      console.log("0");
                      const webpDataURL = await processImage(canvas);
                      console.log("0-0");
                      sucaiimage += `<image crossOrigin="anonymous" id="${sucai.id}" href="${webpDataURL}" xlink:href="${webpDataURL}" width="${psd.width}" height="${psd.height}" />`;
                    })();
                    promises0.push(promise);
                  }
                }
              }
            });
          });
          await Promise.all(promises0);
          SVG += sucaiimage;
          console.log("SVG += sucaiimage");
          // 有遮罩就获取裁剪路径，没有就获取源图
          psdC.forEach(async (psdc, index) => {
            if (psdc.hidden == false) {
              if (psdc.hasOwnProperty("mask")) {
                // console.log(psdc.name)
                var startpathsc = `<clipPath clipPathUnits="userSpaceOnUse" id="clip-path${psdc.children[0].id}"><path d="`;
                var endpathsc = `" /></clipPath>`;
                var path = "";
                psdc.vectorMask.paths.forEach((pathsc, index) => {
                  var paths = pathsc.knots;
                  let head;
                  const data = [];
                  paths.forEach((path, index) => {
                    data.push(path.points);
                  });
                  const points = [];
                  data.forEach((point, index) => {
                    let po = {
                      x: 0,
                      y: 0,
                    };
                    let p1 = {
                      x: 0,
                      y: 0,
                    };
                    let p2 = {
                      x: 0,
                      y: 0,
                    };
                    po.x = point[0];
                    po.y = point[1];
                    points.push(po);
                    p1.x = point[2];
                    p1.y = point[3];
                    points.push(p1);
                    p2.x = point[4];
                    p2.y = point[5];
                    points.push(p2);
                  });
                  const datap = [];
                  points.forEach((path, index) => {
                    if (index < points.length - 1) {
                      if (index > 0) {
                        // 中间节点
                        if (index % 3 == 0) {
                          datap.push(`${points[index + 1].x.toFixed(2)} ${points[index + 1].y.toFixed(2)}C`);
                        } else {
                          datap.push(`${points[index + 1].x.toFixed(2)} ${points[index + 1].y.toFixed(2)} `);
                        }
                      } else {
                        // 记录第一个节点，用于在关闭路径的时候使用
                        datap.push(`M${points[index + 1].x.toFixed(2)} ${points[index + 1].y.toFixed(2)}C`);
                      }
                    } else {
                      //结束点
                      datap.push(
                        `${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}Z`
                      );
                    }
                  });
                  path = path + datap.join("");
                });

                // console.log(paths, data, points, path);
                SVG += startpathsc + path + endpathsc;
              } else {
                let image = "";
                if (psdc.hasOwnProperty("placedLayer")) {
                } else if (psdc.hasOwnProperty("children")) {
                  // console.log(psdc.name);
                  psdc.children.forEach((child, index) => {
                    const promise = (async () => {
                      const canvas = createCanvas(child.imageData.width, child.imageData.height);
                      const cavansCtx = canvas.getContext("2d");
                      cavansCtx.putImageData(child.imageData, 0, 0);
                      console.log("1");
                      const webpDataURL = await processImage(canvas);
                      console.log("1-1");
                      image += `<image crossOrigin='anonymous'  width='${child.right - child.left}' height='${
                        child.bottom - child.top
                      }' id='image${child.id}' href='${webpDataURL}' xlink:href='${webpDataURL}'/>`;
                      // console.log(image);
                    })();
                    promises1.push(promise);
                  });
                } else {
                  // console.log(psdc.name);
                  const promise = (async () => {
                    const canvas = createCanvas(psdc.imageData.width, psdc.imageData.height);
                    const cavansCtx = canvas.getContext("2d");
                    cavansCtx.putImageData(psdc.imageData, 0, 0);
                    console.log("2", index);
                    const webpDataURL = await processImage(canvas);
                    console.log("2-2", index);
                    image = `<image crossOrigin='anonymous'  width='${psdc.right - psdc.left}' height='${
                      psdc.bottom - psdc.top
                    }' id='image${psdc.id}' href='${webpDataURL}' xlink:href='${webpDataURL}'/>`;
                    // console.log(image);
                  })();
                  promises1.push(promise);
                }
                await Promise.all(promises1);
                SVG += image;
                console.log("SVG += image", index, image.length);
              }
            }
          });
          await Promise.all(promises1);

          const endsvg = "</defs><style> tspan { white-space:pre }</style>";
          SVG += endsvg;
          console.log("SVG += endsvg");
          
          psdC.forEach((psdc, index) => {
            if (psdc.hidden == false) {
              //图层变换
              if (psdc.hasOwnProperty("mask") || psdc.hasOwnProperty("placedLayer")) {
                var transform = [];
                var meshPoints = [];
                var meshPointsf = [];
                var nonAffine = 0;
                var x_min = 0,
                  x_max = 0,
                  y_min = 0,
                  y_max = 0;
                xx = 1000;
                yy = 1000;
                if (psdc.hasOwnProperty("placedLayer")) {
                  transform = psdc.placedLayer.transform;
                  meshPoints = [];
                } else {
                  transform = psdc.children[0].placedLayer.transform;
                  //非仿射变换、透视变换，可通过四组点求解透视变换矩阵。
                  if (psdc.children[0].placedLayer.hasOwnProperty("nonAffineTransform")) {
                    //四组点，线性插值得8个插值点，得到九宫格区块
                    for (i = 0; i < 8; i = i = i + 2) {
                      //i: 0,2,4,6
                      let x, y, x1, y1;
                      if (i == 6) {
                        x = (psdc.children[0].placedLayer.transform[i] + 2 * psdc.children[0].placedLayer.transform[i - 6]) / 3;
                        x1 = (2 * psdc.children[0].placedLayer.transform[i] + psdc.children[0].placedLayer.transform[i - 6]) / 3;
                        y = (psdc.children[0].placedLayer.transform[i + 1] + 2 * psdc.children[0].placedLayer.transform[i + 1 - 6]) / 3;
                        y1 = (2 * psdc.children[0].placedLayer.transform[i + 1] + psdc.children[0].placedLayer.transform[i + 1 - 6]) / 3;
                      } else {
                        x = (psdc.children[0].placedLayer.transform[i] + 2 * psdc.children[0].placedLayer.transform[i + 2]) / 3;
                        x1 = (2 * psdc.children[0].placedLayer.transform[i] + psdc.children[0].placedLayer.transform[i + 2]) / 3;
                        y = (psdc.children[0].placedLayer.transform[i + 1] + 2 * psdc.children[0].placedLayer.transform[i + 1 + 2]) / 3;
                        y1 = (2 * psdc.children[0].placedLayer.transform[i + 1] + psdc.children[0].placedLayer.transform[i + 1 + 2]) / 3;
                      }
                      meshPointsf[i] = { x: x1, y: y1 };
                      meshPointsf[i + 1] = { x: x, y: y };
                    }
                    nonAffine = 1;
                    let A, B, C, D;
                    //使用双线性插值得到的九宫格的4个内点
                    let point, point2, point3, point4;
                    A = [meshPointsf[0].x.toFixed(3), meshPointsf[0].y.toFixed(3)];
                    B = [meshPointsf[5].x.toFixed(3), meshPointsf[5].y.toFixed(3)];
                    C = [meshPointsf[7].x.toFixed(3), meshPointsf[7].y.toFixed(3)];
                    D = [meshPointsf[2].x.toFixed(3), meshPointsf[2].y.toFixed(3)];
                    point = segmentsIntr(A, B, C, D);
                    console.log(point);
                    A = [meshPointsf[1].x.toFixed(3), meshPointsf[1].y.toFixed(3)];
                    B = [meshPointsf[4].x.toFixed(3), meshPointsf[4].y.toFixed(3)];
                    C = [meshPointsf[7].x.toFixed(3), meshPointsf[7].y.toFixed(3)];
                    D = [meshPointsf[2].x.toFixed(3), meshPointsf[2].y.toFixed(3)];
                    point2 = segmentsIntr(A, B, C, D);
                    console.log(point2);
                    A = [meshPointsf[0].x.toFixed(3), meshPointsf[0].y.toFixed(3)];
                    B = [meshPointsf[5].x.toFixed(3), meshPointsf[5].y.toFixed(3)];
                    C = [meshPointsf[6].x.toFixed(3), meshPointsf[6].y.toFixed(3)];
                    D = [meshPointsf[3].x.toFixed(3), meshPointsf[3].y.toFixed(3)];
                    point3 = segmentsIntr(A, B, C, D);
                    console.log(point3);
                    A = [meshPointsf[1].x.toFixed(3), meshPointsf[1].y.toFixed(3)];
                    B = [meshPointsf[4].x.toFixed(3), meshPointsf[4].y.toFixed(3)];
                    C = [meshPointsf[6].x.toFixed(3), meshPointsf[6].y.toFixed(3)];
                    D = [meshPointsf[3].x.toFixed(3), meshPointsf[3].y.toFixed(3)];
                    point4 = segmentsIntr(A, B, C, D);
                    console.log(point4);
                    //九宫格的全部16个点，按行排序
                    let meshPointss = [
                      { x: transform[0], y: transform[1] },
                      meshPointsf[0],
                      meshPointsf[1],
                      { x: transform[2], y: transform[3] },
                      meshPointsf[7],
                      { x: point[0], y: point[1] },
                      { x: point2[0], y: point2[1] },
                      meshPointsf[2],
                      meshPointsf[6],
                      { x: point3[0], y: point3[1] },
                      { x: point4[0], y: point4[1] },
                      meshPointsf[3],
                      { x: transform[6], y: transform[7] },
                      meshPointsf[5],
                      meshPointsf[4],
                      { x: transform[4], y: transform[5] },
                    ];
                    //通过dstCorners和srcCorners四对九宫格的角点求解透视变换Perspt，meshPoints保存目标九宫格点
                    var dstCorners = psdc.children[0].placedLayer.nonAffineTransform;
                    var srcCorners = psdc.children[0].placedLayer.transform;
                    var Perspt = PerspT(srcCorners, dstCorners);
                    meshPointss.forEach(srcPt => {
                      let dstPt = Perspt.transform(srcPt.x, srcPt.y);
                      meshPoints.push({ x: dstPt[0], y: dstPt[1] });
                    });
                  } else if (psdc.children[0].placedLayer.warp.hasOwnProperty("customEnvelopeWarp")) {
                    //自定义变换，计算矩形区域的长宽
                    meshPoints = psdc.children[0].placedLayer.warp.customEnvelopeWarp.meshPoints;
                    for (var i = 0; i < meshPoints.length; i++) {
                      if (i == 0) {
                        x_min = meshPoints[i].x;
                        x_max = meshPoints[i].x;
                        y_min = meshPoints[i].y;
                        y_max = meshPoints[i].y;
                      } else {
                        if (x_min > meshPoints[i].x) {
                          x_min = meshPoints[i].x;
                        }
                        if (x_max < meshPoints[i].x) {
                          x_max = meshPoints[i].x;
                        }
                        if (y_min > meshPoints[i].y) {
                          y_min = meshPoints[i].y;
                        }
                        if (y_max < meshPoints[i].y) {
                          y_max = meshPoints[i].y;
                        }
                      }
                    }
                    xx = x_max - x_min;
                    yy = y_max - y_min;
                  } else {
                    xx = psdc.children[0].placedLayer.width;
                    yy = psdc.children[0].placedLayer.height;
                  }
                }
                //通过A、B点连线的斜率计算旋转角度
                var rotation = Math.atan2(transform[3] - transform[1], transform[2] - transform[0]);
                //console.log('旋转θ',rotation);
                var cx = (transform[0] + transform[4]) / 2,
                  cy = (transform[1] + transform[5]) / 2;
                //console.log('旋转中心x',cx);
                //console.log('旋转中心y',cy);

                var x = Math.sqrt(Math.pow(transform[2] - transform[0], 2) + Math.pow(transform[3] - transform[1], 2));
                var y = Math.sqrt(Math.pow(transform[6] - transform[0], 2) + Math.pow(transform[7] - transform[1], 2));
                //console.log('宽',x);
                //console.log('长',y);

                var tx = (transform[0] - cx) * Math.cos(-rotation) - (transform[1] - cy) * Math.sin(-rotation) + cx,
                  ty = (transform[1] - cy) * Math.cos(-rotation) + (transform[0] - cx) * Math.sin(-rotation) + cy;
                //console.log('平移x',tx);
                //console.log('平移y',ty);

                var sx = x / xx,
                  sy = y / yy;
                //console.log('缩放x',sx);
                //console.log('缩放y',sy);

                const mc = Math.cos(rotation);
                const ms = Math.sin(rotation);
                //二维变换矩阵
                /**
                 * a b c
                 * d e f
                 */
                if (nonAffine == 1) {
                  /**
                 * 1 0 0
                 * 0 1 1
                 */
                  var a = 1,
                    b = 0,
                    c = 0,
                    d = 0,
                    e = 1,
                    f = 1;
                } else {
                 /**
                 * cosθ -sinθ 0
                 * sinθ cosθ  1
                 */
                  var a = sx * mc,
                    b = -sx * ms,
                    c = 0,
                    d = sy * ms,
                    e = sy * mc,
                    f = 1;
                }
                // var a = sx * mc,
                //   b = -sx * ms,
                //   c = 0,
                //   d = sy * ms,
                //   e = sy * mc,
                //   f = 1;
                var psdchildren = [];
                var g_use = "";
                if (psdc.hasOwnProperty("placedLayer")) {
                  psdchildren = psdc;
                  g_use = `<use id="${psdchildren.name}" style="opacity:${psdchildren.opacity.toFixed(3)};mix-blend-mode: ${
                    psdchildren.blendMode
                  }" href="#${psdchildren.placedLayer.id}" xlink:href="#${
                    psdchildren.placedLayer.id
                  }" data-points-x="" data-points-y="" data-BoundingRect="0,0,${psd.width},${psd.height}" data-rect="0,0,${psd.width},${
                    psd.height
                  }" data-affine="0,0,${psd.width},0,${psd.height},${psd.width},0,${
                    psd.height
                  }" transform="matrix(1,0,0,1,0,0)" data-matrix3="1,0,0,0,1,0,0,0,1"/>`;
                } else if (
                  psdc.children[0].placedLayer.warp.hasOwnProperty("customEnvelopeWarp") ||
                  psdc.children[0].placedLayer.hasOwnProperty("nonAffineTransform")
                ) {
                  psdchildren = psdc.children[0];
                  g_use = `<g id="${psdc.name}" clip-path="url(#clip-path${psdchildren.id})"><use id="${psdchildren.name}" style="opacity:${
                    psdchildren.opacity.toFixed(3)
                  };mix-blend-mode: ${psdchildren.blendMode}" href="#${psdchildren.placedLayer.id}" xlink:href="#${
                    psdchildren.placedLayer.id
                  }" data-points-x="${meshPoints[0].x},${meshPoints[1].x},${meshPoints[2].x},${meshPoints[3].x},${meshPoints[4].x},${
                    meshPoints[5].x
                  },${meshPoints[6].x},${meshPoints[7].x},${meshPoints[8].x},${meshPoints[9].x},${meshPoints[10].x},${meshPoints[11].x},${
                    meshPoints[12].x
                  },${meshPoints[13].x},${meshPoints[14].x},${meshPoints[15].x}" data-points-y="${meshPoints[0].y},${meshPoints[1].y},${
                    meshPoints[2].y
                  },${meshPoints[3].y},${meshPoints[4].y},${meshPoints[5].y},${meshPoints[6].y},${meshPoints[7].y},${meshPoints[8].y},${
                    meshPoints[9].y
                  },${meshPoints[10].y},${meshPoints[11].y},${meshPoints[12].y},${meshPoints[13].y},${meshPoints[14].y},${
                    meshPoints[15].y
                  }" data-BoundingRect="${transform[0]},${transform[3]},${transform[4] - transform[0]},${
                    transform[7] - transform[3]
                  }" data-rect="${psdchildren.left},${psdchildren.top},${psdc.children[0].right - psdc.children[0].left},${
                    psdc.children[0].bottom - psdc.children[0].top
                  }" data-affine="${transform[0]},${transform[1]},${transform[2]},${transform[3]},${transform[4]},${transform[5]},${
                    transform[6]
                  },${transform[7]}" data-matrix3="${a},${b},${c},${d},${e},${f},0,0,1" /> </g>`;
                } else {
                  psdchildren = psdc.children[0];
                  g_use = `<g id="${psdc.name}" clip-path="url(#clip-path${psdchildren.id})"><use id="${psdchildren.name}" style="opacity:${
                    psdchildren.opacity.toFixed(3)
                  };mix-blend-mode: ${psdchildren.blendMode}" href="#${psdchildren.placedLayer.id}" xlink:href="#${
                    psdchildren.placedLayer.id
                  }" data-points-x="" data-points-y="" data-BoundingRect="${transform[0]},${transform[3]},${transform[4] - transform[0]},${
                    transform[7] - transform[3]
                  }" data-rect="${psdchildren.left},${psdchildren.top},${psdc.children[0].right - psdc.children[0].left},${
                    psdc.children[0].bottom - psdc.children[0].top
                  }" data-affine="${transform[0]},${transform[1]},${transform[2]},${transform[3]},${transform[4]},${transform[5]},${
                    transform[6]
                  },${transform[7]}" data-matrix3="${a},${b},${c},${d},${e},${f},0,0,1" /> </g>`;
                }
                SVG += g_use;
              } else if (psdc.hasOwnProperty("children")) {
                // console.log(psdc.name);
                psdc.children.forEach((child, index) => {
                  var image = `<use id="${child.name}" style="opacity:${child.opacity.toFixed(3)};mix-blend-mode: ${child.blendMode.replace(
                    /\s+/g,
                    "-"
                  )};" xlink:href="#image${child.id}" href="#image${child.id}" x="${child.left}" y="${child.top}" />`;
                  SVG += image;
                });
              } else {
                // console.log(psdc.name);
                var image = `<use id="${psdc.name}" style="opacity:${psdc.opacity.toFixed(3)};mix-blend-mode: ${psdc.blendMode.replace(
                  /\s+/g,
                  "-"
                )};" xlink:href="#image${psdc.id}" href="#image${psdc.id}" x="${psdc.left}" y="${psdc.top}" />`;
                SVG += image;
              }
            }
          });
          const Endsvg = "</svg>";
          SVG += Endsvg;
          resolve(SVG);
        } else {
          const startsvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 ${psd.width} ${psd.height}" width="${psd.width}" height="${psd.height}"><defs>`;
          // console.log(startsvg);
          SVG += startsvg;
          // const base64 = psd.canvas.toDataURL("image/webp");
          const canvas = createCanvas(psd.canvas.width, psd.canvas.height);
          const context = canvas.getContext("2d");
          const existingData = psd.canvas.getContext("2d").getImageData(0, 0, psd.canvas.width, psd.canvas.height);
          // 创建一个与现有 Canvas 相同尺寸的空图像数据对象
          const newData = context.createImageData(existingData.width, existingData.height);
          // 将现有 Canvas 的像素数据复制到新的图像数据中
          newData.data.set(existingData.data);
          // 将新的图像数据绘制到新的 Canvas 上
          context.putImageData(newData, 0, 0);
          const webpDataURL = await processImage(canvas);
          console.log("SVG += Endsvg");
          SVG += `<image crossOrigin="anonymous" id="image1" href="${webpDataURL}" xlink:href="${webpDataURL}" width="${psd.width}" height="${psd.height}" /></defs>`;
          const image = `<use id="images" style="opacity:1.0" xlink:href="#image1" href="#image1" x="0" y="0" />`;
          SVG += image;
          const Endsvg = "</svg>";
          SVG += Endsvg;
          resolve(SVG);
        }
      })
      .catch(error => {
        console.error("下载文件时出错：", error);
        reject(error);
      });
  });
}
module.exports = svgbat;
