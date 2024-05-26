import * as PIXI from "pixi.js";

let maxZ = 1;

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
  element.style.zIndex = String(++maxZ);

  dragger.addEventListener("pointerdown", (event) => {
    if (isDragging) return;
    isDragging = true;

    const rect = element.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    element.style.zIndex = String(++maxZ);
  });
  dragger.addEventListener("pointerup", () => {
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

  return {
    deleteButton: deleteButton,
    playButton: playButton,
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
  return {
    xInput: xInput,
    yInput: yInput,
    widthInput: widthInput,
    heightInput: heightInput,
    angleInput: angleInput,
    sizeInput: sizeInput,
    frameContainer: frameContainer,
  };
}
function addTimer(element: HTMLElement) {
  const timer = document.createElement("span");
  timer.className = "timer";
  timer.textContent = "ct=0";
  element.appendChild(timer);
  return timer;
}

export { makeDraggable, addButtons, addTimer, addToFrames };
