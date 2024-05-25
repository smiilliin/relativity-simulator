// // import { Matrix, Vector } from "ts-matrix";
// import Matrix, { inverse } from "ml-matrix";

import { inverse } from "ml-matrix";
import { InertialFrame, Vector2, c } from "./inertial";

// const c = 299792458;
// const v = 0.6;

// const b = v / c;
// const g = 1 / Math.sqrt(1 - b * b);
// const mat = new Matrix([
//   [g, -g * b, 0],
//   [-g * b, g, 0],
//   [0, 0, 1],
// ]);
// const invmat = inverse(mat);

// let vectors = [];
// for (let i = 0; i < 10; i++) {
//   vectors.push(Matrix.columnVector([(i / 10) * c, 0, 0]));
// }
// // console.log(mat.toString());
// // console.log(vectors[0].toString());
// //mat.
// for (let i = 0; i < vectors.length; i++) {
//   const result = invmat.mmul(vectors[i]);

//   console.log(`(${result.get(1, 0)}, ${result.get(0, 0) / c})`);
// }

// const world = new InertialFrame(new Vector2(0, 0), new Vector2(0, 0));
// const rocket = new InertialFrame(
//   new Vector2(0.1 * c, 0.2 * c),
//   new Vector2(2, 2)
// );
// const rocket2 = new InertialFrame(
//   new Vector2(0.2 * c, 0.3 * c),
//   new Vector2(4, 4)
// );

// const matrix = world.lorentz(rocket);
// const matrix2 = world.lorentz(rocket2);
// // console.log(matrix);
// const invmatrix = inverse(matrix);
// const invmatrix2 = inverse(matrix2);
// const relativeVector = world.getRelativeVector(rocket);
// const relativeVector2 = world.getRelativeVector(rocket2);

// for (let i = 0; i < 3; i += 0.1) {
//   const { t, vector } = world.observe(invmatrix, relativeVector, i / c);

//   // console.log(`(${vector.x}, ${(t * c).toFixed(2)})`);
//   console.log(`(${vector.x}, ${vector.y})`);
// }

// for (let i = 0; i < 3; i += 0.1) {
//   const { t, vector } = world.observe(invmatrix2, relativeVector2, i / c);

//   // console.log(`(${vector.x}, ${(t * c).toFixed(2)})`);
//   console.log(`(${vector.x}, ${vector.y})`);
// }

const rocket = new InertialFrame(
  new Vector2(0.1 * c, 0.2 * c),
  new Vector2(2, 2)
);
const rocket2 = new InertialFrame(
  new Vector2(0.1 * c, 0.3 * c),
  new Vector2(4, 4)
);

const matrix = rocket.lorentz(rocket2);
// console.log(matrix);
const invmatrix = inverse(matrix);
const relativeVector = rocket.getRelativeVector(rocket2);

for (let i = 0; i < 3; i += 0.1) {
  const { t, vector } = rocket.observe(invmatrix, relativeVector, i / c);

  // console.log(`(${vector.x}, ${(t * c).toFixed(2)})`);
  console.log(`(${vector.x}, ${vector.y})`);
}
