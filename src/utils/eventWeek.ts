export const OFFSEASON_WEEK_NUMBER = 99 as const;

export const getEventWeekLabel = (
  week: number | null | undefined,
  { placeholder = '—' }: { placeholder?: string } = {}
): string => {
  if (week === OFFSEASON_WEEK_NUMBER) {
    return 'Offseason';
  }

  if (typeof week === 'number') {
    return `Week ${week}`;
  }

  return placeholder;
};
