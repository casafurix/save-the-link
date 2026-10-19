export const isInteractiveDragTarget = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  Boolean(
    target.closest(
      "button, input, textarea, select, option, [role='button'], [role='menu'], [role='menuitem'], [contenteditable='true'], [data-no-dnd]",
    ),
  );
