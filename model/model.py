# model.py
import torch
import torch.nn as nn

class Flood1DCNN(nn.Module):
    def __init__(self, in_channels, seq_len, static_dim, conv_channels=(16,32), kernel_size=3):
        super().__init__()
        layers = []
        curr_in = in_channels
        for out_ch in conv_channels:
            layers.append(nn.Conv1d(curr_in, out_ch, kernel_size=kernel_size, padding=kernel_size//2))
            layers.append(nn.ReLU())
            layers.append(nn.MaxPool1d(2))
            curr_in = out_ch
        self.conv = nn.Sequential(*layers)

        downsample = 2 ** len(conv_channels)
        conv_out_len = max(1, seq_len // downsample)
        self.conv_feat_dim = conv_channels[-1] * conv_out_len

        self.static_mlp = nn.Sequential(
            nn.Linear(static_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU()
        )

        self.head = nn.Sequential(
            nn.Linear(self.conv_feat_dim + 16, 64),
            nn.ReLU(),
            nn.Linear(64, 1)
        )

    def forward(self, series, static):
        x = self.conv(series)
        x = x.view(x.size(0), -1)
        s = self.static_mlp(static)
        h = torch.cat([x, s], dim=1)
        logits = self.head(h).squeeze(1)
        probs = torch.sigmoid(logits)
        return logits, probs
