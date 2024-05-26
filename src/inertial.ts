import Matrix from "ml-matrix";

class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  add(vector: Vector2) {
    return new Vector2(this.x + vector.x, this.y + vector.y);
  }
  subtract(vector: Vector2) {
    return new Vector2(this.x - vector.x, this.y - vector.y);
  }
  multiply(x: number) {
    return new Vector2(this.x * x, this.y * x);
  }
  clone() {
    return new Vector2(this.x, this.y);
  }
}

const c = 299792458;

interface IGamma {
  g: number;
  gx: number;
  gy: number;
}

class InertialFrame {
  velocity: Vector2;
  initialVector: Vector2;

  constructor(velocity: Vector2, initialVector: Vector2) {
    this.velocity = velocity.clone();
    this.initialVector = initialVector.clone();
  }
  observe(
    invertedMatrix: Matrix,
    relativeVector: Vector2,
    gamma: IGamma,
    t: number,
    offset?: Vector2
  ): { t: number; vector: Vector2 } {
    const result = invertedMatrix.mmul(
      Matrix.columnVector([(t * c) / gamma.g, 0, 0])
    );

    return {
      t: t / gamma.g,
      vector: new Vector2(result.get(1, 0), result.get(2, 0))
        .add(
          new Vector2((offset?.x || 0) / gamma.gx, (offset?.y || 0) / gamma.gy)
        )
        .add(relativeVector),
    };
  }
  getRelativeVector(other: InertialFrame): Vector2 {
    const { matrix } = this.lorentz();
    const relativeVector = other.initialVector.subtract(this.initialVector);
    const result = matrix.mmul(
      Matrix.columnVector([0, relativeVector.x, relativeVector.y])
    );

    return new Vector2(result.get(1, 0), result.get(2, 0));
  }
  lorentz(other?: InertialFrame): { matrix: Matrix; gamma: IGamma } {
    const relativeVelocity =
      other?.velocity.subtract(this.velocity) || new Vector2(0, 0);

    const vx = relativeVelocity.x;
    const vy = relativeVelocity.y;

    const bx = vx / c;
    const gx = 1 / Math.sqrt(1 - bx * bx);
    const by = vy / c;
    const gy = 1 / Math.sqrt(1 - by * by);

    const matx = new Matrix([
      [gx, -gx * bx, 0],
      [-gx * bx, gx, 0],
      [0, 0, 1],
    ]);
    const maty = new Matrix([
      [gy, 0, -gy * by],
      [0, 1, 0],
      [-gy * by, 0, gy],
    ]);

    const v = Math.sqrt(vx * vx + vy * vy);
    const b = v / c;
    const g = 1 / Math.sqrt(1 - b * b);

    return { matrix: maty.mmul(matx), gamma: { g: g, gx: gx, gy: gy } };
  }
}

export { InertialFrame, Vector2, c, IGamma };
