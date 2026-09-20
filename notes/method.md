# Mathematical Methodology: Conformal Microgrid Dispatch

## 1. Non-Parametric Quantile Prediction
Let $Y_t \in \mathbb{R}$ denote rooftop solar generation at hour $t$, and $X_t$ represent exogenous meteorological features (irradiance, cloud cover). We calculate non-conformity scores over historical hold-out calibration observations:
$$s_i = |Y_i - \hat{\mu}(X_i)|$$
For significance level $\alpha = 0.05$, the conformal prediction interval is:
$$C(X) = [\hat{\mu}(X) - q_{1-\alpha}, \; \hat{\mu}(X) + q_{1-\alpha}]$$
where $q_{1-\alpha}$ is the empirical $(1-\alpha)(1 + 1/n)$-th quantile of residuals.

## 2. Load Shifting Optimization
Given a set of flexible loads $\mathcal{L}$, each load $l \in \mathcal{L}$ requires duration $d_l$ and power $P_l$. The placement problem is formulated as:
$$\min \max_{t \in \{1 \dots 24\}} \left( D_{\text{base}}(t) + \sum_{l \in \mathcal{L}} P_l \cdot \mathbb{I}_{\{t \in [s_l, s_l + d_l)\}} - P_{05}(t) \right)$$
subject to:
$$s_l + d_l \le \text{deadline}_l, \quad \forall l \in \mathcal{L}$$
$$D_{\text{total}}(t) \le 250\text{ kW (Transformer Rating)}, \quad \forall t$$
