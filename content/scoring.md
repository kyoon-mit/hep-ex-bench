## How a search is scored

### What the search hands in

For each dataset, a CSV file with one row per candidate event:

| Column | Content |
|---|---|
| 1 | Start GPS time, in seconds |
| 2 | End GPS time, in seconds |
| 3 | False-alarm rate, in Hz: how often noise alone would produce a candidate this loud |

Sky position (right ascension and declination) may be added later as two more columns.

### Matching triggers to signals

- A trigger matches an injected signal when its start-to-end interval overlaps the signal in time, within a tolerance. The tolerance is 0.1 s for now; the final value will be fixed before any results are seen.
- Only signals that lie in analysable time in both detectors, with a computable signal-to-noise ratio, are scored.
- A trigger that matches a signal that is not scored is dropped. It counts neither as found nor as a false alarm.
- Waveforms with known defects in the injected data are left out of every metric.

### Sensitivity at a fixed false-alarm rate

- Only triggers with a false-alarm rate below the threshold count. A signal is found if such a trigger matches it.
- The fraction found is reported per waveform, against the signal's amplitude (hrss) and against its signal-to-noise ratio in the two detectors combined.
- Classes are compared at a fixed signal-to-noise ratio, since some were injected louder than others.
- For testing, the main threshold is 1 per week. The final threshold is not chosen yet.

### Honest false-alarm rates

- The search also runs on noise-only data from the same half of the run.
- On that data, the number of triggers below each false-alarm rate must agree with what the claimed rates predict (rate × analysed time). Many more than predicted means the claimed rates are dishonest.
- A search may estimate its background by time slides: shifting one detector's data against the other's, so that any coincidence comes from noise alone.
- Sensitivity counts only for a search whose false-alarm rates are honest.

### Generalization

- The training signal classes and the held-out classes are reported separately.
- The gap between the two measures how well the search finds signals it was never shown.

### Too-faint signals

- Some injected signals are too faint for any real search to see (signal-to-noise ratio below 2 in the two detectors combined).
- A search that finds many of them has seen the answer, for example by subtracting the public LIGO data, and is flagged.
- A search that reads the answer key passes the honesty check, because it reports nothing on noise. Only this check catches it.

### Testing the scorer

The scorer is tested with fake trigger lists:
- one that reports nothing;
- triggers every second, with honest rates and with dishonest ones;
- random triggers with dishonest rates;
- one that reads the answer key.

Each behaves as designed: the dishonest lists fail the honesty check, and the list that reads the answer key is caught by the too-faint check ([27 November update](https://kyoon-mit.github.io/projects/agentic-ligo/updates/2026-11-27-first-scoring-run/)).

### Not decided yet

- the final false-alarm-rate threshold and the final matching tolerance (1 per week and 0.1 s for testing);
- whether the search also hands in the list of time it analysed;
- a single combined score, and how runs are ranked;
- how the test set is cut into sealed pieces;
- later: the probability that a candidate is a real signal, and latency.
