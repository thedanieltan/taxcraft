# Maintenance model

TaxCraft is designed for routine maintenance by autonomous workflows.

A production rule change must begin with an allowlisted official source. One worker prepares a candidate patch and another independently verifies the source values and effective date. Required checks are deterministic and a failed gate cannot be overridden by a confidence score.

Each jurisdiction keeps at most three supported tax years. Adding a fourth retires the oldest from runtime, API discovery, active monitoring and current documentation. Accepted historical versions are not reviewed on a schedule.

When source material is ambiguous, the new or affected version remains unsupported. Existing unaffected versions continue to run.
