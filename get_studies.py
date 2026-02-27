#!/usr/bin/env python3

import os
import urllib.request
import urllib.error
import subprocess

INPUT_FILE = "lichess_study_list.txt"
OUTPUT_DIR = "pgn"
GIT_COMMIT_MSG = "updated studies pgn"

os.makedirs(OUTPUT_DIR, exist_ok=True)

downloaded_files = []

with open(INPUT_FILE, "r") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue

        study_id = line.split()[0]
        url = f"https://lichess.org/study/{study_id}.pgn"
        output_path = os.path.join(OUTPUT_DIR, f"{study_id}.pgn")

        print(f"Downloading {study_id}...")

        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(req) as response:
                content = response.read()

            with open(output_path, "wb") as out:
                out.write(content)

            print(f"Saved to {output_path}")
            downloaded_files.append(output_path)

        except urllib.error.HTTPError as e:
            print(f"HTTP error for {study_id}: {e.code}")
        except urllib.error.URLError as e:
            print(f"URL error for {study_id}: {e.reason}")

print("Done.")