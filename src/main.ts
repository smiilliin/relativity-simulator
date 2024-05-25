import * as PIXI from "pixi.js";
import { Vector2 } from "./inertial";

function makeDraggable(
  app: PIXI.Application,
  element: HTMLElement,
  resizeCallback: () => void
) {
  let isDragging = false;
  let offsetX = 0,
    offsetY = 0;

  const dragger = document.createElement("span");
  dragger.className = "material-symbols-outlined dragger";
  dragger.textContent = "drag_pan";
  element.appendChild(dragger);

  dragger.addEventListener("pointerdown", (event) => {
    if (isDragging) return;
    isDragging = true;

    const rect = element.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
  });
  dragger.addEventListener("pointerup", (event) => {
    if (!isDragging) return;
    isDragging = false;
  });
  document.addEventListener("pointerleave", () => {
    if (!isDragging) return;
    isDragging = false;
  });
  document.addEventListener("pointermove", (event) => {
    if (!isDragging) return;

    element.style.left = event.clientX - offsetX + "px";
    element.style.top = event.clientY - offsetY + "px";

    if (event.clientX - offsetX < 0) element.style.left = "0px";
    if (event.clientY - offsetY < 0) element.style.top = "0px";

    const rect = element.getBoundingClientRect();
    if (event.clientX - offsetX + rect.width > window.innerWidth)
      element.style.left = window.innerWidth - rect.width + "px";
    if (event.clientY - offsetY + rect.height > window.innerHeight)
      element.style.top = window.innerHeight - rect.height + "px";
  });
  const observer = new ResizeObserver((mutations) => {
    app.renderer.resize(
      mutations[0].contentRect.width,
      mutations[0].contentRect.height
    );
    resizeCallback();
  });

  observer.observe(element);
  return observer;
}
function addButtons(element: HTMLElement, nodelete: boolean) {
  const container = document.createElement("div");
  container.className = "buttonsContainer";
  element.appendChild(container);

  let deleteButton;
  if (!nodelete) {
    deleteButton = document.createElement("span");
    deleteButton.className = "material-symbols-outlined";
    deleteButton.innerText = "delete";
    container.appendChild(deleteButton);
  }
  const playButton = document.createElement("span");
  playButton.className = "material-symbols-outlined";
  playButton.innerText = "play_arrow";
  container.appendChild(playButton);

  const traceButton = document.createElement("span");
  traceButton.className = "material-symbols-outlined";
  traceButton.innerText = "show_chart";
  container.appendChild(traceButton);

  return {
    deleteButton: deleteButton,
    playButton: playButton,
    traceButton: traceButton,
  };
}
function addToFrames(
  frames: HTMLDivElement,
  index: number,
  width: number,
  height: number,
  angle: number,
  size: number,
  x: number,
  y: number
) {
  const frameContainer = document.createElement("form");
  frameContainer.className = "frameContainer";
  const firstContainer = document.createElement("div");

  const indexSpan = document.createElement("span");
  indexSpan.textContent = `(${index}) `;
  firstContainer.appendChild(indexSpan);

  const widthHeight = document.createElement("span");
  widthHeight.textContent = "가로/세로(m)";
  firstContainer.appendChild(widthHeight);

  const widthInput = document.createElement("input");
  const heightInput = document.createElement("input");

  widthInput.value = String(width);
  widthInput.type = "number";
  widthInput.name = "width";
  heightInput.value = String(height);
  heightInput.type = "number";
  heightInput.name = "height";

  firstContainer.appendChild(widthInput);
  firstContainer.appendChild(heightInput);

  const secondContainer = document.createElement("div");

  const angleInput = document.createElement("input");
  const sizeInput = document.createElement("input");

  const angleSpan = document.createElement("span");
  angleSpan.textContent = "이동 각도(도)";
  secondContainer.appendChild(angleSpan);

  angleInput.value = String(angle);
  angleInput.type = "number";
  angleInput.name = "width";
  secondContainer.appendChild(angleInput);

  const sizeSpan = document.createElement("span");
  sizeSpan.textContent = "이동 크기(c 계수)";
  secondContainer.appendChild(sizeSpan);

  sizeInput.value = String(size);
  sizeInput.type = "number";
  sizeInput.name = "height";

  secondContainer.appendChild(sizeInput);

  const thirdContainer = document.createElement("div");

  const xInput = document.createElement("input");
  const yInput = document.createElement("input");

  const xSpan = document.createElement("span");
  xSpan.textContent = "초기 위치(x)";
  thirdContainer.appendChild(xSpan);

  xInput.value = String(x);
  xInput.type = "number";
  xInput.name = "x";
  thirdContainer.appendChild(xInput);

  const ySpan = document.createElement("span");
  ySpan.textContent = "초기 위치(y)";
  thirdContainer.appendChild(ySpan);

  yInput.value = String(y);
  yInput.type = "number";
  yInput.name = "y";

  thirdContainer.appendChild(yInput);

  frameContainer.appendChild(firstContainer);
  frameContainer.appendChild(secondContainer);
  frameContainer.appendChild(thirdContainer);

  frames.appendChild(frameContainer);
  return frameContainer;
}
function addTimer(element: HTMLElement) {
  const timer = document.createElement("span");
  timer.className = "timer";
  timer.textContent = "t=0";
  element.appendChild(timer);
  return timer;
}

