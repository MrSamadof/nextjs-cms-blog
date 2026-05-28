"""
Backfill content for published Hygraph posts that have null/empty content.
Fetches article text from sourceUrl, generates Uzbek HTML via Claude,
updates the post, and re-publishes it.
"""
import os
import re
import sys
import time
import json

import requests
import anthropic
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))

GRAPHCMS_ENDPOINT = os.getenv("NEXT_PUBLIC_GRAPHCMS_ENDPOINT")
HYGRAPH_WRITE_TOKEN = os.getenv("HYGRAPH_WRITE_TOKEN")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

HEADERS = {
    "Authorization": f"Bearer {HYGRAPH_WRITE_TOKEN}",
    "Content-Type": "application/json",
}

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


# ---------------------------------------------------------------------------
# Hygraph helpers
# ---------------------------------------------------------------------------

def fetch_posts_needing_content() -> list:
    """Return published posts where content html is null/empty and sourceUrl exists."""
    query = """
    {
      blogs(
        where: { sourceUrl_not: null }
        stage: PUBLISHED
        first: 200
      ) {
        id
        title
        sourceUrl
        content { html }
      }
    }
    """
    response = requests.post(GRAPHCMS_ENDPOINT, json={"query": query}, headers=HEADERS)
    response.raise_for_status()
    blogs = response.json().get("data", {}).get("blogs", [])
    # Keep only those with null or empty content
    needing = [
        b for b in blogs
        if not (b.get("content") or {}).get("html", "").strip()
    ]
    return needing


def update_blog_content(blog_id: str, content_ast: dict) -> dict:
    mutation = """
    mutation UpdateBlog($id: ID!, $content: RichTextAST) {
      updateBlog(where: { id: $id }, data: { content: $content }) {
        id
        title
      }
    }
    """
    response = requests.post(
        GRAPHCMS_ENDPOINT,
        json={"query": mutation, "variables": {"id": blog_id, "content": content_ast}},
        headers=HEADERS,
    )
    response.raise_for_status()
    return response.json()


def publish_blog(blog_id: str) -> dict:
    mutation = """
    mutation {
      publishBlog(where: { id: "%s" }, to: PUBLISHED) {
        id
      }
    }
    """ % blog_id
    response = requests.post(GRAPHCMS_ENDPOINT, json={"query": mutation}, headers=HEADERS)
    response.raise_for_status()
    return response.json()


# ---------------------------------------------------------------------------
# Content helpers (mirrors rss_agent.py)
# ---------------------------------------------------------------------------

def fetch_article_text(url: str) -> str:
    try:
        response = requests.get(url, headers=BROWSER_HEADERS, timeout=15)
        response.raise_for_status()
        html = response.text
        html = re.sub(
            r"<(script|style|nav|footer|header|aside|noscript)[^>]*>.*?</(script|style|nav|footer|header|aside|noscript)>",
            " ", html, flags=re.DOTALL | re.IGNORECASE,
        )
        text = re.sub(r"<[^>]+>", " ", html)
        text = re.sub(r"\s+", " ", text).strip()
        return text[:3000]
    except Exception as e:
        print(f"    Fetch error: {e}")
        return ""


def generate_content_html(title: str, article_text: str) -> str:
    """Call Claude to generate a 400-600 word Uzbek HTML article body."""
    prompt = f"""You are a tech journalist writing for an Uzbek-language blog. Based on the article below, write a full informative article in Uzbek (400-600 words).

Title: {title}
Article text: {article_text}

Output ONLY the HTML article body. Use only these tags: <h2>, <p>, <ul>, <li>.
No DOCTYPE, no <html>/<body> wrapper, no inline styles, no classes, no markdown.
Start directly with the first tag.
"""
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text.strip()


def html_to_richtext_ast(html: str) -> dict:
    """Convert <p>/<h2>/<ul><li> HTML to Hygraph RichTextAST."""
    nodes = []
    pattern = re.compile(r"<(h2|p|ul)>(.*?)</(h2|p|ul)>", re.DOTALL | re.IGNORECASE)
    for match in pattern.finditer(html):
        tag = match.group(1).lower()
        inner = match.group(2)
        if tag == "h2":
            text = re.sub(r"<[^>]+>", "", inner).strip()
            if text:
                nodes.append({"type": "heading-two", "children": [{"text": text}]})
        elif tag == "p":
            text = re.sub(r"<[^>]+>", "", inner).strip()
            if text:
                nodes.append({"type": "paragraph", "children": [{"text": text}]})
        elif tag == "ul":
            items = re.findall(r"<li>(.*?)</li>", inner, re.DOTALL | re.IGNORECASE)
            list_children = []
            for item in items:
                text = re.sub(r"<[^>]+>", "", item).strip()
                if text:
                    list_children.append({
                        "type": "list-item",
                        "children": [{"type": "list-item-child", "children": [{"text": text}]}],
                    })
            if list_children:
                nodes.append({"type": "bulleted-list", "children": list_children})
    if not nodes:
        fallback = re.sub(r"<[^>]+>", "", html).strip()
        if fallback:
            nodes.append({"type": "paragraph", "children": [{"text": fallback}]})
    return {"children": nodes}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("Backfill Content Agent starting...\n")

    if not all([GRAPHCMS_ENDPOINT, HYGRAPH_WRITE_TOKEN, ANTHROPIC_API_KEY]):
        raise EnvironmentError("Missing one or more required environment variables.")

    posts = fetch_posts_needing_content()
    print(f"Found {len(posts)} post(s) with missing content.\n")

    if not posts:
        print("Nothing to backfill.")
        return

    ok = 0
    skipped = 0
    failed = 0

    for i, post in enumerate(posts, 1):
        blog_id = post["id"]
        title = post["title"]
        source_url = post.get("sourceUrl", "")
        print(f"[{i}/{len(posts)}] {title[:70]}")
        print(f"         id={blog_id}")
        print(f"         sourceUrl={source_url}")

        # 1. Fetch article text
        time.sleep(1)
        article_text = fetch_article_text(source_url) if source_url else ""
        if not article_text:
            print("         No article text — skipping.\n")
            skipped += 1
            continue
        print(f"         Fetched {len(article_text)} chars of article text.")

        # 2. Generate Uzbek HTML via Claude
        try:
            time.sleep(1)
            content_html = generate_content_html(title, article_text)
            print(f"         Claude returned {len(content_html)} chars of HTML.")
        except Exception as e:
            print(f"         Claude error: {e}\n")
            failed += 1
            continue

        # 3. Convert to RichTextAST
        content_ast = html_to_richtext_ast(content_html)
        node_count = len(content_ast.get("children", []))
        print(f"         AST nodes: {node_count}")

        # 4. Update post
        try:
            time.sleep(1)
            result = update_blog_content(blog_id, content_ast)
            if "errors" in result:
                print(f"         Update error: {result['errors']}\n")
                failed += 1
                continue
            updated_title = result.get("data", {}).get("updateBlog", {}).get("title", "?")
            print(f"         Updated: {updated_title}")
        except Exception as e:
            print(f"         Update request error: {e}\n")
            failed += 1
            continue

        # 5. Re-publish
        try:
            time.sleep(1)
            publish_blog(blog_id)
            print(f"         Published: id={blog_id}")
        except Exception as e:
            print(f"         Publish error: {e}")

        ok += 1
        print()

    print(f"Done. Updated: {ok}  Skipped (no text): {skipped}  Failed: {failed}")


if __name__ == "__main__":
    main()
