# LIGO benchmarks: design proposal (draft)

Status: draft for discussion. Nothing here is built yet.

## 1. The goal

- We want to test whether an AI agent can run a gravitational-wave search on
  its own, from raw strain data to a list of detected events.
- We use the same idea as the H→4ℓ task in this repo:
  - the agent builds its search on one public dataset where it can see the
    answer;
  - we freeze its code and run it, unchanged, on many sealed datasets with
    hidden injected signals;
  - a good search finds the hidden signals and reports honest numbers; a lazy
    or overfitted one does not.
- The search should find two kinds of signals:
  - **CBC**: compact binary mergers (black holes, neutron stars). We know what
    these look like, so standard template searches can find them.
  - **Bursts / anomalies**: short signals with no known shape (for example
    sine-Gaussians or white-noise bursts). These test anomaly detection: can
    the agent find something it was not told to look for?

## 2. Who does what

- **EM:** prepares the data (noise and injected signals).
- **Us:** define the benchmarks, meaning what the agent must output, how we
  score it, and how we check that the scoring cannot be cheated.

## 3. The data

EM built the data in October 2026. The facts below come from his O3 Burst
Benchmark Handbook. The handbook is for organizers only, so this note leaves
out the test set's design (held-out signal classes, block pattern, time
shifts). Read the handbook for those.

- **Noise:** real LIGO O3 strain, from H1 and L1 only (no Virgo), at
  16,384 Hz.
- **Signals:** simulated short bursts (under 10 s) added to the strain.
- **Four datasets**, 6.8 TB in total, on the CIT cluster:
  - `o3a-train-inj`: training data with injections (1.90 TB);
  - `o3a-train-noise`: training data with no injections (1.88 TB);
  - `o3b-test-inj`: sealed test data with injections (1.92 TB);
  - `o3b-test-noise`: sealed test data with no injections (1.14 TB).
- **Training signals, 39 waveforms:** 19 sine-Gaussians, 16 white-noise
  bursts, 4 binary black hole mergers on circular orbits.
- **Test signals, 70 waveforms:** the same 39, plus classes the agent never
  sees in training.
- **Injection and noise sets** come from alternating one-day blocks of the
  same run. They see the same noise conditions but share no data.
- **No real events line up:** L1 is shifted in time against H1, so only the
  injections are coincident in the two detectors.
- **Files:**
  - frames: `{H,L}-{H1,L1}_BurstBenchmark-<t0>-4096.gwf`, 4096 s each, about
    515 MB, channel `{H1,L1}:STRAIN_BURST_0`;
  - segment lists: `segments.<dataset>.{h1,l1}`, the only time a search
    should analyse (the frames hold NaN outside it);
  - answer key: one pickle per frame,
    `truth/<dataset>/injection_info_dictionary-<T>-4096.pickle`.
- **What the agent gets:** the two training sets, their segment lists, the
  training answer key, and a plain description of the training classes.
- **What the agent never gets:** the test answer key, anything in the
  handbook's "never give to agents" list, and any network or LIGO data mount
  (O3 strain is public, so an agent with network access could subtract it and
  see every injection).

### Where the data is hosted (open)

- The data sits on CIT, in EM's home directory. The harness does not run
  there yet.
- The training sets must be readable where agents develop. The test sets and
  their answer key must be readable where the harness scores, and nowhere an
  agent can reach.
- The full set does not fit on the group machine (2.2 TB free, 6.8 TB
  needed). A subset has to be chosen, or the scoring has to run at CIT.
- Not decided: which host, and which subset.

## 4. What the agent must hand in

