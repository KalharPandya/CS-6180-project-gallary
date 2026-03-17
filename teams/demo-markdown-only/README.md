# Reinforcement Learning for Robot Navigation

## Team Members
- Alice Chen (alice.chen@university.edu)
- Bob Martinez (bob.martinez@university.edu)
- Carol Liu (carol.liu@university.edu)

## Abstract
We present a deep reinforcement learning approach for autonomous robot navigation in dynamic indoor environments. Our method combines a Proximal Policy Optimization (PPO) agent with a learned map representation, achieving a 94% task completion rate while reducing collision frequency by 67% compared to classical path planning baselines.

## Demo Video

<video width="720" controls>
  <source src="assets/demo.mp4" type="video/mp4">
</video>

## Key Results

![Navigation Results](assets/thumbnail.svg)

| Method | Task Completion | Collisions/Episode | Avg. Time (s) |
|--------|----------------|-------------------|---------------|
| A* Planning | 78% | 1.4 | 42 |
| DWA | 81% | 1.1 | 38 |
| **Ours (PPO+Map)** | **94%** | **0.46** | **31** |

## Approach

### Environment
We trained and evaluated in a simulated office environment using PyBullet with 15 randomized room layouts. The observation space includes a 64×64 depth image, goal direction vector, and robot velocity.

### Model Architecture
Our policy network consists of:
- A **CNN encoder** for depth images (3 conv layers, 128-dim embedding)
- A **GRU** for temporal context (256 hidden units)
- A **map module** that maintains a top-down occupancy estimate
- Two MLP heads for policy (actions) and value function

```python
class NavPolicy(nn.Module):
    def __init__(self):
        super().__init__()
        self.encoder = CNNEncoder(out_dim=128)
        self.gru     = nn.GRU(128 + 2, 256, batch_first=True)
        self.map     = OccupancyModule(grid_size=32)
        self.policy  = nn.Linear(256 + 32*32, 4)
        self.value   = nn.Linear(256 + 32*32, 1)
```

### Training
- **Algorithm:** PPO with GAE (λ=0.95, γ=0.99)
- **Batch size:** 2048 steps across 8 parallel envs
- **Training time:** ~12 hours on a single RTX 3090

## Results & Analysis

The map module proved critical — without it, completion rate dropped to 83%. Qualitative analysis shows the agent learns to hug walls and slow near obstacles, behaviors that emerged without explicit reward shaping.

**Failure modes** primarily occur in narrow doorways (<0.6 m) and highly cluttered scenes with >12 dynamic obstacles.

## References
- [Schulman et al., 2017 — PPO](https://arxiv.org/abs/1707.06347)
- [Savva et al., 2019 — Habitat](https://arxiv.org/abs/1904.01201)
- [PyBullet](https://pybullet.org)
