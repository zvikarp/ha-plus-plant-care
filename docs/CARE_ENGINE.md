# Care engine

The engine answers whether evidence says a plant needs attention. It never
pretends that a calendar alone measured dry soil.

1. With an available moisture source, moisture is primary. At or below the
   minimum means `needs_attention`; below the target means `approaching`; a
   healthy reading means `ok` even when the schedule date passed.
2. Without available moisture, the fixed schedule is used. At 80% of the
   interval the status is `approaching`, at 100% it is `check`, and at 150% it
   is `overdue`.
3. With neither a reading nor a prior watering event, the result is `unknown`.
4. A snooze suppresses the boolean recommendation until it expires while
   retaining the underlying rich status.

An unavailable assigned source is called out in the status reason and schedule
fallback is automatic. Indoor/outdoor weather adjustments are intentionally
deferred until they can be introduced conservatively and tested independently.