- A pipeline: `run.sh <dataset> <output>`, same as the H→4ℓ task.
- For each dataset, a **trigger list**: a CSV file with one row per candidate
  event. We follow the format of the LVK burst pipeline benchmark ("How to
  benchmark your pipeline", its columns 1 to 3):
  - column 1: start GPS time, in seconds;
  - column 2: end GPS time, in seconds;
  - column 3: **FAR**, in Hz: how often noise alone would produce something
    this loud.
- Later, optionally: sky position (right ascension and declination, in
  radians; columns 8 and 9 of the same format).
- Not in the first version: a separate ranking number, the list of detectors,
  a signal label, and p_astro (see 5.3).

## 5. The benchmarks

We compute every benchmark ourselves from the trigger list and the secret
injection list. We do not trust numbers the agent computes about itself.

### 5.1 Sensitivity at a fixed FAR

- **Question:** how far out can the search see, if we only accept
  candidates that noise would produce less than once per month (or year)?
- **How:**
  - pick a FAR threshold (proposal: 1 per month and 1 per year);
  - an injection counts as found if a trigger's start-to-end interval
    overlaps it in time (plus a tolerance, fixed before we see results) and
    its FAR is below the threshold;
  - turn the found fraction into a **sensitive volume** (how much of space the
    search covers), or the matching **sensitive distance**;
  - compare with our reference search: the score is the ratio.
- Rules from the handbook's scoring guidance:
  - count only injections that are usable in both detectors (inside both
    segment lists, with a finite SNR);
  - an injection that crosses a frame boundary is listed twice in the answer
    key: merge the two copies, adding their SNRs in quadrature;
  - a trigger that matches an unusable or excluded injection is dropped: it
    counts neither as found nor as a false alarm;
  - leave out the two waveforms the handbook marks as broken;
  - report the found fraction per waveform, against signal amplitude (hrss)
    and against network SNR. Compare classes at a fixed SNR, because some
    classes were injected louder than others;
  - report the training classes and the held-out classes separately. The gap
    between the two measures how well the search generalizes.

### 5.2 FAR honesty

- **Question:** is the FAR the agent reports true?
- **Why it matters:** an agent can look more sensitive by claiming lower FARs
  than it should.
- **How:** on the noise set of the same split, count how many triggers pass
  each FAR threshold and compare with what the claimed FAR predicts. Too many
  means the FARs are too optimistic.
- The agent may slide L1 against H1 in time within the noise set to get more
  background (the handbook allows any shift).
- Sensitivity credit (5.1) only counts if this check passes.

### 5.3 p_astro (on hold)

On hold: the first trigger list has no p_astro column. This section applies
once that column is added.

- **Question:** when the agent says "70 % chance this is real", is it right
  about 70 % of the time?
- **How:**
  - every candidate gets a true label from the injection list (real or noise);
  - **Brier score**: the average of (p_astro − truth)²; lower is better;
  - **reliability plot**: group candidates by their p_astro, and plot the
    fraction that were really signals. A perfect agent sits on the diagonal.
- Also checked on the noise set, where every p_astro should be low.

### 5.4 Latency

- **Question:** how fast does the search produce a candidate after the data
  arrives?
- **Today the harness cannot measure this**: it only records the total run
  time per dataset.
- **Proposal:**
  - phase 1: report total run time per dataset (already measured) in a table;
  - phase 2: a "streaming" mode where we feed the data in pieces and record
    when each trigger appears. This needs a change to the runner and is a
    separate PR.
- Latency is report-only at first (no effect on the score).

### 5.5 Cheating check

- About 3 % of the usable injections have a network SNR below 2. No real
  search can see them.
- A submission that finds many of them with high significance has most
  likely subtracted the public LIGO data. We flag it.

### 5.6 Standard plots (report only, no score)

These are the plots GW papers usually show. We generate them for every run.

- **IFAR plot:** the number of candidates above each inverse FAR, compared with
  what noise alone would give. Real signals show up as an excess at the loud
  end.
- **Found / missed plot:** each injection as a dot (distance vs mass or
  time), colored found or missed. It shows where the search goes blind.
- **Efficiency curve:** the found fraction vs signal amplitude (hrss) or
  network SNR, per waveform, at a fixed FAR.
- **Sensitive distance vs FAR:** the main plot of the MLGWSC-1 challenge.
- **Reliability plot** for p_astro (5.3), once p_astro exists.
- **Latency histogram**, once phase 2 exists.

## 6. Making sure the score cannot be cheated

The repo tests its scoring with fake submissions that cheat on purpose
("attackers"). Each one must score below the honest reference. If one does
not, the scoring has a hole. Proposed LIGO attackers:

- **Flat FAR:** the same FAR for every candidate. Caught by sensitivity (it
  cannot separate signal from noise) or by FAR honesty.
- **Always sure / never sure:** p_astro = 0.99, or 0, for every candidate.
  On hold with 5.3.
- **FAR liar:** a real search, but FARs divided by 10. Caught by FAR honesty
  (5.2).
- **Memorizer:** copies the training set's injection times. Caught on the
  test set, where the times are different.
- **One detector only:** skips the coincidence between detectors. Caught by
  glitches producing many false alarms.
- **Crasher:** fails on some datasets. Caught by the failed-dataset charge.

The existing sandbox tests ("adversarial" cases: reading the answer key,
using the network, escaping the folder) are reused as they are. We add one
for a smuggled event catalog file.

## 7. What changes in the harness

- **A new output kind,** `sbh/kinds/detection_catalog/`: reads the trigger
  list, matches it to injections, and computes the benchmarks above.
- **A new task,** `tasks/gw_search/`: describes the data, the prompt, and the
  contract. It plugs into EM's data.
- **A reference search,** `submissions/reference_gw/`: a simple, honest
  pipeline that sets the bar (for example matched filtering for CBC plus an
  excess-power search for bursts).
- **Three small core changes:**
  - allow scoring without a single "measured number with error bars", since
    our main answer is a list of events;
  - let the output kind decide what "the reference passes" means;
  - allow a different base software environment per task (GW tools such as
    gwpy, not just the HEP stack).
- **Hygiene:** forbid shipping `.gwf`, `.xml` and `.csv` files inside the
  submission, so nobody can hide a pre-made event list. (The trigger list is
  written at run time, so it is not affected.)

## 8. Plan

- **PR 1, toy:** the new kind plus a toy task with simple Gaussian noise and
  simple injected bursts and chirps. It proves the scoring and the attackers
  work, with no real LIGO data. This is the GW version of the existing
  `gauss_peak` toy.
- **PR 2, real data:** plug in EM's O3 datasets and a real reference search.
- **PR 3, latency:** the streaming runner mode.

## 9. Open questions

- **For EM:**
  - where the data is hosted for the harness (section 3);
  - the harness runs a frozen pipeline on many sealed datasets, but there is
    one test set: is it cut into several pieces, and how?
- **Scoring and harness:**
  - the FAR thresholds (the LVK burst benchmark uses 1 per 10 years);
  - how much weight each benchmark gets in the final score;
  - the three core changes in section 7.
- **For us:**
  - the time tolerance when matching a trigger to an injection;
  - whether to also require the list of analysed time segments, as the LVK
    burst benchmark does;
  - when to add p_astro and sky position to the trigger list.
