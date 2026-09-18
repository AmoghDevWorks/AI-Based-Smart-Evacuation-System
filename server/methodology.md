# Smart Evacuation System Methodology

## 1. System Objective

The system converts camera frames into evacuation recommendations through four
stages:

1. Estimate the number of people in a camera view.
2. Detect and track people across frames to measure movement and congestion.
3. Classify the current crowd state as `CLEAR`, `WARNING`, or `CONGESTION`.
4. Select a low-risk route from each room to an `exit` or `entry` node in the
	 building graph.

The analysis service runs this pipeline independently for every configured
camera. The latest result is associated with the layout node containing that
camera's `device_id`. The frontend reads the aggregated result from
`/api/analysis/{user_id}`.

## 2. Input and Layout Representation

### 2.1 Camera input

Each camera produces a BGR image frame through OpenCV. A camera can be:

- A local numeric camera identifier, such as `0` or `1`.
- A network/MJPEG URL, such as `http://device:5000/video_feed`.

The camera worker captures one frame, runs the AI pipeline, stores the latest
metrics, waits 15 seconds, and repeats. The frontend also refreshes the
analysis response every 15 seconds. The video preview itself may remain a
continuous MJPEG connection; this is separate from the AI analysis interval.

### 2.2 Building graph

The building layout is represented as a graph:

- A node represents a room, corridor, entry, or exit.
- An edge represents a traversable connection.
- `edge.data.weight` is the base traversal cost. If it is missing or zero, the
	implementation uses `1`.
- `node.data.type` identifies destinations. Nodes of type `exit` and `entry`
	are valid evacuation destinations.
- `node.data.capacity` is the maximum expected occupancy for a monitored room.

Edges are deliberately treated as bidirectional during evacuation planning.
This models the fact that people may need to move in either direction during an
emergency, regardless of the direction used while drawing the layout.

## 3. Model 1: Crowd Count Estimation

Model 1 is a DMCount-style density-regression network implemented as
`DMCountNet`.

### 3.1 Network structure

The model consists of:

- The first 23 layers of VGG16 as a frontend feature extractor.
- A dilated-convolution backend with channel sizes:
	`512 -> 512 -> 512 -> 256 -> 128 -> 64`.
- A final `1 x 1` convolution producing one density-map channel.
- ReLU activations to keep predicted density non-negative.

The trained checkpoint is loaded once and cached. CUDA is selected when
available; otherwise CPU inference is used.

### 3.2 Preprocessing

For each frame:

1. Convert OpenCV BGR to RGB.
2. Resize the image if its longest side exceeds 1024 pixels.
3. Resize both dimensions to multiples of 8, matching the network stride.
4. Convert pixels to a tensor.
5. Normalize channels using ImageNet statistics:
	 `mean=(0.485, 0.456, 0.406)` and
	 `std=(0.229, 0.224, 0.225)`.

### 3.3 Count calculation

The network predicts a density map $D(x,y)$. The estimated count is the sum of
all density-map values:

$$
\hat{N}_{\text{density}} = \sum_{x,y} D(x,y)
$$

This value is returned as `density_count`. It is a floating-point estimate and
does not necessarily equal the integer person count produced by Model 2.

## 4. Model 2: Detection, Tracking, and Flow Analysis

Model 2 uses Ultralytics YOLO for person detection and Deep SORT for temporal
tracking.

### 4.1 Person detection

The frame is converted from BGR to RGB and passed to YOLO with:

- Confidence threshold: `0.2`.
- IoU threshold: `0.3`.
- Inference image size: `1280`.

Only detections whose COCO class is `0` (`person`) are retained. Each retained
detection is represented as:

```text
([left, top, width, height], confidence, "person")
```

### 4.2 Deep SORT tracking

The detections are passed to one persistent Deep SORT tracker per camera
worker. The tracker assigns a stable track ID to people over consecutive
frames. The active count is the number of confirmed tracks:

$$
N_{\text{people}} = |\{\text{confirmed tracks}\}|
$$

This count is returned as `people`.

The tracker configuration is:

- `max_age=30`: retain a track for up to 30 missed frames.
- `n_init=3`: confirm a track after three successful observations.
- `max_cosine_distance=0.3`: appearance matching threshold.

### 4.3 Motion features

