import { CONSEQUENCE_SETTLE, REDUCED_SETTLE } from './consequence';
import { experienceReducer, initialExperience, type ExperienceState } from '../../experience/model';

export const LIGHT_DELAY = 0.45;
export const INSTRUCTION_DELAY = 1.25;
export const QUESTION_DELAY = 1.1;
export type Phase = 'waiting' | 'committed' | 'questionVisible' | 'answered' | 'settled';
export type Snapshot = { phase: Phase; available: boolean; atHold: boolean; instruction: boolean; valid: boolean };

/** Isolated session using the production model/reducer, never the production provider. */
export class FirstContact {
  phase: Phase = 'waiting';
  available = false;
  active = true;
  atHold = false;
  elapsed = 0;
  appearedAt = 0;
  answeredAt = 0;
  pressed = false;
  commitCount = 0;
  answerCommitCount = 0;
  draft = '';
  state: ExperienceState = initialExperience;
  private instruction = false;
  private revealAt = Infinity;
  private questionAt = Infinity;
  onChange: (snapshot: Snapshot) => void = () => {};
  get valid() { return this.draft.trim().length > 0; }
  get snapshot(): Snapshot {
    return { phase: this.phase, available: this.available, atHold: this.atHold, instruction: this.instruction, valid: this.valid };
  }
  private publish() { this.onChange(this.snapshot); }
  markHold() {
    if (this.atHold) return;
    this.atHold = true;
    this.revealAt = this.elapsed + LIGHT_DELAY;
    this.publish();
  }
  setActive(active: boolean) { this.active = active; if (!active) this.cancel(); }
  step(dt: number, reducedMotion = false) {
    if (!this.active) return;
    this.elapsed += Math.min(dt, 0.05);
    if (!this.available && this.elapsed >= this.revealAt) {
      this.available = true; this.appearedAt = this.elapsed; this.publish();
    }
    if (this.available && this.phase === 'waiting' && !this.instruction && this.elapsed >= this.appearedAt + INSTRUCTION_DELAY) {
      this.instruction = true; this.publish();
    }
    if (this.phase === 'answered' && this.elapsed - this.answeredAt >= (reducedMotion ? REDUCED_SETTLE : CONSEQUENCE_SETTLE)) {
      this.phase = 'settled'; this.publish();
    }
    if (this.phase === 'committed' && this.elapsed >= this.questionAt) {
      this.phase = 'questionVisible'; this.publish();
    }
  }
  begin() { if (this.active && this.available) this.pressed = true; }
  release(inside: boolean) {
    const validTap = this.pressed && inside && this.active;
    this.cancel();
    if (validTap) this.activate();
  }
  cancel() { this.pressed = false; }
  edit(value: string) {
    if (this.phase !== 'questionVisible') return;
    const wasValid = this.valid;
    this.draft = value;
    if (wasValid !== this.valid) this.publish();
  }
  activate() {
    if (!this.active || !this.available) return;
    if (this.phase === 'waiting' && !this.commitCount) {
      this.commitCount = 1;
      this.instruction = false;
      this.phase = 'committed';
      this.questionAt = this.elapsed + QUESTION_DELAY;
      this.publish();
    } else if (this.phase === 'questionVisible' && this.valid && !this.answerCommitCount) {
      this.answerCommitCount = 1;
      this.state = experienceReducer(this.state, { type: 'answer', field: 'movingFrom', value: this.draft.trim() });
      this.phase = 'answered'; this.answeredAt = this.elapsed;
      this.publish();
    }
  }
}
