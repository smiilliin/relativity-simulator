import * as PIXI from "pixi.js";
import { IGamma, InertialFrame, Vector2, c } from "./inertial";
import { addButtons, addTimer, addToFrames, makeDraggable } from "./ui";
import Matrix, { inverse } from "ml-matrix";

function getMapVectorFromScreen(vector: Vector2, view: PIXI.Container) {
  return new Vector2(
    (vector.x - view.x) / view.scale.x,
    (vector.y - view.y) / view.scale.y
  );
}
const framesDiv = document.getElementById("frames") as HTMLDivElement;

let critIndex = 0;
let start = false;
let paused = false;

interface IFrame {
  playButton: HTMLSpanElement;
  ticker: (t: number) => void;
  onUpdate: () => void;
  reset: () => void;
  inertialFrame: InertialFrame;
  width: number;
  height: number;
  angle: number;
}
const frames: Map<number, IFrame> = new Map();

function makeScreen(
  index: number,
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

  if (start) playButton.textContent = "pause";

  const {
    frameContainer,
    xInput,
    yInput,
    widthInput,
    heightInput,
    sizeInput,
    angleInput,
  } = addToFrames(
    framesDiv,
    index || 0,
    width || 0,
    height || 0,
    angle || 0,
    size || 0,
    x || 0,
    y || 0
  );

  if (index == 0) {
    framesDiv.removeChild(frameContainer);
  }

  const indexSpan = document.createElement("span");
  indexSpan.className = "index";
  indexSpan.textContent = `(${index == 0 ? "static" : index}) `;
  container.appendChild(indexSpan);

  const timer = addTimer(container);
  function viewMoved() {
    const leftTop = getMapVectorFromScreen(new Vector2(0, 0), view);
    const rightBottom = getMapVectorFromScreen(
      new Vector2(app.screen.width, app.screen.height),
      view
    );

    xAxis.clear();
    xAxis.lineStyle(3, 0x777777, 0.8);
    xAxis.moveTo(leftTop.x, 0);
    xAxis.lineTo(rightBottom.x, 0);

    yAxis.clear();
    yAxis.lineStyle(3, 0x777777, 0.8);
    yAxis.moveTo(0, leftTop.y);
    yAxis.lineTo(0, rightBottom.y);
  }

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
    }
    if (view.scale.x > 4) {
      view.scale.x = 4;
      view.scale.y = 4;
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

  view.addChild(xAxis, yAxis);

  const observer = makeDraggable(app, container, viewMoved);

  if (deleteButton) {
    deleteButton.onclick = () => {
      observer.disconnect();
      app.destroy();
      framesDiv.removeChild(frameContainer);
      document.body.removeChild(container);
      frames.delete(index);
      frames.forEach((frame) => frame.onUpdate());
    };
  }

  app.stage.addChild(view);

  let startTime = 0;
  let pausedTime = 0;

  playButton.onclick = () => {
    if (playButton.textContent == "pause" || playButton.textContent == "hub") {
      if (index == critIndex) {
        start = false;
        paused = true;
        pausedTime = Date.now();

        frames.forEach(
          (frame) => (frame.playButton.textContent = "play_arrow")
        );
      } else {
        start = true;
        startTime = Date.now();

        frames.get(critIndex)?.reset();
        critIndex = index;

        frames.forEach((frame) => (frame.playButton.textContent = "pause"));
        playButton.textContent = "hub";
      }
      return;
    }

    if (!(paused && index == critIndex)) {
      startTime = Date.now();
      critIndex = index;
    } else {
      startTime += Date.now() - pausedTime;
    }

    critIndex = index || 0;
    start = true;

    frames.forEach((frame) => (frame.playButton.textContent = "pause"));
    playButton.textContent = "hub";
  };

  let inertialFrame = new InertialFrame(
    new Vector2(
      Math.cos(((angle || 0) / 180) * Math.PI) * (size || 0) * c,
      Math.sin(((angle || 0) / 180) * Math.PI) * (size || 0) * c
    ),
    new Vector2(x || 0, y || 0)
  );
  const matrices: Map<number, Matrix> = new Map();
  const invmatrices: Map<number, Matrix> = new Map();
  const relativeVectors: Map<number, Vector2> = new Map();
  const offsets: Map<number, Vector2[]> = new Map();
  const gs: Map<number, IGamma> = new Map();
  const graphics: Map<number, PIXI.Graphics> = new Map();

  const ticker = (ct: number, relativeCTs?: Map<number, number>) => {
    timer.textContent = `ct=${ct.toFixed(2)}`;

    graphics.forEach((graphic, i) => {
      graphic.clear();
      graphic.lineStyle(3, 0xffffff);

      const invmatrix = invmatrices.get(i) as Matrix;
      const relativeVector = relativeVectors.get(i) as Vector2;
      const offsetsArray = offsets.get(i) as Vector2[];

      const g = gs.get(i) as IGamma;

      const { t: relativeT, vector: vector1 } = inertialFrame.observe(
        invmatrix,
        relativeVector,
        g,
        ct / c,
        offsetsArray[0]
      );
      const { vector: vector2 } = inertialFrame.observe(
        invmatrix,
        relativeVector,
        g,
        ct / c,
        offsetsArray[1]
      );
      const { vector: vector3 } = inertialFrame.observe(
        invmatrix,
        relativeVector,
        g,
        ct / c,
        offsetsArray[2]
      );
      const { vector: vector4 } = inertialFrame.observe(
        invmatrix,
        relativeVector,
        g,
        ct / c,
        offsetsArray[3]
      );

      relativeCTs?.set(i, relativeT * c);

      graphic.moveTo(vector1.x * 20, -vector1.y * 20);
      graphic.lineTo(vector2.x * 20, -vector2.y * 20);
      graphic.lineTo(vector3.x * 20, -vector3.y * 20);
      graphic.lineTo(vector4.x * 20, -vector4.y * 20);
      graphic.closePath();
    });
  };
  const onUpdate = () => {
    matrices.clear();
    invmatrices.clear();
    graphics.forEach((graphic) => view.removeChild(graphic));
    graphics.clear();

    frames.forEach((frame, i) => {
      const { matrix, gamma } = inertialFrame.lorentz(frame.inertialFrame);
      matrices.set(i, matrix);
      invmatrices.set(i, inverse(matrix));
      gs.set(i, gamma);

      const rotate = (vector: Vector2, angle: number) => {
        angle = (angle / 180) * Math.PI;
        return new Vector2(
          vector.x * Math.cos(angle) - vector.y * Math.sin(angle),
          vector.x * Math.sin(angle) + vector.y * Math.cos(angle)
        );
      };

      relativeVectors.set(
        i,
        inertialFrame.getRelativeVector(frame.inertialFrame)
      );

      const offsetsArray = [
        rotate(new Vector2(0, frame.height / 2), frame.angle),
        rotate(new Vector2(0, -frame.height / 2), frame.angle),
        rotate(new Vector2(-frame.width, -frame.height / 2), frame.angle),
        rotate(new Vector2(-frame.width, frame.height / 2), frame.angle),
      ];

      offsets.set(i, offsetsArray);

      const graphic = new PIXI.Graphics();
      graphics.set(i, graphic);
      view.addChild(graphic);
    });
  };

  let lastCT = 0;
  app.ticker.add(() => {
    if (critIndex != index) return;

    let ct;
    if (start) {
      ct = (Date.now() - startTime) / (1000 / 5);
      lastCT = ct;
    } else {
      if (paused) {
        ct = lastCT;
      } else {
        ct = 0;
      }
    }

    const relativeCTs: Map<number, number> = new Map();
    ticker(ct, relativeCTs);

    frames.forEach((frame, i) => {
      if (index != i) frame.ticker(relativeCTs.get(i) as number);
    });
  });
  const reset = () => {
    startTime = Date.now();
  };

  frames.set(index || 0, {
    playButton: playButton,
    ticker: ticker,
    onUpdate: onUpdate,
    reset: reset,
    width: width || 0,
    height: height || 0,
    angle: angle || 0,
    inertialFrame: inertialFrame,
  });

  view.x = app.screen.width / 2;
  view.y = app.screen.height / 2;

  const inputChanged = () => {
    start = false;
    paused = false;
    frames.forEach((frame) => (frame.playButton.textContent = "play_arrow"));

    angle = Number(angleInput.value);
    width = Number(widthInput.value);
    height = Number(heightInput.value);
    size = Number(sizeInput.value);
    x = Number(xInput.value);
    y = Number(yInput.value);

    inertialFrame = new InertialFrame(
      new Vector2(
        Math.cos(((angle || 0) / 180) * Math.PI) * (size || 0) * c,
        Math.sin(((angle || 0) / 180) * Math.PI) * (size || 0) * c
      ),
      new Vector2(x || 0, y || 0)
    );

    frames.set(index || 0, {
      playButton: playButton,
      ticker: ticker,
      onUpdate: onUpdate,
      reset: reset,
      width: width || 0,
      height: height || 0,
      angle: angle || 0,
      inertialFrame: inertialFrame,
    });

    frames.forEach((frame) => frame.onUpdate());
  };

  if (index != 0) {
    xInput.oninput = inputChanged;
    yInput.oninput = inputChanged;
    widthInput.oninput = inputChanged;
    heightInput.oninput = inputChanged;
    angleInput.oninput = inputChanged;
    sizeInput.oninput = inputChanged;
  }
}
let currentIndex = 0;
document.getElementById("add")!.onclick = () => {
  makeScreen(
    currentIndex++,
    5,
    3,
    0,
    Math.floor((Math.random() / 4 + 0.3) * 100) / 100
  );

  start = false;
  paused = false;
  frames.get(critIndex)?.reset();

  frames.forEach((frame) => {
    frame.onUpdate();
    frame.playButton.textContent = "play_arrow";
  });
};
document.getElementById("restart")!.onclick = () => {
  frames.get(critIndex)?.reset();
  paused = false;
};

makeScreen(currentIndex++);
