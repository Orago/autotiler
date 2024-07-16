window.onload = function () {
  const img = document.querySelector("img");
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  trackTransforms(ctx);
  debugger;
  let zoom = 1;
  let mousePos = {
    x: 0,
    y: 0
  };

  draw();
  document.body.addEventListener("mousemove", (e) => {
    const canvas = document.querySelector("canvas");
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
  });

  document.getElementById("canvas").addEventListener("wheel", (e) => {
    e.preventDefault();
    zoom = e.deltaY < 0 ? 1.1 : 0.9;
    scaleDraw();
    draw();
  });

  function draw() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  function scaleDraw() {
    const pt = ctx.transformedPoint(mousePos.x, mousePos.y);
    console.log("PT: " + `${pt.x}, ${pt.y}`);
    console.log("MOUSEPOINTER: " + `${mousePos.x}, ${mousePos.y}`);
    ctx.translate(pt.x, pt.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-pt.x, -pt.y);
  }
};

function trackTransforms(ctx) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  let xform = svg.createSVGMatrix();

  const savedTransforms = [];
  let save = ctx.save;
  ctx.save = () => {
    savedTransforms.push(xform.translate(0, 0));
    return save.call(ctx);
  };

  let restore = ctx.restore;
  ctx.restore = () => {
    xform = savedTransforms.pop();
    return restore.call(ctx);
  };

  let scale = ctx.scale;
  ctx.scale = (sx, sy) => {
    xform = xform.scaleNonUniform(sx, sy);
    return scale.call(ctx, sx, sy);
  };

  let translate = ctx.translate;
  ctx.translate = function (dx, dy) {
    xform = xform.translate(dx, dy);
    return translate.call(ctx, dx, dy);
  };

  let pt = svg.createSVGPoint();
  ctx.transformedPoint = (x, y) => {
    pt.x = x;
    pt.y = y;
    return pt.matrixTransform(xform.inverse());
  };
}