For each track, the center of its bounding box is stored in a history buffer
of up to 20 positions. Once a track has at least five positions, displacement
is used to calculate speed and direction.

For the first and latest positions $(x_1,y_1)$ and $(x_2,y_2)$:

$$
v = \frac{\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}}{L}
$$

where $L$ is the number of positions in the history. The direction angle is:

$$
	heta = \operatorname{atan2}(-(y_2-y_1), x_2-x_1) \pmod{360}
$$

The system reports the mean speed of tracks with enough history as
`avg_speed`. If no track has enough history, the value is `0.0`.

The dominant crowd direction is calculated with circular averaging rather than
ordinary arithmetic averaging:

$$
\bar{\theta}=\operatorname{atan2}\left(\frac{1}{n}\sum_i\sin\theta_i,
\frac{1}{n}\sum_i\cos\theta_i\right) \pmod{360}
$$

This avoids incorrect averages around the $0/360$ degree boundary.

### 4.4 Density and proximity clusters

Frame density is normalized by image area:

$$
\rho = \frac{N_{\text{people}}}{W \times H}
$$

It is returned as `density`.

For clustering, pairwise Euclidean distances between person centers are
calculated. A person belongs to a proximity cluster when at least three people
are present in the configured neighborhood. The default neighborhood radius is
45 pixels. The returned `clustered` value is the number of people meeting this
neighbor condition.

### 4.5 Counter-flow detection

For each tracked person with sufficient movement, the angular difference from
the dominant direction is calculated. The circular difference is constrained to
$[0,180]$ degrees. A person is counted as counter-flow when the difference is
greater than 120 degrees and the person's speed exceeds `1.5` pixels per
history step.

The system returns:

- `counter_flow`: counter-flow person count.
- `counter_pct`: counter-flow percentage:

$$
p_{\text{counter}} = \frac{N_{\text{counter}}}{N_{\text{people}}}\times100
$$

When no people are detected, `counter_pct` is `0.0`.

## 5. Congestion Evaluation

Model 2 first computes a rule-based raw state. The default thresholds are:

| Feature | Warning | Congestion |
|---|---:|---:|
| People count | at least 20 | at least 40 |
| Normalized density | at least 0.000015 | at least 0.000030 |
| Average speed | at most 3.0 | at most 1.5 |
| Clustered people | at least 15 | at least 30 |
| Counter-flow percentage | at least 15% | at least 25% |

### 5.1 Raw congestion decision

The raw state is `CLEAR` when there are no people.

The state becomes `CONGESTION` only when all congestion conditions are true:

$$
N\ge40 \land \rho\ge0.000030 \land v\le1.5
\land C\ge30 \land p_{\text{counter}}\ge25\%
$$

If that test fails, the state becomes `WARNING` when either of these warning
rules is true:

$$
N\ge20 \land \rho\ge0.000015 \land v\le3.0 \land C\ge15
$$

or:

$$
N\ge20 \land p_{\text{counter}}\ge15\%
$$

Otherwise the state is `CLEAR`.

### 5.2 Sustained state evaluation

To avoid changing the displayed state because of one unstable frame, Model 2
stores the eight most recent raw states. Until this buffer is full, the current
state remains `CLEAR`. Once full, the reported `status` is the majority state
in the buffer:

$$
	ext{status} = \operatorname{mode}(s_{t-7},...,s_t)
$$

The raw result is returned as `raw_status`; the smoothed result is returned as
`status`.

## 6. Capacity Evaluation

The analysis service combines Model 2's confirmed count with the capacity saved
on the layout node.

For a room capacity $K$ and detected people $N$:

$$
	ext{occupancy\_percent}=\frac{N}{K}\times100
$$

If $K=0$ or is invalid, occupancy percentage is unavailable. A room is
`over_capacity` when:

$$
N>K
$$

Over-capacity is promoted to `risk_level="CONGESTION"` even if the model's
risk classifier returns `CLEAR`. This ensures that a room with capacity 10 and
30 detected people produces a congestion alert and affects route planning.

## 7. Model 3: Risk Classification

Model 3 is an XGBoost classifier loaded from the serialized model file. It
receives the following seven Model 2 features:

```text
people
avg_speed
density
clustered
counter_flow
counter_pct
dominant_angle
```

