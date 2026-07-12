/**
 * Minimal, dependency-free Isolation Forest.
 *
 * Why hand-rolled instead of a Python/scikit-learn microservice:
 * the rest of this stack is Node/Express, the feature set is tiny
 * (3 numeric features per row), and the dataset sizes for a per-vehicle
 * fuel-log history in a hackathon/demo context are small (tens to low
 * hundreds of rows). A subprocess-per-request or a standalone Python
 * service adds a second runtime, a second deploy target, and IPC/queueing
 * complexity for a workload this implementation handles in single-digit
 * milliseconds. See README for the honest limitation of this choice
 * (small-sample isolation forests are noisier than sklearn's, which uses
 * more mature splitting heuristics) — acceptable for anomaly triage,
 * not for anything safety-critical.
 *
 * Algorithm: standard Liu/Ting/Zhou isolation forest —
 * build `nTrees` random binary trees (isolation trees) over random
 * subsamples of the data; each tree recursively picks a random feature
 * and a random split value between that feature's min/max in the current
 * node, until the node has 1 point or reaches `heightLimit`. A point's
 * "path length" (average depth to isolate it across all trees) is
 * inversely related to how anomalous it is. Score is normalized via the
 * standard c(n) average-path-length-of-unsuccessful-BST-search constant.
 */

class IsolationTree {
  constructor(heightLimit) {
    this.heightLimit = heightLimit;
    this.root = null;
  }

  build(data, currentHeight = 0) {
    if (currentHeight >= this.heightLimit || data.length <= 1) {
      return { isLeaf: true, size: data.length };
    }

    const nFeatures = data[0].length;
    const featureIdx = Math.floor(Math.random() * nFeatures);
    const values = data.map((row) => row[featureIdx]);
    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
      return { isLeaf: true, size: data.length };
    }

    const splitValue = min + Math.random() * (max - min);
    const left = data.filter((row) => row[featureIdx] < splitValue);
    const right = data.filter((row) => row[featureIdx] >= splitValue);

    return {
      isLeaf: false,
      featureIdx,
      splitValue,
      left: this.build(left, currentHeight + 1),
      right: this.build(right, currentHeight + 1),
    };
  }

  fit(data) {
    this.root = this.build(data, 0);
  }

  pathLength(point, node = this.root, currentHeight = 0) {
    if (node.isLeaf) {
      return currentHeight + averagePathLength(node.size);
    }
    if (point[node.featureIdx] < node.splitValue) {
      return this.pathLength(point, node.left, currentHeight + 1);
    }
    return this.pathLength(point, node.right, currentHeight + 1);
  }
}

// c(n): average path length of an unsuccessful search in a BST of n nodes.
function averagePathLength(n) {
  if (n <= 1) return 0;
  const harmonic = Math.log(n - 1) + 0.5772156649; // Euler-Mascheroni constant
  return 2 * harmonic - (2 * (n - 1)) / n;
}

class IsolationForest {
  constructor({ nTrees = 100, subsampleSize = 64 } = {}) {
    this.nTrees = nTrees;
    this.subsampleSize = subsampleSize;
    this.trees = [];
    this.subsampleUsed = 0;
  }

  fit(data) {
    const n = Math.min(this.subsampleSize, data.length);
    this.subsampleUsed = n;
    const heightLimit = Math.ceil(Math.log2(Math.max(n, 2)));

    this.trees = Array.from({ length: this.nTrees }, () => {
      const sample = randomSubsample(data, n);
      const tree = new IsolationTree(heightLimit);
      tree.fit(sample);
      return tree;
    });
  }

  /** Returns anomaly score in [0,1]; closer to 1 = more anomalous. */
  score(point) {
    const avgPathLength =
      this.trees.reduce((sum, tree) => sum + tree.pathLength(point), 0) / this.trees.length;
    const c = averagePathLength(this.subsampleUsed);
    if (c === 0) return 0;
    return 2 ** (-avgPathLength / c);
  }

  scoreAll(points) {
    return points.map((p) => this.score(p));
  }
}

function randomSubsample(data, n) {
  const shuffled = [...data];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

/**
 * Given scores and a contamination rate, returns the score threshold above
 * which points are flagged (top `contamination` fraction by score).
 */
function thresholdForContamination(scores, contamination) {
  if (scores.length === 0) return 1;
  const sorted = [...scores].sort((a, b) => b - a);
  const cutoffIdx = Math.max(0, Math.ceil(scores.length * contamination) - 1);
  return sorted[cutoffIdx];
}

module.exports = { IsolationForest, thresholdForContamination };