const getMapVectorFromScreen = (vector: Vector2, view: PIXI.Container) => {
  return new Vector2(
    (vector.x - view.x) / view.scale.x,
    (vector.y - view.y) / view.scale.y
  );
};
const getScreenVectorFromMap = (vector: Vector2, view: PIXI.Container) => {
  return new Vector2(
    vector.x * view.scale.x + view.x,
    vector.y * view.scale.y + view.y
  );
};
function makeScreen(
  index?: number,
  width?: number,
  height?: number,
  angle?: number,
  size?: number,
  x?: number,
  y?: number
) {
  const container = document.createElement("div");
  container.className = "float";
  container.style.left = Math.random() * window.innerWidth * 0.6 + "px";
  container.style.top = Math.random() * window.innerHeight * 0.4 + "px";
  document.body.appendChild(container);

  const app = new PIXI.Application({
    background: "#000000",
    resizeTo: container,
  });

  container.appendChild(app.view as HTMLCanvasElement);

  const { deleteButton, playButton } = addButtons(container, index == 0);

  const frames = document.getElementById("frames") as HTMLDivElement;
  const frame = addToFrames(
    frames,
    index || 0,
    width || 0,
    height || 0,
    angle || 0,
    size || 0,
    x || 0,
    y || 0
  );
  const indexSpan = document.createElement("span");
  indexSpan.className = "index";
  indexSpan.textContent = `(${index}) `;
  container.appendChild(indexSpan);

  const timer = addTimer(container);
  let viewMoved: () => void;

  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  const view = new PIXI.Container();

  let mouseHolding = false;
  app.stage.on("mousedown", () => {
    mouseHolding = true;
  });
  app.stage.on("mousemove", (event) => {
    if (mouseHolding) {
      view.x += event.movementX;
      view.y += event.movementY;
      viewMoved();
    }
  });
  app.stage.on("mouseup", () => {
    mouseHolding = false;
  });
  app.stage.on("mouseleave", () => {
    mouseHolding = false;
  });
  app.stage.on("wheel", (event) => {
    const rect = container.getBoundingClientRect();
    const oldMouse = getMapVectorFromScreen(
      new Vector2(event.x - rect.left, event.y - rect.top),
      view
    );

    view.scale.x *= 1 - event.deltaY / 1000;
    view.scale.y *= 1 - event.deltaY / 1000;

    if (view.scale.x < 0.4) {
      view.scale.x = 0.4;
      view.scale.y = 0.4;
      viewMoved();
      return;
    }
    if (view.scale.x > 4) {
      view.scale.x = 2;
      view.scale.y = 2;
      viewMoved();
      return;
    }

    const newMouse = getMapVectorFromScreen(
      new Vector2(event.x - rect.left, event.y - rect.top),
      view
    );

    const movement = newMouse.subtract(oldMouse).multiply(view.scale.x);

    view.x += movement.x;
    view.y += movement.y;
    viewMoved();
  });
  const xAxis = new PIXI.Graphics();
  const yAxis = new PIXI.Graphics();

  viewMoved = () => {
    const leftTop = getMapVectorFromScreen(new Vector2(0, 0), view);
    const rightBottom = getMapVectorFromScreen(
      new Vector2(app.screen.width, app.screen.height),
      view
    );

    xAxis.clear();
    xAxis.lineStyle(3, 0x777777, 0.8);
    xAxis.moveTo(leftTop.x, app.screen.height / 2);
    xAxis.lineTo(rightBottom.x, app.screen.height / 2);

    yAxis.clear();
    yAxis.lineStyle(3, 0x777777, 0.8);
    yAxis.moveTo(app.screen.width / 2, leftTop.y);
    yAxis.lineTo(app.screen.width / 2, rightBottom.y);
  };
  view.addChild(xAxis, yAxis);

  const observer = makeDraggable(app, container, viewMoved);

  if (deleteButton) {
    deleteButton.onclick = () => {
      observer.disconnect();
      app.destroy();
      frames.removeChild(frame);
      document.body.removeChild(container);
    };
  }

  app.stage.addChild(view);
  return { app: app, view: view };
}
let currentIndex = 0;
document.getElementById("add")!.onclick = () => {
  makeScreen(currentIndex++, 20, 5, 45, Math.random() / 4 + 0.3);
};

makeScreen(currentIndex++);

// const app = new PIXI.Application({
//   background: "#000000",
//   resizeTo: window,
// });
// document.getElementById("test")?.appendChild(app.view as HTMLCanvasElement);
