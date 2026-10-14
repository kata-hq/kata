// Breaks rule A6: reads the clock.
export const helper = () => [Date.now(), new Date(), Temporal.Now.instant()];