The feature row is placed in a pandas DataFrame in this exact column order.
Missing angular values are converted to `NaN`; the trained model is responsible
for handling that value according to its training behavior. The predicted class
integer is decoded using the stored label encoder and returned as
`risk_level`.

If the risk model cannot be loaded or prediction fails, the pipeline falls back
to Model 2's sustained `status`. The Model 2 metrics are still preserved, and
the failure is recorded in `risk_error`.

## 8. Evacuation Planning Algorithm

### 8.1 Graph construction

The planner builds an adjacency list for every layout node. Each valid edge is
added in both directions:

```text
source -> target
target -> source
```

The base edge cost is read from `edge.data.weight`.

### 8.2 Risk-weighted edge cost

The planner modifies the base edge cost according to the risk of the node being
entered:

| Entered node risk | Penalty multiplier |
|---|---:|
| `CLEAR` | 1 |
| `WARNING` | 4 |
| `CONGESTION` | 12 |

For an edge with base weight $w$ and entered-node risk multiplier $P(r)$:

$$
w_{\text{effective}} = w\times P(r)
$$

Thus, a physically longer route may be selected when it avoids a congested
room. The source room's own risk is not charged before the first move; its risk
is still reported as `source_risk`.

### 8.3 Dijkstra shortest path

For every non-destination source node, the planner runs Dijkstra's algorithm.
It maintains:

- `distances`: lowest known weighted cost to each node.
- `previous`: predecessor used to reconstruct the route.
- A min-heap priority queue ordered by current distance.

For every neighbor, the relaxation rule is:

$$
	ext{if }d(u)+w_{\text{effective}}(u,v)<d(v),
\quad d(v)\leftarrow d(u)+w_{\text{effective}}(u,v)
$$

After traversal, the planner chooses the reachable `exit` or `entry` with the
lowest total cost. It reconstructs the route by following `previous` pointers
backward and reversing the result.

### 8.4 Planner outputs

For a successful route, the API returns:

- `from` and `from_label`.
- `destination` and `destination_label`.
- `status="ROUTE_AVAILABLE"`.
- `cost`.
- `route`: node IDs.
- `route_labels`: human-readable path labels.
- `source_risk`.
- `reason` explaining that risk-weighted routing was used.

If the source is disconnected from every destination, the planner returns
`NO_ROUTE`. If the layout has no `exit` or `entry` nodes, it returns
`NO_DESTINATION` with instructions to add one. These explicit statuses prevent
the dashboard from silently showing an empty recommendation list.

## 9. End-to-End Evaluation Flow

For each analysis cycle:

```text
Camera frame
		|
		+--> Model 1: density-map sum -> density_count
		|
		+--> Model 2: YOLO -> Deep SORT -> motion/congestion metrics
		|                         |
		|                         +--> raw_status -> 8-frame majority -> status
		|
		+--> Model 3: XGBoost risk classification -> risk_level
		|
		+--> Capacity comparison: people versus node capacity
		|
		+--> Layout graph + risk penalties -> Dijkstra route planner
		|
		+--> API response: metrics, alerts, and evacuation_plan
```

The route planner is recalculated whenever the analysis endpoint is requested,
using the latest completed camera metrics. The frontend displays the returned
recommendations in Live Monitoring and the Building Map.

## 10. Current Evaluation Scope and Limitations

The current repository implements runtime inference and rule-based route
evaluation, but it does not contain a separate offline benchmark harness. The
following metrics are therefore not automatically calculated by the current
code:

- DMCount MAE/RMSE against annotated crowd counts.
- YOLO precision, recall, mAP, or person-detection confusion matrices.
- Deep SORT IDF1, MOTA, or ID-switch counts.
- XGBoost accuracy, precision, recall, F1, ROC-AUC, or a held-out confusion
	matrix.
- Route success rate, evacuation time, or simulated travel-time reduction.

For a formal evaluation, a labeled test set should be divided into training,
validation, and test partitions. Model 1 should be evaluated with MAE and RMSE;
Model 2 with detection and tracking metrics; Model 3 with a held-out
classification report; and the planner with graph scenarios measuring route
availability, selected-route cost, congestion avoidance, and evacuation-time
simulation. The live dashboard values are operational outputs, not a substitute
for those offline validation metrics.
