# mlnode-editor Quickstart

Draw a neural network in the browser and train it with PyTorch — in about five minutes.

## 1. Run the Editor

```bash
git clone https://github.com/Nasser-Obeid/MLnode-editor.git && cd MLnode-editor
npm install
npm run dev
```

Open **http://localhost:5173**. Requires Node 18+. No server or backend needed — the editor is fully client-side.

## 2. Draw Your First Model

An `Input` node is already on the canvas. Build a small MLP around it:

1. In the left palette, expand **Linear** and drag a **Linear** node onto the canvas. Drag on a **ReLU** (under *Non-linear Activations*) and one more **Linear**.
2. **Connect** them: drag from each node's right-side handle to the next node's left-side handle, in order — Input → Linear → ReLU → Linear.
3. **Click** the first Linear node and set its params in the right panel: `in_features: 784`, `out_features: 128`. Set the second Linear to `in_features: 128`, `out_features: 10`.
4. **Right-click** the last Linear node to mark it as the model output (it gets a yellow border and an `OUTPUT` badge).
5. Click the **Input node** and set the input shape to `B` and `784` (use `− Remove last` / `+ Add dim` to get two dimensions). `B` is a symbolic batch dimension.
6. Give the model a name in the toolbar — it becomes the exported filename.

Tips: **Tidy** (wand icon) auto-arranges the graph; `Ctrl/Cmd+Z` undoes; `Delete` removes the selection.

## 3. Validate and Export

Click **Validate** — you should see *"Graph is valid (4 nodes, 3 edges)"*. Then **Export** to download `<name>.mlnode.json`. (Export refuses and shows toasts if the structure is broken; `Ctrl/Cmd+S` force-saves without validation.)

## 4. Train It with the Python Backend

Install [mlnode](https://github.com/Nasser-Obeid/MLnode) (`pip install mlnode` — see its [QUICKSTART](https://github.com/Nasser-Obeid/MLnode/blob/main/QUICKSTART.md)), then:

```python
import torch
import torch.nn.functional as F
from mlnode import MLnodeModel

model = MLnodeModel.load("my-model.mlnode.json")   # the file you just exported
print(model.validate().valid)                      # static shape check → True

module = model.build()                             # a regular nn.Module
x = torch.randn(64, 784)
y = torch.randint(0, 10, (64,))
optimizer = torch.optim.Adam(module.parameters(), lr=1e-3)

for step in range(5):
    optimizer.zero_grad()
    loss = F.cross_entropy(module(x), y)
    loss.backward()
    optimizer.step()
```

The editor checks graph *structure*; tensor *shapes* are verified by the backend's `model.validate()`. If it reports shape errors, fix the params in the editor and re-export.

## 5. Round-Trip

**Import** in the toolbar opens any `.mlnode.json` — including hand-written ones and the examples in [`mlnode/examples/`](https://github.com/Nasser-Obeid/MLnode/tree/main/examples). Imported graphs are auto-laid-out (the format carries no positions).

## Where to Go Next

- Every UI surface in detail: [docs/user-guide.md](docs/user-guide.md)
- Multi-input layers (labeled ports), `Split` output ports, weight sharing: [docs/user-guide.md](docs/user-guide.md)
- How the editor maps to the JSON format: [docs/architecture.md](docs/architecture.md)
