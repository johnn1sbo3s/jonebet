# The área style mirrors the bar rule instead of plotting two series

In the **área** style, one band per minute runs from the centre line to the higher of the two teams' values, on the side of the team that dominated that minute — exactly the rule the **barras** style already follows, with the shape changed from a bar to a filled band. It is not two simultaneous series, home and away, each drawn for its own value.

## Context

The chart's claim is singular: at this minute, this team pressed more. Bars express that claim directly — one mark per minute, its side is the answer, its height is how clear the answer was. The area style exists to change how that claim looks, not what it says. Any rendering that plots both teams at the same time would silently upgrade the chart into a different claim, a two-series comparison of magnitude, where a small opposing value would appear as its own visible band.

## Considered Options

- **Two mirrored areas, one per team, overlaid.** Rejected despite giving strictly more information, because it changes the meaning of the graphic: readers would start comparing band heights minute by minute and infer momentum from two simultaneous series, when the screen has always asserted "who pressed more", not "how much each team pressed". The extra information is real, but it belongs to a different chart, and swapping it in here would make the two styles disagree about what the screen is saying rather than merely how it looks.

## Consequences

Easier: the two styles are interchangeable readings of one rule, so switching shapes never changes the interpretation, and the visual vocabulary stays one-sided — the side of the centre line is always the answer.

Harder: the chart deliberately discards the losing team's magnitude for each minute; a reader who wants both values at once cannot get them from this graphic. Because the frame and the time axis are identical in both styles, the goal and shot markers stay overlaid on the chart in either shape — they are read against the same minute scale, so neither style can hide or displace them.
