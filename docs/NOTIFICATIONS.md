# Notifications

Plant Care Plus determines care state and exposes
`binary_sensor.<plant>_needs_attention`. Home Assistant automations own delivery,
quiet hours, recipients, and channels. The integration does not introduce a
parallel notification framework.

The rich status sensor supports dashboards that distinguish `approaching`,
`check`, `needs_attention`, `overdue`, and `unknown` rather than reducing every
case to a yes/no notification.
