import type { FirstNext, OnboardingAnswers } from './model';

/** Replace this async implementation in Checkpoint 4; screens consume only this contract. */
export type Personalizer = (answers: OnboardingAnswers, signal: AbortSignal) => Promise<FirstNext>;

export function buildLocalNext(answers: OnboardingAnswers): FirstNext {
  const cap = { gentle: 5, balanced: 10, push: 15 }[answers.challengeLevel];
  const estimatedMinutes = Math.min(answers.dailyCommitment, cap);
  const context = `${answers.movingFrom} ${answers.reason} ${answers.progressVision}`.toLowerCase();
  const closing = {
    gentle: 'One small attempt is enough for today.',
    balanced: 'Before you stop, choose when you could do this again.',
    push: 'Finish by setting out what you need to repeat this tomorrow.',
  }[answers.challengeLevel];
  let title: string;
  let description: string;
  if (/scroll|phone|screen|social media/.test(context)) {
    title = 'Make a little room beyond the screen.';
    description = `Put your phone out of reach. Spend ${estimatedMinutes} minutes on one offline thing: read a page, draw, or tidy a small surface. Choose just one.`;
  } else if (/relationship|breakup|break-up|ex-partner|lonel|friend|connect/.test(context)) {
    title = 'Make one small connection.';
    description = `Take up to ${estimatedMinutes} minutes to write a simple check-in to someone you feel comfortable with. Send it if you want to; writing it is a complete first step.`;
  } else if (/setback|fail|work|study|procrast|career|putting.*off/.test(context)) {
    title = 'Begin the smallest part.';
    description = `Pick one task you have been putting off. Open what you need and work on its smallest part for ${estimatedMinutes} minutes. Stop when the time is up.`;
  } else {
    title = 'Clear a small space for what comes next.';
    description = `Choose one small surface near you. Spend up to ${estimatedMinutes} minutes putting a few things back where they belong. Leave one thing there that you would like to use tomorrow.`;
  }
  return { title, description: `${description} ${closing}`, estimatedMinutes };
}

export const personalizeLocally: Personalizer = async (answers, signal) => {
  if (signal.aborted) throw new Error('Personalization cancelled');
  return buildLocalNext(answers);
};
