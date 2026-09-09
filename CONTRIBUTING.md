# Contributing

Open an issue before a large change so behavior and ownership stay focused.
Preserve the central invariant: plant identity and history must never depend on
a sensor assignment.

Install the test dependencies with Python 3.13, then run:

```bash
ruff check .
mypy custom_components/plant_care_plus
pytest
```

Pull requests should include tests for changed care behavior and update the
relevant documentation.
