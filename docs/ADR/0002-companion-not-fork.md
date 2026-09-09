# ADR 0002: Companion, not fork

**Status:** Accepted

Plant Care Plus consumes supported Home Assistant entity state and optionally
links existing plant/reference identifiers. It does not fork Plant Monitor or
depend on undocumented internals, keeping ownership and upgrades independent.
