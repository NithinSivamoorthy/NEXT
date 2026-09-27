/** Input changes targets only; the renderer owns the damped camera pose. */
export type TouchPoint = { id: number | string; x: number; y: number };
const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));

export class UniverseCamera {
  yaw = 0;
  pitch = 0.12;
  distance = 10.5;
  private targetYaw = this.yaw;
  private targetPitch = this.pitch;
  private targetDistance = this.distance;
  private velocityX = 0;
  private velocityY = 0;
  private previous: TouchPoint[] = [];
  private lastTime = 0;
  private touching = false;

  sample(points: TouchPoint[], width: number, height: number, now = Date.now()) {
    const old = this.previous;
    const matching = points.length === old.length && points.every((p, i) => p.id === old[i]?.id);
    this.touching = points.length > 0;
    if (matching && points.length === 1) {
      const elapsed = clamp((now - this.lastTime) / 1000, 1 / 120, 0.1);
      const dx = -(points[0].x - old[0].x) / Math.max(width, 1) * 2.5;
      const dy = (points[0].y - old[0].y) / Math.max(height, 1) * 1.8;
      this.targetYaw += dx;
      this.targetPitch = clamp(this.targetPitch + dy, -0.65, 0.65);
      this.velocityX = clamp(dx / elapsed, -1.5, 1.5);
      this.velocityY = clamp(dy / elapsed, -0.8, 0.8);
    } else if (matching && points.length === 2) {
      const distance = (p: TouchPoint[]) => Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      const before = distance(old);
      const after = distance(points);
      if (before > 12 && after > 12) this.zoom(before / after);
      this.velocityX = this.velocityY = 0;
    } else {
      // Re-anchor whenever a finger is added/removed. No jump between drag and pinch.
      this.velocityX = this.velocityY = 0;
    }
    this.previous = points;
    this.lastTime = now;
  }

  release(now = Date.now()) {
    this.touching = false;
    this.previous = [];
    if (now - this.lastTime > 90) this.velocityX = this.velocityY = 0;
  }

  cancel() {
    this.release();
    this.velocityX = this.velocityY = 0;
  }

  zoom(ratio: number) {
    if (!Number.isFinite(ratio) || ratio <= 0) return;
    this.targetDistance = clamp(this.targetDistance * ratio, 5.5, 18.5);
  }

  step(delta: number, reducedMotion: boolean) {
    const dt = Math.min(delta, 0.05);
    if (!this.touching && !reducedMotion) {
      this.targetYaw += this.velocityX * dt;
      this.targetPitch = clamp(this.targetPitch + this.velocityY * dt, -0.65, 0.65);
      const decay = Math.exp(-6 * dt);
      this.velocityX *= decay;
      this.velocityY *= decay;
    }
    const blend = reducedMotion ? 1 : 1 - Math.exp(-10 * dt);
    this.yaw += (this.targetYaw - this.yaw) * blend;
    this.pitch += (this.targetPitch - this.pitch) * blend;
    this.distance += (this.targetDistance - this.distance) * blend;
  }
}
