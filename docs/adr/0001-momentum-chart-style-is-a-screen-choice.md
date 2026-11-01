# Momentum chart style is a screen-level choice

Every live scanner card draws a momentum chart: minute by minute, which team pressed harder. The same information can be read in two shapes — **barras**, a bar per minute rising from the centre line, and **área**, a filled band from the centre line to the value. We decided the drawing style belongs to the scanner screen, not to a game: one control drives every card at once, bars is the default on first visit, the choice is remembered in the browser between visits, and it never reaches the relatório de amanhã, which does not draw this chart at all.

## Context

The chart is a comparison instrument, not a per-game artefact. A user scanning a screen full of cards is comparing games — "which of these is actually being pressed?" — and a mixed screen forces them to re-read each card's shape before they can compare its content. The two styles also differ in density: bars show the minute grid crisply, while the filled band reads faster at a glance. That is a preference about the viewer, not about a particular match, and it stays stable from one visit to the next.

## Considered Options

- **A control per card.** Rejected because it produces a screen where two cards assert the same thing in two different shapes, defeating the very comparison the screen exists for, and it adds a state to every card that no game-level concept owns.
- **No memory between visits.** Rejected because the preference is about the person, not the session: making a returning user set it again every time they open the scanner adds friction to a purely visual habit.
- **Área as default.** Rejected because bars are the shape already shipped and already read by the current users of the screen; changing the starting shape trades familiarity for no matching gain, and area remains one click away.

## Consequences

Easier: one control, one piece of state, and a screen where every card is directly comparable at a glance; the preference is expressed once and follows the user.

Harder: the control cannot be reused for cases where a single game genuinely needs a different shape, and the chart-style state must live outside the per-card data model — a card is not self-contained, it renders according to a screen-wide setting. The relatório de amanhã stays out of scope by design: it has no momentum chart, so the remembered choice has nothing to apply to there, and nothing about the report should appear to depend on it.
