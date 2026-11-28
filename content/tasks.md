## The data

- **Detectors:** real LIGO strain from the third observing run (O3), from Hanford and Livingston, at 16,384 Hz.
- **Signals:** simulated short bursts (under 10 s) added to the strain.
- **Training data:** from the first half of the run (O3a). One set has injected signals and one has noise only. Where every signal is, and what it is, is documented.
- **Test data, sealed:** from the second half (O3b), with the same two parts. The signals are hidden.
- **Noise conditions:** the injection and noise sets alternate in blocks of about one day from the same run. They see the same noise conditions but share no data.
- **No real events:** one detector's data is shifted in time against the other's, so only the injected signals line up between the detectors.
- **Training signals, 39 waveforms:**
  - 19 sine-Gaussians: a sine wave under a bell-shaped envelope;
  - 16 white-noise bursts: a short burst of random noise in a frequency band;
  - 4 binary black hole mergers on circular orbits.
- **Test signals:** the same 39, plus five classes the agent never sees in training.
- **Against gaming:**
  - the test set's GPS times are shifted by a secret amount;
  - the search runs with no network. O3 strain is public, so subtracting it from the data would reveal every injection.
- **Hosting:** the data is not on Hugging Face, and where the benchmark will host it is not decided yet.

## Reference searches

- Simple, honest searches will set the bar for the agents.
- Three deliberately crude toy searches are frozen to test the pipeline: an excess-power search, a small one-dimensional convolutional network on whitened 1 s windows, and an autoencoder trained on noise only.
- On one day of training data all three ran end to end, with background from time slides. Their false-alarm rates were honest on held-out noise, and they found almost nothing, as expected for toys. They are not baselines; a real baseline is still to come.

Draft design: [design note](https://github.com/kyoon-mit/agentic-ligo/blob/ligo-benchmarks/docs/LIGO_BENCHMARKS_DESIGN.md).
