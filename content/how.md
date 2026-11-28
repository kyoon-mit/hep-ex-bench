## How it works

- An AI agent builds a gravitational-wave burst search on documented training data, where it can see where the signals are.
- Its search is a folder with a script, `run.sh <dataset> <out>`, that writes a trigger list. The search is then frozen and run, unchanged and offline, on a sealed test set whose signals are hidden.
- Each trigger list is scored against the hidden answer key:
  - how many signals the search finds at a fixed false-alarm rate;
  - whether its false-alarm rates are honest;
  - how well it finds signal classes it never saw in training;
  - whether it found signals that no real search could see.
- The design follows the group's high energy physics benchmark, [HEP-Ex-Bench](https://github.com/hep-ex-bench/hep-ex-bench), and runs in the same harness.
- **Status:** a first scorer runs on the training data. The task is not yet in the benchmark, and no agent has been run on it.
