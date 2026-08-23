#!/usr/bin/env python3
"""TEKMAX REVIEW — watcher za nove komentare.
No-agent watchdog: stdout ide na Telegram samo kad ima NOVIH komentara od Mile-a.
Prazan stdout = tiho (nema spama).
State: _review/.watch_state.json (slug -> [comment ids već prijavljeni])
"""
import json, os, sys

REVIEW = "/Volumes/4T MAXA01/temp/tekmax/_review"
STATE_FILE = os.path.join(REVIEW, ".watch_state.json")

def load_state():
    try:
        with open(STATE_FILE) as f:
            return json.load(f)
    except Exception:
        return {}

def main():
    # skeniramo direktno articles/*.json — index.json ne prati nove komentare
    arts_dir = os.path.join(REVIEW, "articles")
    state = load_state()
    fresh = []
    try:
        files = sorted(os.listdir(arts_dir))
    except Exception as e:
        print(f"⚠️ Review watcher: ne mogu da čitam articles/: {e}")
        return
    for fn in files:
        if not fn.endswith(".json"):
            continue
        slug = fn[:-5]
        try:
            with open(os.path.join(arts_dir, fn)) as f:
                art = json.load(f)
        except Exception:
            continue
        title = ((art.get("meta") or {}).get("title")) or slug
        seen = set(state.get(slug, []))
        for c in art.get("comments", []):
            if c.get("author") == "mile" and c.get("status") == "new" and c.get("id") not in seen:
                fresh.append((slug, title, c))
                seen.add(c.get("id"))
        state[slug] = sorted(seen)

    if fresh:
        lines = ["📝 **Novi komentari u TEKMAX REVIEW panelu:**", ""]
        for slug, title, c in fresh:
            ttype = {"image": "🖼️ Slika", "text": "📝 Tekst", "general": "💬 Opšte"}.get(c.get("type", "general"), "💬")
            text = (c.get("text") or "").strip()
            if len(text) > 160:
                text = text[:157] + "..."
            lines.append(f"**{title[:60]}**")
            lines.append(f"{ttype} ({slug})")
            lines.append(f"> {text}")
            lines.append("")
        lines.append("Otvori panel: https://evaluation-realtor-vegas-modular.trycloudflare.com")
        print("\n".join(lines))
        with open(STATE_FILE, "w") as f:
            json.dump(state, f, indent=2)

if __name__ == "__main__":
    main()
